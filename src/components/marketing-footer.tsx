import { Link } from 'react-router';

const links = [
	{ to: '/about', label: 'About' },
	{ to: '/pricing', label: 'Pricing' },
	{ to: '/privacy', label: 'Privacy Policy' },
	{ to: '/terms', label: 'Terms of Service' },
];

export function MarketingFooter() {
	return (
		<footer className="w-full border-t border-kumo-line px-5 py-7">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
				<Link
					to="/"
					className="font-semibold tracking-tight text-kumo-strong hover:text-kumo-brand"
				>
					Masidy
				</Link>
				<nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
					{links.map(({ to, label }) => (
						<Link
							key={to}
							to={to}
							className="text-sm text-kumo-subtle transition-colors hover:text-kumo-strong"
						>
							{label}
						</Link>
					))}
				</nav>
				<span className="text-xs text-kumo-subtle">
					Ideas into apps, made real.
				</span>
			</div>
		</footer>
	);
}
