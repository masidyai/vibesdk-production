/**
 * Puppeteer-agnostic console-log capture core.
 *
 * Both the in-worker `BindingCaptureClient` (which uses
 * `@cloudflare/puppeteer` against the `BROWSER` binding) and the
 * out-of-worker dev sidecar (which uses regular `puppeteer`) feed a
 * `Page` here so navigation + listener wiring lives in exactly one
 * place.
 */

import type {
	CapturePage,
	CapturePayload,
	BrowserConsoleCaptureResult,
	BrowserConsoleEntry,
	BrowserConsolePageError,
	BrowserConsoleRequestFailure,
	BrowserFrontendInspection,
} from './types';

const PAGE_LOAD_TIMEOUT_MS = 30_000;

const FRONTEND_INSPECTION_SCRIPT = `(() => {
	const stylesheets = Array.from(document.querySelectorAll('link[rel~="stylesheet"], style')).map((node) => {
		const sheet = node.sheet;
		let ruleCount = null;
		if (sheet) {
			try {
				ruleCount = sheet.cssRules.length;
			} catch {
				ruleCount = null;
			}
		}
		return {
			href: node instanceof HTMLLinkElement ? node.href : null,
			loaded: Boolean(sheet),
			ruleCount,
		};
	});
	const appRoot = document.querySelector('main') || document.querySelector('#root') || document.body;
	const heading = appRoot.querySelector('h1, h2, h3');
	const appStyle = appRoot ? getComputedStyle(appRoot) : null;
	const headingStyle = heading ? getComputedStyle(heading) : null;
	const accessibleRuleCounts = stylesheets
		.map((sheet) => sheet.ruleCount)
		.filter((count) => count !== null);
	const styleWarnings = [];
	if (stylesheets.length === 0) {
		styleWarnings.push('No stylesheets are loaded on the page.');
	} else if (stylesheets.every((sheet) => !sheet.loaded)) {
		styleWarnings.push('Stylesheet links exist, but none loaded.');
	} else if (accessibleRuleCounts.length > 0 && accessibleRuleCounts.every((count) => count === 0)) {
		styleWarnings.push('Loaded stylesheets contain no CSS rules.');
	}
	return JSON.stringify({
		title: document.title,
		readyState: document.readyState,
		stylesheetCount: stylesheets.length,
		stylesheets,
		appRoot: appStyle ? {
			tagName: appRoot.tagName,
			display: appStyle.display,
			fontFamily: appStyle.fontFamily,
			fontSize: appStyle.fontSize,
			color: appStyle.color,
			backgroundColor: appStyle.backgroundColor,
		} : null,
		primaryHeading: headingStyle ? {
			fontSize: headingStyle.fontSize,
			fontWeight: headingStyle.fontWeight,
			color: headingStyle.color,
			margin: headingStyle.margin,
		} : null,
		visibleButtonCount: Array.from(appRoot.querySelectorAll('button'))
			.filter((button) => {
				const rect = button.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			}).length,
		styleWarnings,
	});
})()`;

function isBrowserFrontendInspection(value: unknown): value is BrowserFrontendInspection {
	if (typeof value !== 'object' || value === null) return false;
	const inspection = value as Record<string, unknown>;
	const isString = (item: unknown): item is string => typeof item === 'string';
	const isNumber = (item: unknown): item is number => typeof item === 'number';
	const isStyleSnapshot = (item: unknown, keys: string[]): boolean =>
		typeof item === 'object' &&
		item !== null &&
		keys.every((key) => isString((item as Record<string, unknown>)[key]));
	const stylesheets = inspection.stylesheets;
	return (
		isString(inspection.title) &&
		isString(inspection.readyState) &&
		isNumber(inspection.stylesheetCount) &&
		Array.isArray(stylesheets) &&
		stylesheets.every(
			(sheet) =>
				typeof sheet === 'object' &&
				sheet !== null &&
				(sheet as Record<string, unknown>).href !== undefined &&
				((sheet as Record<string, unknown>).href === null ||
					isString((sheet as Record<string, unknown>).href)) &&
				typeof (sheet as Record<string, unknown>).loaded === 'boolean' &&
				((sheet as Record<string, unknown>).ruleCount === null ||
					isNumber((sheet as Record<string, unknown>).ruleCount)),
		) &&
		(inspection.appRoot === null ||
			isStyleSnapshot(inspection.appRoot, [
				'tagName',
				'display',
				'fontFamily',
				'fontSize',
				'color',
				'backgroundColor',
			])) &&
		(inspection.primaryHeading === null ||
			isStyleSnapshot(inspection.primaryHeading, [
				'fontSize',
				'fontWeight',
				'color',
				'margin',
			])) &&
		isNumber(inspection.visibleButtonCount) &&
		Array.isArray(inspection.styleWarnings) &&
		inspection.styleWarnings.every(isString)
	);
}

export async function runCapture(
	page: CapturePage,
	payload: CapturePayload,
): Promise<BrowserConsoleCaptureResult> {
	const logs: BrowserConsoleEntry[] = [];
	const pageErrors: BrowserConsolePageError[] = [];
	const requestFailures: BrowserConsoleRequestFailure[] = [];
	let frontendInspection: BrowserFrontendInspection;

	page.on('console', (msg) => {
		try {
			logs.push({
				level: msg.type(),
				text: msg.text(),
				location: msg.location(),
			});
		} catch {
			// best-effort capture; never let a listener crash the page
		}
	});
	page.on('pageerror', (err) => {
		pageErrors.push({ message: err.message, stack: err.stack });
	});
	page.on('requestfailed', (req) => {
		try {
			requestFailures.push({
				url: req.url(),
				method: req.method(),
				failure: req.failure()?.errorText ?? 'unknown',
			});
		} catch {
			// ignore listener errors
		}
	});
	page.on('response', (res) => {
		try {
			const status = res.status();
			if (status >= 400) {
				requestFailures.push({
					url: res.url(),
					method: res.request().method(),
					failure: `HTTP ${status}`,
					status,
				});
			}
		} catch {
			// ignore listener errors
		}
	});

	try {
		await page.setViewport(payload.viewport);
		await page.goto(payload.url, {
			waitUntil: 'networkidle2',
			timeout: PAGE_LOAD_TIMEOUT_MS,
		});
		if (payload.interactScript) {
			await page.evaluate(payload.interactScript);
		}
		const waitMs = Math.max(0, payload.waitSeconds) * 1000;
		if (waitMs > 0) {
			await new Promise((r) => setTimeout(r, waitMs));
		}
		const inspectionResult = await page.evaluate(FRONTEND_INSPECTION_SCRIPT);
		if (typeof inspectionResult !== 'string') {
			throw new Error('Browser frontend inspection returned an unexpected result.');
		}
		let parsedInspection: unknown;
		try {
			parsedInspection = JSON.parse(inspectionResult);
		} catch (error) {
			throw new Error(
				`Browser frontend inspection returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		if (!isBrowserFrontendInspection(parsedInspection)) {
			throw new Error('Browser frontend inspection returned an invalid result shape.');
		}
		frontendInspection = parsedInspection;
	} finally {
		try {
			await page.close();
		} catch {
			// ignore close failures
		}
	}

	return {
		url: payload.url,
		capturedAt: new Date().toISOString(),
		logs,
		pageErrors,
		requestFailures,
		frontendInspection,
	};
}
