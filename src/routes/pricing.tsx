import { useState } from 'react';
import { Button, cn } from '@cloudflare/kumo';
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Check, Zap } from 'lucide-react';
import { MarketingFooter } from '@/components/marketing-footer';
import { useLocalization } from '@/lib/use-localization';

const PLANS = [
    {
        id: 'free' as const,
        price: 0,
        nameKey: 'planFree',
        taglineKey: 'planFreeTagline',
        creditsKey: 'planFreeCredits',
        features: [
            'featureFreeCredits',
            'featureSubdomain',
            'featureCustomDomainOne',
            'featureGithub',
            'featurePrivateApps',
            'featureCommunitySupport',
        ],
    },
    {
        id: 'pro' as const,
        price: 19,
        nameKey: 'planPro',
        taglineKey: 'planProTagline',
        creditsKey: 'planProCredits',
        highlighted: true,
        features: [
            'featureProCredits',
            'featureCustomDomainsThree',
            'featureGithub',
            'featurePrivateApps',
            'featurePriorityAi',
            'featureEmailSupport',
        ],
    },
    {
        id: 'team' as const,
        price: 49,
        nameKey: 'planTeam',
        taglineKey: 'planTeamTagline',
        creditsKey: 'planTeamCredits',
        features: [
            'featureTeamCredits',
            'featureCustomDomainsTen',
            'featureGithub',
            'featurePrivateApps',
            'featureTeamWorkspaces',
            'featurePrioritySupport',
        ],
    },
    {
        id: 'enterprise' as const,
        price: 199,
        nameKey: 'planEnterprise',
        taglineKey: 'planEnterpriseTagline',
        creditsKey: 'planEnterpriseCredits',
        features: [
            'featureEnterpriseCredits',
            'featureUnlimitedDomains',
            'featureGithub',
            'featurePrivateApps',
            'featureTeamWorkspaces',
            'featureDedicatedSupport',
        ],
    },
] as const;

type PaidPlanId = 'pro' | 'team' | 'enterprise';
export default function PricingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);
    const { t } = useLocalization();

    const handleSelect = async (planId: typeof PLANS[number]['id']) => {
        if (planId === 'free') { navigate('/'); return; }
        if (!user) { navigate('/?signin=1'); return; }
        setLoading(planId);
        try {
            const res = await apiClient.createCheckoutSession(planId as PaidPlanId);
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error?.message ?? t('checkoutFailed'));
            }
        } catch {
            toast.error(t('tryAgain'));
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-kumo-canvas">
            <title>{t('footerPricing')} - Masidy</title>
            <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-16 pb-16 sm:pb-24">
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold font-funky-mono text-kumo-strong mb-3">
                        {t('pricingTitle')}
                    </h1>
                    <p className="text-base text-kumo-subtle max-w-xl mx-auto">
                        {t('pricingDescription')}
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5">
                        <Zap className="size-3.5 text-brand" />
                        <span className="text-sm font-medium">{t('creditDefinition')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={cn(
                                'relative rounded-2xl p-6 flex flex-col gap-5 ring-1',
                                'highlighted' in plan && plan.highlighted
                                    ? 'ring-brand bg-kumo-elevated shadow-xl shadow-brand/10'
                                    : 'ring-kumo-line bg-kumo-base'
                            )}
                        >
                            {'highlighted' in plan && plan.highlighted && (
                                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                                    <span className="bg-brand text-black text-xs font-bold px-3 py-1 rounded-full">{t('mostPopular')}</span>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider mb-1.5">{t(plan.nameKey)}</p>
                                <div className="flex items-end gap-1 mb-0.5">
                                    <span className="text-3xl font-bold text-kumo-strong">
                                        {plan.price === 0 ? t('planFree') : `$${plan.price}`}
                                    </span>
                                    {plan.price > 0 && <span className="text-kumo-subtle text-sm mb-1">{t('perMonth')}</span>}
                                </div>
                                <p className="text-xs text-kumo-subtle">{t(plan.taglineKey)}</p>
                            </div>

                            <div className={cn(
                                'rounded-lg px-3 py-2.5',
                                'highlighted' in plan && plan.highlighted ? 'bg-brand/15' : 'bg-kumo-tint'
                            )}>
                                <p className="text-sm font-semibold text-kumo-default">{t(plan.creditsKey)}</p>
                                <p className="text-xs text-kumo-subtle mt-0.5">{t('creditsReset')}</p>
                            </div>

                            <ul className="flex flex-col gap-2 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-kumo-default">
                                        <Check className="size-3.5 text-brand shrink-0 mt-0.5" />
                                        {t(feature)}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={'highlighted' in plan && plan.highlighted ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={() => handleSelect(plan.id)}
                                loading={loading === plan.id}
                            >
                                {plan.id === 'free' ? t('startFree') : `${t('getPlan')} ${t(plan.nameKey)}`}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 max-w-2xl mx-auto grid gap-5">
                    <h2 className="text-lg font-semibold text-kumo-strong text-center">{t('pricingFaqTitle')}</h2>
                    {[
                        { q: t('pricingFaqCreditQuestion'), a: t('pricingFaqCreditAnswer') },
                        { q: t('pricingFaqRolloverQuestion'), a: t('pricingFaqRolloverAnswer') },
                        { q: t('pricingFaqFeaturesQuestion'), a: t('pricingFaqFeaturesAnswer') },
                        { q: t('pricingFaqCancelQuestion'), a: t('pricingFaqCancelAnswer') },
                    ].map(({ q, a }) => (
                        <div key={q} className="grid gap-1">
                            <p className="text-sm font-semibold text-kumo-default">{q}</p>
                            <p className="text-sm text-kumo-subtle leading-relaxed">{a}</p>
                        </div>
                    ))}
                </div>
            </main>
            <MarketingFooter />
        </div>
    );
}