import { ArrowRight, Code2, Rocket, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { MarketingFooter } from '@/components/marketing-footer';

const steps = [
	{
		icon: Sparkles,
		title: 'Start with your idea',
		description:
			'Describe the app you want in plain language. Begin with a rough thought and add detail as you go.',
	},
	{
		icon: Code2,
		title: 'Build it together',
		description:
			'Masidy turns your prompt into a working app. Keep refining the result through a conversation.',
	},
	{
		icon: Rocket,
		title: 'Share when you’re ready',
		description:
			'Preview your work, make changes, and deploy when it is ready to go live.',
	},
];

export default function AboutPage() {
	return (
		<div className="min-h-full bg-kumo-canvas">
			<title>About Masidy</title>
			<main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
				<header className="mx-auto max-w-3xl text-center">
					<p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-kumo-brand">
						About Masidy
					</p>
					<h1 className="text-4xl font-semibold tracking-tight text-kumo-strong sm:text-6xl">
						Make the app you’ve been imagining.
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-kumo-subtle sm:text-lg">
						Masidy helps turn ideas into working web apps. Describe what
						you want to create, shape it with AI, and bring it to life
						without starting from a blank page.
					</p>
					<Link
						to="/"
						className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
					>
						Start creating
						<ArrowRight aria-hidden="true" className="size-4" />
					</Link>
				</header>

				<section aria-label="How Masidy works" className="mt-20 sm:mt-28">
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
									Step 0{index + 1}
								</p>
								<h2 className="mt-2 text-xl font-semibold text-kumo-strong">
									{title}
								</h2>
								<p className="mt-3 text-sm leading-6 text-kumo-subtle">
									{description}
								</p>
							</article>
						))}
					</div>
				</section>

				<section className="mx-auto mt-16 max-w-2xl text-center sm:mt-24">
					<h2 className="text-2xl font-semibold tracking-tight text-kumo-strong sm:text-3xl">
						Your idea is a good place to start.
					</h2>
					<p className="mt-3 text-sm leading-6 text-kumo-subtle">
						No perfect brief required. Start small, see what takes shape,
						and keep building from there.
					</p>
				</section>
			</main>
			<MarketingFooter />
		</div>
	);
}
