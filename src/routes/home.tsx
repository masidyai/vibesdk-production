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
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
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

export default function Home() {
	const navigate = useNavigate();
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
		() => ['todo list app', 'SaaS landing page', 'AI recipe generator', 'expense tracker', 'booking system', 'portfolio site'],
		[],
	);

	const { apps, loading, error: appsError } = usePaginatedApps({
		type: 'public',
		defaultSort: 'trending',
		defaultPeriod: 'week',
		limit: 24,
	});

	const discoverApps = useMemo(() => (apps ?? []).slice(0, 9), [apps]);
	const starterIdeas = [
		{
			title: 'A storefront for handmade goods',
			category: 'E-commerce',
			tone: 'apricot',
			prompt:
				'Build a warm, modern storefront for a handmade ceramics brand with a product grid and an about page.',
		},
		{
			title: 'A dashboard for your next big idea',
			category: 'Dashboard',
			tone: 'blue',
			prompt:
				'Create a polished project dashboard with a sidebar, task overview, and progress charts.',
		},
		{
			title: 'A home for your creative work',
			category: 'Portfolio',
			tone: 'violet',
			prompt:
				'Design a bold portfolio website for a creative studio with a project gallery and contact section.',
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

	const discoverLinkRef = useRef<HTMLDivElement>(null);

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
							<span>Your idea, made real</span>
						</div>
						<h1>
							From first idea
							<br />
							to <span>something real.</span>
						</h1>
						<p className="home-hero__description">
							Describe what you want to make. Masidy builds your app
							and gets it ready to share.
						</p>
						<div ref={promptRef} className="home-prompt">
							<PromptBox
								value={query}
								onChange={setQuery}
								onSubmit={() => handleCreateApp(query, projectMode)}
								placeholder="Create a "
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
								<span><Check aria-hidden="true" /> Free to start</span>
								<span>No credit card</span>
								<span>Deploy when you’re ready</span>
							</div>
						</div>
						<div className="home-ideas" aria-label="Starter ideas">
							<span>NEED A STARTING POINT?</span>
							<div>
								{starterIdeas.map((idea) => (
									<button
										key={idea.category}
										type="button"
										onClick={() => setQuery(idea.prompt)}
									>
										{idea.category}
										<ArrowUpRight aria-hidden="true" />
									</button>
								))}
							</div>
						</div>
					</div>

					<div
						className="home-hero__visual"
						role="img"
						aria-label="Illustrative storefront preview for a handmade home goods shop"
					>
						<div className="home-preview">
							<div className="home-preview__bar">
								<div className="home-preview__dots" aria-hidden="true">
									<i /><i /><i />
								</div>
								<span>your-next-idea.masidy.app</span>
								<div className="home-preview__live"><i /> PREVIEW</div>
							</div>
							<div className="home-preview__site">
								<div className="home-preview__nav">
									<b>FORME<span>.</span></b>
									<div><i /><i /><i /></div>
									<strong>SHOP THE EDIT <ArrowRight aria-hidden="true" /></strong>
								</div>
								<div className="home-preview__main">
									<div className="home-preview__headline">
										<span>OBJECTS FOR SLOW LIVING</span>
										<strong>Make room<br />for <em>beautiful.</em></strong>
										<p>Considered pieces for the everyday rituals that make a home.</p>
										<button type="button" tabIndex={-1}>EXPLORE THE COLLECTION <ArrowUpRight aria-hidden="true" /></button>
									</div>
									<div className="home-preview__objects" aria-hidden="true">
										<div className="home-object home-object--vase"><i /></div>
										<div className="home-object home-object--bowl"><i /></div>
										<div className="home-preview__caption">01 / THE SUNDAY COLLECTION</div>
									</div>
								</div>
								<div className="home-preview__bottom">
									<span>DESIGNED TO FEEL LIKE HOME</span>
									<span>SCROLL TO DISCOVER ↓</span>
								</div>
							</div>
						</div>
						<div className="home-preview-note">
							<div className="home-preview-note__icon"><Sparkles aria-hidden="true" /></div>
							<div><strong>A little idea goes a long way</strong><span>A sample of what you can create with Masidy</span></div>
						</div>
						<div className="home-hero__glow" aria-hidden="true" />
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
										Images Beta:
									</span>{' '}
									Images guide app layout and design but may
									not be replicated exactly. The coding agent
									cannot access images directly for app
									assets.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<section className="home-how relative z-10">
					<div className="home-section-heading">
						<span>FROM IDEA TO LIVE</span>
						<h2>Less setup. More <em>making.</em></h2>
						<p>Go from a rough thought to something you can actually use.</p>
					</div>
					<div className="home-steps">
						<article>
							<div className="home-step-icon"><Sparkles aria-hidden="true" /></div>
							<span>01 / DESCRIBE</span>
							<h3>Start with a sentence.</h3>
							<p>Tell Masidy what you have in mind. Add a reference image if you have one.</p>
						</article>
						<article>
							<div className="home-step-icon"><Code2 aria-hidden="true" /></div>
							<span>02 / BUILD</span>
							<h3>Shape it as you go.</h3>
							<p>Watch your idea take form, then ask for changes until it feels right.</p>
						</article>
						<article>
							<div className="home-step-icon"><Globe2 aria-hidden="true" /></div>
							<span>03 / SHARE</span>
							<h3>Put it out there.</h3>
							<p>Deploy your finished project and share it with the world.</p>
						</article>
					</div>
				</section>

				<section className="home-showcase relative z-10">
					<div className="home-showcase__heading">
						<div className="home-section-heading">
							<span>{discoverApps.length ? 'MADE WITH MASIDY' : 'START WITH A CONCEPT'}</span>
							<h2>
								{discoverApps.length ? (
									<>Good ideas look <em>good.</em></>
								) : (
									<>A little inspiration goes a <em>long way.</em></>
								)}
							</h2>
							<p>
								{discoverApps.length
									? 'Explore what people are creating—or use these ideas to start your own.'
									: 'Choose a direction, then make it yours with Masidy.'}
							</p>
						</div>
						<div ref={discoverLinkRef}>
							<LinkButton variant="outline" size="sm" href="/discover">
								Explore projects
								<ArrowUpRight className="size-3.5 opacity-70" />
							</LinkButton>
						</div>
					</div>
					{discoverApps.length > 0 ? (
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
					) : (
						<>
							<p className="home-showcase__notice">
								{appsError
									? 'Community projects are temporarily unavailable. Here are a few ideas to get you started.'
									: loading
										? 'Loading community projects… Here are a few ideas while you wait.'
										: 'These are starting points, not templates—Masidy will shape them around your idea.'}
							</p>
							<div className="home-idea-cards">
								{starterIdeas.map((idea, index) => (
									<button
										key={idea.category}
										type="button"
										className="home-idea-card"
										onClick={() => {
											setQuery(idea.prompt);
											window.scrollTo({ top: 0, behavior: 'smooth' });
										}}
									>
										<div className={`home-idea-card__art home-idea-card__art--${idea.tone}`}>
											<div className="home-idea-card__window">
												<span>{idea.category.toUpperCase()}</span>
												<strong>{index === 0 ? 'made for' : index === 1 ? 'move with' : 'made to'}<br /><em>{index === 0 ? 'everyday.' : index === 1 ? 'intention.' : 'stand out.'}</em></strong>
												<i /><i /><i />
											</div>
										</div>
										<span className="home-idea-card__meta">{idea.category}<ArrowUpRight aria-hidden="true" /></span>
										<strong>{idea.title}</strong>
									</button>
								))}
							</div>
						</>
					)}
					{!discoverApps.length && loading && (
						<div className="home-showcase__loading">Finding projects to inspire you…</div>
					)}
				</section>

				<section className="home-cta relative z-10">
					<div>
						<span><Rocket aria-hidden="true" /> YOUR NEXT PROJECT STARTS HERE</span>
						<h2>Make something<br /><em>you’re proud of.</em></h2>
						<p>No blank canvas required. Just bring the idea.</p>
					</div>
					<button
						type="button"
						onClick={() =>
							promptRef.current?.scrollIntoView({
								behavior: 'smooth',
								block: 'center',
							})
						}
					>
						Start creating <ArrowRight aria-hidden="true" />
					</button>
				</section>
			</LayoutGroup>

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
