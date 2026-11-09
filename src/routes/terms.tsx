import { MarketingFooter } from '@/components/marketing-footer';
import { useLocalization } from '@/lib/use-localization';
import type { MessageKey } from '@/lib/localization';

const sections: {
	title: MessageKey;
	intro?: MessageKey;
	body?: MessageKey;
	items?: MessageKey[];
}[] = [
	{ title: 'termsAcceptanceTitle', body: 'termsAcceptanceBody' },
	{ title: 'termsServiceTitle', body: 'termsServiceBody' },
	{ title: 'termsAccountsTitle', body: 'termsAccountsBody' },
	{
		title: 'termsUseTitle',
		intro: 'termsUseIntro',
		items: [
			'termsUseMalware',
			'termsUseLaws',
			'termsUseIp',
			'termsUseAccess',
			'termsUseDisrupt',
			'termsUseAbuse',
		],
	},
	{ title: 'termsIpTitle', body: 'termsIpBody' },
	{ title: 'termsBillingTitle', body: 'termsBillingBody' },
	{ title: 'termsDisclaimerTitle', body: 'termsDisclaimerBody' },
	{ title: 'termsLiabilityTitle', body: 'termsLiabilityBody' },
	{ title: 'termsChangesTitle', body: 'termsChangesBody' },
	{ title: 'termsContactTitle', body: 'termsContactBody' },
];

export default function TermsPage() {
	const { t } = useLocalization();

	return (
		<div className="min-h-screen bg-kumo-canvas">
			<title>{t('legalTermsTitle')} - Masidy</title>
			<main className="container mx-auto max-w-3xl px-4 py-12 pb-24">
				<div className="mb-10">
					<h1 className="mb-3 text-3xl font-bold text-kumo-strong sm:text-4xl">
						{t('legalTermsTitle')}
					</h1>
					<p className="text-sm text-kumo-subtle">{t('legalLastUpdated')}</p>
				</div>

				<div className="grid gap-8">
					{sections.map(({ title, intro, body, items }) => (
						<section key={title} className="grid gap-3">
							<h2 className="text-xl font-semibold text-kumo-strong">
								{t(title)}
							</h2>
							{intro && <p className="leading-relaxed text-kumo-subtle">{t(intro)}</p>}
							{items && (
								<ul className="grid list-disc gap-1.5 ps-5 text-kumo-subtle">
									{items.map((item) => (
										<li key={item}>{t(item)}</li>
									))}
								</ul>
							)}
							{body && <p className="leading-relaxed text-kumo-subtle">{t(body)}</p>}
						</section>
					))}
				</div>
			</main>
			<MarketingFooter />
		</div>
	);
}
