/**
 * Pricing page — /pricing
 */
import { useState } from 'react';
import { Button } from '@cloudflare/kumo';
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Check } from 'lucide-react';

const PLANS = [
    {
        id: 'free' as const,
        name: 'Free',
        price: 0,
        description: 'Get started building apps with AI',
        builds: '10 builds / month',
        features: [
            '10 AI builds per month',
            'Live preview deployments',
            'masidy.dev subdomain',
            'Community support',
        ],
    },
    {
        id: 'pro' as const,
        name: 'Pro',
        price: 19,
        description: 'For individuals shipping real products',
        builds: '100 builds / month',
        features: [
            '100 AI builds per month',
            'Custom domain support',
            'Priority AI processing',
            'Email support',
            'All Free features',
        ],
        highlighted: true,
    },
    {
        id: 'team' as const,
        name: 'Team',
        price: 49,
        description: 'For teams building at scale',
        builds: 'Unlimited builds',
        features: [
            'Unlimited AI builds',
            'Custom domains',
            'Team workspaces',
            'Priority support',
            'All Pro features',
        ],
    },
];

export default function PricingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelect = async (planId: 'free' | 'pro' | 'team') => {
        if (planId === 'free') {
            navigate('/');
            return;
        }
        if (!user) {
            navigate('/?signin=1');
            return;
        }
        setLoading(planId);
        try {
            const res = await apiClient.createCheckoutSession(planId);
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
            <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-16 pb-16 sm:pb-24">
                <div className="text-center mb-12">
                    <h1 className="text-2xl sm:text-4xl font-bold font-funky-mono text-kumo-strong mb-3">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-kumo-subtle max-w-xl mx-auto">
                        Build AI-powered apps and deploy them live. No Cloudflare account needed.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-6 flex flex-col gap-5 ring-1 ${
                                plan.highlighted
                                    ? 'ring-brand bg-kumo-elevated shadow-lg shadow-brand/10'
                                    : 'ring-kumo-line bg-kumo-base'
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                                    <span className="bg-brand text-black text-xs font-bold px-3 py-1 rounded-full">
                                        Most popular
                                    </span>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-semibold text-kumo-subtle uppercase tracking-wider mb-1">
                                    {plan.name}
                                </p>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-bold text-kumo-strong">
                                        ${plan.price}
                                    </span>
                                    {plan.price > 0 && (
                                        <span className="text-kumo-subtle mb-1">/month</span>
                                    )}
                                </div>
                                <p className="text-sm text-kumo-subtle mt-1">{plan.description}</p>
                            </div>

                            <div className="bg-brand/10 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-kumo-default">{plan.builds}</p>
                            </div>

                            <ul className="flex flex-col gap-2 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-kumo-default">
                                        <Check className="size-4 text-brand shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.highlighted ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={() => handleSelect(plan.id)}
                                loading={loading === plan.id}
                            >
                                {plan.id === 'free' ? 'Get started free' : `Get ${plan.name}`}
                            </Button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}