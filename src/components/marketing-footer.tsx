import { Link } from 'react-router';
import { useLocalization } from '@/lib/use-localization';

export function MarketingFooter() {
	const { t } = useLocalization();
	const links = [
		{ to: '/about', label: t('footerAbout') },
		{ to: '/pricing', label: t('footerPricing') },
		{ to: '/privacy', label: t('footerPrivacy') },
		{ to: '/terms', label: t('footerTerms') },
	];

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
					{t('footerSlogan')}
				</span>
			</div>
		</footer>
	);
}
