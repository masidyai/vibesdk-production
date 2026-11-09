import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
	ArrowRight,
	ArrowUpRight,
	Check,
	Code2,
	Globe2,
	Loader2,
	Rocket,
	Sparkles,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import {
	ProjectModeSelector,
	type ProjectModeOption,
} from '../components/project-mode-selector';
import {
	MAX_AGENT_QUERY_LENGTH,
	SUPPORTED_IMAGE_MIME_TYPES,
	type ProjectType,
	type BehaviorType,
} from '@/api-types';
import { useFeature } from '@/features';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePaginatedApps } from '@/hooks/use-paginated-apps';
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	useReducedMotion,
} from 'framer-motion';
import { AppCard } from '@/components/shared/AppCard';
import { LinkButton } from '@cloudflare/kumo';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { toast } from 'sonner';
import { useLimitsContext } from '@/contexts/limits-context';
import { checkCanSendPrompt } from '@/utils/usage-limit-checker';
import { PromptBox } from '@/components/prompt-box';
import { InfoIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { startCloudflareConnect } from '@/lib/cloudflare-connect';
import { MarketingFooter } from '@/components/marketing-footer';
import { useLocalization } from '@/lib/use-localization';
import type { MessageKey } from '@/lib/localization';

export default function Home() {
	const navigate = useNavigate();
	const { t } = useLocalization();
	const { requireAuth } = useAuthGuard();
	const [projectMode, setProjectMode] = useState<ProjectType>('app');
	const behaviorMode: Extract<BehaviorType, 'think' | 'phasic'> = 'think';
	const [query, setQuery] = useState('');
	const { user } = useAuth();
	const { isLoadingCapabilities, capabilities, getEnabledFeatures } =
		useFeature();
	const { data: limitsData, loading: usageLimitsLoading } =
		useLimitsContext();
	const [showLimitDialog, setShowLimitDialog] =
		useState<React.ReactElement | null>(null);
	const promptRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();

	const handleConnectCloudflare = useCallback(() => {
		void startCloudflareConnect(window.location.href);
	}, []);

	// Surface auth failures redirected here from the OAuth callback (e.g. an email
	// that already belongs to an account created via a different method).
	const [searchParams, setSearchParams] = useSearchParams();
	useEffect(() => {
		const authError = searchParams.get('error');
		if (!authError) return;
		const messages: Record<string, string> = {
			email_exists:
				'An account with this email already exists. Sign in with your existing method, then link the provider from Settings.',
			oauth_failed:
				'The sign-in provider reported an error. Please try again.',
			auth_failed: 'Sign-in failed. Please try again.',
		};
		toast.error(messages[authError] ?? messages.auth_failed);
		searchParams.delete('error');
		setSearchParams(searchParams, { replace: true });
	}, [searchParams, setSearchParams]);

	const modeOptions = useMemo<ProjectModeOption[]>(() => {
		if (isLoadingCapabilities || !capabilities) return [];
		return getEnabledFeatures().map((def) => ({
			id: def.id,
			label:
				def.id === 'presentation'
					? 'Slides'
					: def.id === 'general'
						? 'General'
						: 'App',
			description: def.description,
		}));
	}, [capabilities, getEnabledFeatures, isLoadingCapabilities]);

	const showModeSelector = modeOptions.length > 1;

	useEffect(() => {
		if (isLoadingCapabilities) return;
		if (modeOptions.length === 0) {
			if (projectMode !== 'app') setProjectMode('app');
			return;
		}
		if (!modeOptions.some((m) => m.id === projectMode)) {
			setProjectMode(modeOptions[0].id);
		}
	}, [isLoadingCapabilities, modeOptions, projectMode]);

	const { images, addImages, removeImage, clearImages, isProcessing } =
		useImageUpload({
			onError: (error) => {
				console.error('Image upload error:', error);
				toast.error(error);
			},
		});

	const { isDragging, dragHandlers } = useDragDrop({
		onFilesDropped: addImages,
		accept: [...SUPPORTED_IMAGE_MIME_TYPES],
	});

	const placeholderPhrases = useMemo(
		() => [
			t('placeholderPortfolio'),
			t('placeholderDashboard'),
			t('placeholderStore'),
			t('placeholderRecipe'),
			t('placeholderExpense'),
			t('placeholderBooking'),
		],
		[t],
	);

	const { apps } = usePaginatedApps({
		type: 'public',
		defaultSort: 'trending',
		defaultPeriod: 'week',
		limit: 24,
	});

	const discoverApps = useMemo(() => (apps ?? []).slice(0, 9), [apps]);
	const starterIdeas: { category: MessageKey; prompt: MessageKey }[] = [
		{
			category: 'ideaEcommerce',
			prompt: 'ideaEcommercePrompt',
		},
		{
			category: 'ideaDashboard',
			prompt: 'ideaDashboardPrompt',
		},
		{
			category: 'ideaPortfolio',
			prompt: 'ideaPortfolioPrompt',
		},
	];

	const handleCreateApp = (query: string, mode: ProjectType) => {
		if (query.length > MAX_AGENT_QUERY_LENGTH) {
			toast.error(
				`Prompt too large (${query.length} characters). Maximum allowed is ${MAX_AGENT_QUERY_LENGTH} characters.`,
			);
			return;
		}

		if (user && usageLimitsLoading) {
			return;
		}

		const encodedQuery = encodeURIComponent(query);
		const encodedMode = encodeURIComponent(mode);
		const behaviorParam =
			mode === 'app'
				? `&behaviorType=${encodeURIComponent(behaviorMode)}`
				: '';

		// Encode images as JSON if present
		const imageParam =
			images.length > 0
				? `&images=${encodeURIComponent(JSON.stringify(images))}`
				: '';
		const intendedUrl = `/chat/new?query=${encodedQuery}&projectType=${encodedMode}${behaviorParam}${imageParam}`;

		if (
			!requireAuth({
				requireFullAuth: true,
				actionContext: 'to create applications',
				intendedUrl: intendedUrl,
			})
		) {
			return;
		}

		// Check usage limits before proceeding
		const limitCheck = checkCanSendPrompt(
			limitsData,
			usageLimitsLoading,
			() => {
				void startCloudflareConnect(window.location.href);
			},
			() => setShowLimitDialog(null),
		);

		if (!limitCheck.canProceed) {
			setShowLimitDialog(limitCheck.dialogComponent || null);
			return;
		}

		// User is already authenticated, navigate immediately. Mark the
		// navigation as in-app so the chat session can auto-start without the
		// external-link confirmation gate.
		navigate(intendedUrl, { state: { fromPrompt: true } });
		// Clear images after navigation
		clearImages();
	};

	const focusPrompt = () => {
		promptRef.current?.scrollIntoView({
			behavior: prefersReducedMotion ? 'auto' : 'smooth',
			block: 'center',
		});
		promptRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
	};

	return (
		<div className="home-page relative flex flex-col items-center w-full min-h-full">
			<title>Masidy</title>
			<div className="home-atmosphere" aria-hidden>
				<div className="home-atmosphere__spotlight" />
			</div>
			<LayoutGroup>
				<section className="home-hero relative z-10 w-full">
					<div className="home-hero__copy">
						<div className="home-eyebrow">
							<Sparkles aria-hidden="true" />
							<span>{t('homeEyebrow')}</span>
						</div>
						<h1>
							{t('homeTitle')}{' '}
							<span>{t('homeTitleAccent')}</span>
						</h1>
						<p className="home-hero__description">
							{t('homeDescription')}
						</p>
						<div ref={promptRef} className="home-prompt">
							<PromptBox
								value={query}
								onChange={setQuery}
								onSubmit={() => handleCreateApp(query, projectMode)}
								placeholder={t('promptPlaceholder')}
								animatedPlaceholder
								placeholderPhrases={placeholderPhrases}
								images={images}
								onAddImages={addImages}
								onRemoveImage={removeImage}
								isProcessing={
									isProcessing ||
									(user ? usageLimitsLoading : false)
								}
								isDragging={isDragging}
								dragHandlers={dragHandlers}
								submitDisabled={user ? usageLimitsLoading : false}
								limitsData={user ? limitsData : undefined}
								onConnectCloudflare={handleConnectCloudflare}
								variant="expanded"
								submitIcon={
									user && usageLimitsLoading ? (
										<Loader2 className="animate-spin" />
									) : (
										<PaperPlaneTiltIcon weight="duotone" />
									)
								}
								leftActions={
									showModeSelector ? (
										<ProjectModeSelector
											value={projectMode}
											onChange={setProjectMode}
											modes={modeOptions}
										/>
									) : undefined
								}
							/>
							<div className="home-prompt__footnote">
								<span><Check aria-hidden="true" /> {t('freeToStart')}</span>
								<span>{t('noCreditCard')}</span>
								<span>{t('deployWhenReady')}</span>
							</div>
						</div>
						<div className="home-ideas" aria-label={t('startingPoint')}>
							<span>{t('startingPoint')}</span>
							<div>
								{starterIdeas.map((idea) => (
									<button
										key={idea.category}
										type="button"
										onClick={() => setQuery(t(idea.prompt))}
									>
										{t(idea.category)}
										<ArrowUpRight aria-hidden="true" />
									</button>
								))}
							</div>
						</div>
					</div>

				</section>

				<AnimatePresence mode="popLayout">
					{images.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="w-full max-w-2xl px-5 sm:px-6 mt-4"
						>
							<div
								className="flex items-start gap-2 px-4 py-3 rounded-xl bg-bg-4/50 dark:bg-bg-2/50 shadow-sm"
								style={{ borderColor: 'rgba(255, 61, 0, 0.2)' }}
							>
								<InfoIcon
									className="size-4 flex-shrink-0 mt-0.5"
									style={{ color: '#7FFF00' }}
								/>
								<p className="text-xs text-kumo-subtle leading-relaxed">
									<span className="font-medium text-text-secondary">
										{t('imagesBeta')}
										</span>{' '}
										{t('imagesHelp')}
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<motion.section
					className="home-how relative z-10"
					initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.15 }}
					transition={{ duration: 0.75, ease: [0.2, 0.75, 0.2, 1] }}
				>
					<div className="home-section-heading">
						<span>{t('journeyEyebrow')}</span>
						<h2>{t('journeyTitle')} <em>{t('journeyAccent')}</em></h2>
						<p>{t('journeyDescription')}</p>
					</div>
					<div className="home-steps">
						<article>
							<div className="home-step-icon"><Sparkles aria-hidden="true" /></div>
							<span>{t('stepDescribe')}</span>
							<h3>{t('stepDescribeTitle')}</h3>
							<p>{t('stepDescribeDescription')}</p>
						</article>
						<article>
							<div className="home-step-icon"><Code2 aria-hidden="true" /></div>
							<span>{t('stepBuild')}</span>
							<h3>{t('stepBuildTitle')}</h3>
							<p>{t('stepBuildDescription')}</p>
						</article>
						<article>
							<div className="home-step-icon"><Globe2 aria-hidden="true" /></div>
							<span>{t('stepShare')}</span>
							<h3>{t('stepShareTitle')}</h3>
							<p>{t('stepShareDescription')}</p>
						</article>
					</div>
				</motion.section>

				{discoverApps.length > 0 && (
					<motion.section
						className="home-showcase relative z-10"
						initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.12 }}
						transition={{ duration: 0.75, ease: [0.2, 0.75, 0.2, 1] }}
					>
						<div className="home-showcase__heading">
							<div className="home-section-heading">
								<span>{t('showcaseEyebrow')}</span>
								<h2>{t('showcaseTitle')} <em>{t('showcaseAccent')}</em></h2>
								<p>{t('showcaseDescription')}</p>
							</div>
							<div>
								<LinkButton variant="outline" size="sm" href="/discover">
									{t('exploreProjects')}
									<ArrowUpRight className="size-3.5 opacity-70" />
								</LinkButton>
							</div>
						</div>
						<motion.div
							layout
							transition={{ duration: 0.4 }}
							className="home-showcase__grid"
						>
							<AnimatePresence mode="popLayout">
								{discoverApps.slice(0, 6).map((app) => (
									<AppCard
										key={app.id}
										app={app}
										onClick={() => navigate(`/app/${app.id}`)}
										showStats
										showUser
										showActions={false}
									/>
								))}
							</AnimatePresence>
						</motion.div>
					</motion.section>
				)}

				<motion.section
					className="home-cta relative z-10"
					initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: 0.7, ease: [0.2, 0.75, 0.2, 1] }}
				>
					<div>
						<span><Rocket aria-hidden="true" /> {t('ctaEyebrow')}</span>
						<h2>{t('ctaTitle')}<br /><em>{t('ctaAccent')}</em></h2>
						<p>{t('ctaDescription')}</p>
					</div>
					<button
						type="button"
						onClick={focusPrompt}
					>
						{t('startCreating')} <ArrowRight aria-hidden="true" />
					</button>
				</motion.section>
			</LayoutGroup>

			<MarketingFooter />

			{/* Usage limit dialogs */}
			{showLimitDialog}
		</div>
	);
}

type ArrowProps = {
	/** Ref to the source element the arrow starts from */
	sourceRef: React.RefObject<HTMLElement | null>;
	/** Target point in viewport/client coordinates */
	target: { x: number; y: number };
	/** Curve intensity (0.1 - 1.5 is typical) */
	curvature?: number;
	/** Optional pixel offset from source element edge */
	sourceOffset?: number;
	/** If true, hides the arrow when the source is offscreen/not measurable */
	hideWhenInvalid?: boolean;
};

type Point = { x: number; y: number };

export const CurvedArrow: React.FC<ArrowProps> = ({
	sourceRef,
	target,
	curvature = 0.5,
	sourceOffset = 6,
	hideWhenInvalid = true,
}) => {
	const [start, setStart] = useState<Point | null>(null);
	const [end, setEnd] = useState<Point | null>(null);

	const rafRef = useRef<number | null>(null);
	const roRef = useRef<ResizeObserver | null>(null);

	const compute = () => {
		const el = sourceRef.current;
		if (!el) {
			setStart(null);
			setEnd(null);
			return;
		}

		const rect = el.getBoundingClientRect();
		if (!rect || rect.width === 0 || rect.height === 0) {
			setStart(null);
			setEnd(null);
			return;
		}

		const endPoint: Point = { x: target.x, y: target.y };

		// Choose an anchor on the source: midpoint of the side facing the target
		const centers = {
			right: { x: rect.right, y: rect.top + rect.height / 2 },
			left: { x: rect.left, y: rect.top + rect.height / 2 },
		};

		// Distances to target from each side center
		const dists = Object.fromEntries(
			Object.entries(centers).map(([side, p]) => [
				side,
				(p.x - endPoint.x) ** 2 + (p.y - endPoint.y) ** 2,
			]),
		) as Record<keyof typeof centers, number>;

		const bestSide = (Object.entries(dists).sort(
			(a, b) => a[1] - b[1],
		)[0][0] || 'right') as keyof typeof centers;

		// Nudge start point slightly outside the element for visual clarity
		const nudge = (
			p: Point,
			side: keyof typeof centers,
			offset: number,
		) => {
			switch (side) {
				case 'right':
					return { x: p.x + offset, y: p.y };
				case 'left':
					return { x: p.x - offset, y: p.y };
			}
		};

		const startPoint = nudge(centers[bestSide], bestSide, sourceOffset);

		setStart(startPoint);
		setEnd(endPoint);
	};

	// Throttle updates with rAF to avoid layout thrash
	const scheduleCompute = () => {
		if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(compute);
	};

	useEffect(() => {
		scheduleCompute();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target.x, target.y, sourceRef.current]);

	useEffect(() => {
		const onScroll = () => scheduleCompute();
		const onResize = () => scheduleCompute();

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		// Track source element size changes
		const el = sourceRef.current;
		if ('ResizeObserver' in window) {
			roRef.current = new ResizeObserver(() => scheduleCompute());
			if (el) roRef.current.observe(el);
		}

		scheduleCompute();

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			if (roRef.current && el) roRef.current.unobserve(el);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const d = useMemo(() => {
		if (!start || !end) return '';

		const dx = end.x - start.x;
		const dy = end.y - start.y;

		// Control points: bend the curve based on the primary axis difference.
		// This gives a nice S or C curve without sharp kinks.
		const cpOffset = Math.max(Math.abs(dx), Math.abs(dy)) * curvature;

		const c1: Point = {
			x: start.x + cpOffset * (dx >= 0 ? 1 : -1),
			y: start.y,
		};
		const c2: Point = {
			x: end.x - cpOffset * (dx >= 0 ? 1 : -1),
			y: end.y,
		};

		return `M ${start.x},${start.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`;
	}, [start, end, curvature]);

	const hidden = hideWhenInvalid && (!start || !end);

	if (start && end && (end.y - start.y > 420 || start.x - end.x < 100)) {
		return null;
	}

	return (
		<svg
			aria-hidden="true"
			style={{
				position: 'fixed',
				inset: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'none',
				overflow: 'visible',
				zIndex: 9999,
				display: hidden ? 'none' : 'block',
			}}
		>
			<defs>
				<filter
					id="discover-squiggle"
					x="-20%"
					y="-20%"
					width="140%"
					height="140%"
				>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.8"
						numOctaves="1"
						seed="3"
						result="noise"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale="1"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
				<marker
					id="discover-arrowhead"
					markerWidth="8"
					markerHeight="8"
					refX="7"
					refY="4"
					orient="auto"
					markerUnits="strokeWidth"
					opacity={0.2}
				>
					<path
						d="M 0 1.2 L 7 4"
						stroke="var(--color-text-tertiary)"
						strokeWidth="1.6"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M 0 6.8 L 7 4"
						stroke="var(--color-text-tertiary)"
						strokeWidth="1.2"
						strokeLinecap="round"
						fill="none"
					/>
				</marker>
			</defs>

			<path
				d={d}
				// stroke="var(--color-brand)"
				stroke="var(--color-text-tertiary)"
				strokeOpacity={0.2}
				strokeWidth={1.6}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
				markerEnd="url(#discover-arrowhead)"
			/>
			{/* Soft squiggle overlay for hand-drawn feel */}
			<g filter="url(#discover-squiggle)">
				<path
					d={d}
					// stroke="var(--color-brand)"
					stroke="var(--color-text-tertiary)"
					strokeOpacity={0.12}
					strokeWidth={1}
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray="8 6 4 9 5 7"
					vectorEffect="non-scaling-stroke"
				/>
			</g>
		</svg>
	);
};
