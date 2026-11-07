import { useState } from 'react';
import { Button, cn } from '@cloudflare/kumo';
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Check, Zap } from 'lucide-react';

const PLANS = [
    {
        id: 'free' as const,
        price: 0,
        name: 'Free',
        tagline: 'Try it out',
        credits: '5 credits / month',
        features: [
            '5 AI build credits/month',
            'masidy.dev subdomain',
            'Custom domain (1)',
            'GitHub export',
            'Private apps',
            'Community support',
        ],
    },
    {
        id: 'pro' as const,
        price: 19,
        name: 'Pro',
        tagline: 'For solo builders',
        credits: '50 credits / month',
        highlighted: true,
        features: [
            '50 AI build credits/month',
            'Custom domains (3)',
            'GitHub export',
            'Private apps',
            'Priority AI',
            'Email support',
        ],
    },
    {
        id: 'team' as const,
        price: 49,
        name: 'Team',
        tagline: 'For teams',
        credits: '200 credits / month',
        features: [
            '200 AI build credits/month',
            'Custom domains (10)',
            'GitHub export',
            'Private apps',
            'Team workspaces',
            'Priority support',
        ],
    },
    {
        id: 'enterprise' as const,
        price: 199,
        name: 'Enterprise',
        tagline: 'For power teams',
        credits: '1,000 credits / month',
        features: [
            '1,000 AI build credits/month',
            'Unlimited custom domains',
            'GitHub export',
            'Private apps',
            'Team workspaces',
            'Dedicated support',
        ],
    },
] as const;

type PaidPlanId = 'pro' | 'team' | 'enterprise';

export default function PricingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelect = async (planId: typeof PLANS[number]['id']) => {
        if (planId === 'free') { navigate('/'); return; }
        if (!user) { navigate('/?signin=1'); return; }
        setLoading(planId);
        try {
            const res = await apiClient.createCheckoutSession(planId as PaidPlanId);
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error?.message ?? 'Failed to start checkout');
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-kumo-canvas">
            <title>Pricing - Masidy</title>
            <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-16 pb-16 sm:pb-24">
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold font-funky-mono text-kumo-strong mb-3">
                        Build more, pay as you grow
                    </h1>
                    <p className="text-base text-kumo-subtle max-w-xl mx-auto">
                        Every plan includes all features. Credits control how many AI builds you get per month.
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5">
                        <Zap className="size-3.5 text-brand" />
                        <span className="text-sm font-medium">1 credit = 1 complete AI build</span>
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
                                    <span className="bg-brand text-black text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider mb-1.5">{plan.name}</p>
                                <div className="flex items-end gap-1 mb-0.5">
                                    <span className="text-3xl font-bold text-kumo-strong">
                                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                                    </span>
                                    {plan.price > 0 && <span className="text-kumo-subtle text-sm mb-1">/mo</span>}
                                </div>
                                <p className="text-xs text-kumo-subtle">{plan.tagline}</p>
                            </div>

                            <div className={cn(
                                'rounded-lg px-3 py-2.5',
                                'highlighted' in plan && plan.highlighted ? 'bg-brand/15' : 'bg-kumo-tint'
                            )}>
                                <p className="text-sm font-semibold text-kumo-default">{plan.credits}</p>
                                <p className="text-xs text-kumo-subtle mt-0.5">Resets monthly</p>
                            </div>

                            <ul className="flex flex-col gap-2 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-kumo-default">
                                        <Check className="size-3.5 text-brand shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={'highlighted' in plan && plan.highlighted ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={() => handleSelect(plan.id)}
                                loading={loading === plan.id}
                            >
                                {plan.id === 'free' ? 'Start free' : `Get ${plan.name}`}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 max-w-2xl mx-auto grid gap-5">
                    <h2 className="text-lg font-semibold text-kumo-strong text-center">Common questions</h2>
                    {[
                        { q: 'What is a credit?', a: '1 credit = 1 complete AI build — from prompt to live deployed app. Refining or chatting with an existing app does not use a credit.' },
                        { q: 'Do unused credits roll over?', a: 'No. Credits reset on the 1st of every month. Simple and predictable.' },
                        { q: 'Do all plans get every feature?', a: 'Yes. Custom domains, GitHub export, private apps, rollback history — everything is on every plan. Only the monthly credit count differs.' },
                        { q: 'Can I cancel anytime?', a: 'Yes. Cancel from Settings. You keep access until the end of your billing period, then move to Free.' },
                    ].map(({ q, a }) => (
                        <div key={q} className="grid gap-1">
                            <p className="text-sm font-semibold text-kumo-default">{q}</p>
                            <p className="text-sm text-kumo-subtle leading-relaxed">{a}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}