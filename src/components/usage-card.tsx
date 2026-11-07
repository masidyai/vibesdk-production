/**
 * UsageCard — shows current plan, builds used/remaining, and upgrade CTA.
 * Used in Settings page and profile.
 */
import { Button, LayerCard } from '@cloudflare/kumo';
import { useLimitsContext } from '@/contexts/limits-context';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Zap } from 'lucide-react';

const PLAN_NAMES: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };
const PLAN_COLORS: Record<string, string> = {
    free: 'bg-kumo-tint text-kumo-default',
    pro: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    team: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    enterprise: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
};

export function UsageCard() {
    const { data, loading } = useLimitsContext();
    const [upgrading, setUpgrading] = useState(false);

    const usage = data?.buildUsage;
    const plan = usage?.plan ?? 'free';
    const buildsUsed = usage?.buildsUsed ?? 0;
    const buildsLimit = usage?.buildsLimit ?? 10;
    const periodEnd = usage?.periodEnd ? new Date(usage.periodEnd) : null;
    const isUnlimited = buildsLimit >= 999999;
    const pct = isUnlimited ? 0 : Math.min(100, Math.round((buildsUsed / buildsLimit) * 100));

    const handleUpgrade = async (targetPlan: 'pro' | 'team' | 'enterprise') => {
        setUpgrading(true);
        try {
            const res = await apiClient.createCheckoutSession(targetPlan);
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error?.message ?? 'Failed to start checkout');
            }
        } catch {
            toast.error('Failed to start checkout');
        } finally {
            setUpgrading(false);
        }
    };

    const handleManage = async () => {
        setUpgrading(true);
        try {
            const res = await apiClient.createBillingPortalSession();
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error?.message ?? 'Failed to open billing portal');
            }
        } catch {
            toast.error('Failed to open billing portal');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <LayerCard>
            <LayerCard.Secondary className="font-funky-mono tracking-tighter">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Zap className="size-4" />
                        <span>Plan &amp; Usage</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>
                        {PLAN_NAMES[plan]}
                    </span>
                </div>
            </LayerCard.Secondary>
            <LayerCard.Primary>
                {loading ? (
                    <div className="h-12 flex items-center">
                        <span className="text-sm text-kumo-subtle">Loading usage...</span>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-kumo-subtle">Builds this month</span>
                                <span className="font-medium text-kumo-default">
                                    {isUnlimited ? `${buildsUsed} (unlimited)` : `${buildsUsed} / ${buildsLimit}`}
                                </span>
                            </div>
                            {!isUnlimited && (
                                <div className="h-1.5 rounded-full bg-kumo-line overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-brand'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}
                            {periodEnd && (
                                <p className="text-xs text-kumo-subtle">
                                    Resets {periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            )}
                        </div>

                        {plan === 'free' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                    <p className="text-sm font-semibold">Pro — $19/mo</p>
                                    <p className="text-xs text-kumo-subtle">50 credits/month</p>
                                    <Button variant="primary" size="sm" onClick={() => handleUpgrade('pro')} loading={upgrading} className="w-full">Upgrade to Pro</Button>
                                </div>
                                <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                    <p className="text-sm font-semibold">Team — $49/mo</p>
                                    <p className="text-xs text-kumo-subtle">200 credits/month</p>
                                    <Button variant="secondary" size="sm" onClick={() => handleUpgrade('team')} loading={upgrading} className="w-full">Get Team</Button>
                                </div>
                                <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                    <p className="text-sm font-semibold">Enterprise — $199/mo</p>
                                    <p className="text-xs text-kumo-subtle">1,000 credits/month</p>
                                    <Button variant="secondary" size="sm" onClick={() => handleUpgrade('enterprise')} loading={upgrading} className="w-full">Get Enterprise</Button>
                                </div>
                            </div>
                        )}
                        {plan === 'pro' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                    <p className="text-sm font-semibold">Team — $49/mo</p>
                                    <p className="text-xs text-kumo-subtle">200 credits/month</p>
                                    <Button variant="primary" size="sm" onClick={() => handleUpgrade('team')} loading={upgrading} className="w-full">Upgrade to Team</Button>
                                </div>
                                <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                    <p className="text-sm font-semibold">Enterprise — $199/mo</p>
                                    <p className="text-xs text-kumo-subtle">1,000 credits/month</p>
                                    <Button variant="secondary" size="sm" onClick={() => handleUpgrade('enterprise')} loading={upgrading} className="w-full">Get Enterprise</Button>
                                </div>
                            </div>
                        )}
                        {plan === 'team' && (
                            <div className="rounded-lg border border-kumo-line p-3 grid gap-1.5">
                                <p className="text-sm font-semibold">Enterprise — $199/mo</p>
                                <p className="text-xs text-kumo-subtle">1,000 credits/month — for power teams</p>
                                <Button variant="primary" size="sm" onClick={() => handleUpgrade('enterprise')} loading={upgrading} className="w-full">Upgrade to Enterprise</Button>
                            </div>
                        )}
                        {plan !== 'free' && (
                            <div>
                                <Button variant="secondary" size="sm" onClick={handleManage} loading={upgrading}>
                                    Manage subscription
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </LayerCard.Primary>
        </LayerCard>
    );
}
