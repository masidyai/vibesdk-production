import { describe, expect, it } from 'vitest';
import { runCapture } from './capture-core';
import type {
	CaptureConsoleMessage,
	CaptureHttpRequest,
	CaptureHttpResponse,
	CapturePage,
} from './types';

class MockCapturePage implements CapturePage {
	readonly calls: string[] = [];

	on(event: 'console', callback: (msg: CaptureConsoleMessage) => void): unknown;
	on(event: 'pageerror', callback: (err: { message: string; stack?: string }) => void): unknown;
	on(event: 'requestfailed', callback: (req: CaptureHttpRequest) => void): unknown;
	on(event: 'response', callback: (res: CaptureHttpResponse) => void): unknown;
	on(
		event: 'console' | 'pageerror' | 'requestfailed' | 'response',
		callback:
			| ((msg: CaptureConsoleMessage) => void)
			| ((err: { message: string; stack?: string }) => void)
			| ((req: CaptureHttpRequest) => void)
			| ((res: CaptureHttpResponse) => void),
	): unknown {
		void event;
		void callback;
	}

	async setViewport(): Promise<void> {}

	async goto(): Promise<void> {}

	async evaluate(): Promise<unknown> {
		this.calls.push('inspect');
		return JSON.stringify({
			title: 'Example',
			readyState: 'complete',
			stylesheetCount: 0,
			stylesheets: [],
			appRoot: null,
			primaryHeading: null,
			visibleButtonCount: 0,
			styleWarnings: ['No stylesheets are loaded on the page.'],
		});
	}

	async close(): Promise<void> {
		this.calls.push('close');
	}
}

describe('runCapture frontend inspection', () => {
	it('returns styling diagnostics before closing the page', async () => {
		const page = new MockCapturePage();
		const result = await runCapture(page, {
			url: 'https://example.com',
			waitSeconds: 0,
			viewport: { width: 1280, height: 800 },
		});

		expect(result.frontendInspection?.styleWarnings).toContain(
			'No stylesheets are loaded on the page.',
		);
		expect(page.calls).toEqual(['inspect', 'close']);
	});
});
