import { MarketingFooter } from '@/components/marketing-footer';
import { useLocalization } from '@/lib/use-localization';
import type { MessageKey } from '@/lib/localization';

const sections: {
	title: MessageKey;
	intro?: MessageKey;
	body?: MessageKey;
	items?: MessageKey[];
}[] = [
	{
		title: 'privacyCollectTitle',
		intro: 'privacyCollectIntro',
		items: [
			'privacyCollectAccount',
			'privacyCollectOauth',
			'privacyCollectUsage',
			'privacyCollectTechnical',
		],
	},
	{
		title: 'privacyUseTitle',
		intro: 'privacyUseIntro',
		items: [
			'privacyUseProvide',
			'privacyUseTransactions',
			'privacyUseEmails',
			'privacyUseSupport',
			'privacyUseAbuse',
			'privacyUseAnalytics',
		],
	},
	{
		title: 'privacySharingTitle',
		intro: 'privacySharingIntro',
		items: [
			'privacySharingProviders',
			'privacySharingLegal',
			'privacySharingTransfer',
		],
		body: 'privacySharingApps',
	},
	{ title: 'privacyRetentionTitle', body: 'privacyRetentionBody' },
	{ title: 'privacyCookiesTitle', body: 'privacyCookiesBody' },
	{ title: 'privacySecurityTitle', body: 'privacySecurityBody' },
	{ title: 'privacyChildrenTitle', body: 'privacyChildrenBody' },
	{ title: 'privacyRightsTitle', body: 'privacyRightsBody' },
	{ title: 'privacyChangesTitle', body: 'privacyChangesBody' },
	{ title: 'privacyContactTitle', body: 'privacyContactBody' },
];

export default function PrivacyPage() {
	const { t } = useLocalization();

	return (
		<div className="min-h-screen bg-kumo-canvas">
			<title>{t('legalPrivacyTitle')} - Masidy</title>
			<main className="container mx-auto max-w-3xl px-4 py-12 pb-24">
				<div className="mb-10">
					<h1 className="mb-3 text-3xl font-bold text-kumo-strong sm:text-4xl">
						{t('legalPrivacyTitle')}
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
