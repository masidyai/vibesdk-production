import { ArrowRight, Code2, Rocket, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { MarketingFooter } from '@/components/marketing-footer';
import { useLocalization } from '@/lib/use-localization';
import type { MessageKey } from '@/lib/localization';

const steps = [
	{
		icon: Sparkles,
		title: 'aboutStartTitle',
		description: 'aboutStartDescription',
	},
	{
		icon: Code2,
		title: 'aboutBuildTitle',
		description: 'aboutBuildDescription',
	},
	{
		icon: Rocket,
		title: 'aboutShareTitle',
		description: 'aboutShareDescription',
	},
] as const satisfies readonly {
	icon: typeof Sparkles;
	title: MessageKey;
	description: MessageKey;
}[];

export default function AboutPage() {
	const { t } = useLocalization();

	return (
		<div className="min-h-full bg-kumo-canvas">
			<title>{t('aboutEyebrow')}</title>
			<main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
				<header className="mx-auto max-w-3xl text-center">
					<p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-kumo-brand">
						{t('aboutEyebrow')}
					</p>
					<h1 className="text-4xl font-semibold tracking-tight text-kumo-strong sm:text-6xl">
						{t('aboutTitle')}
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-kumo-subtle sm:text-lg">
						{t('aboutDescription')}
					</p>
					<Link
						to="/"
						className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
					>
						{t('startCreating')}
						<ArrowRight aria-hidden="true" className="size-4" />
					</Link>
				</header>

				<section aria-label={t('aboutHowLabel')} className="mt-20 sm:mt-28">
					<div className="grid gap-4 md:grid-cols-3">
						{steps.map(({ icon: Icon, title, description }, index) => (
							<article
								key={title}
								className="rounded-2xl border border-kumo-line bg-kumo-base p-7"
							>
								<div className="mx-auto mb-6 grid size-11 place-items-center rounded-xl bg-kumo-tint text-kumo-brand md:mx-0">
									<Icon aria-hidden="true" className="size-5" />
								</div>
								<p className="text-xs font-medium uppercase tracking-wider text-kumo-subtle">
									{t('aboutStep')} 0{index + 1}
								</p>
								<h2 className="mt-2 text-xl font-semibold text-kumo-strong">
									{t(title)}
								</h2>
								<p className="mt-3 text-sm leading-6 text-kumo-subtle">
									{t(description)}
								</p>
							</article>
						))}
					</div>
				</section>

				<section className="mx-auto mt-16 max-w-2xl text-center sm:mt-24">
					<h2 className="text-2xl font-semibold tracking-tight text-kumo-strong sm:text-3xl">
						{t('aboutClosingTitle')}
					</h2>
					<p className="mt-3 text-sm leading-6 text-kumo-subtle">
						{t('aboutClosingDescription')}
					</p>
				</section>
			</main>
			<MarketingFooter />
		</div>
	);
}
