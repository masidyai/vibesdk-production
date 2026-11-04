/**
 * CustomDomainPanel — shown on app detail page for the app owner.
 * Lets them add, verify, and remove custom domains.
 */
import { useState, useEffect } from 'react';
import { LayerCard, Button, Input } from '@cloudflare/kumo';
import { Globe, Check, RefreshCw, Trash2, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface CustomDomainRecord {
    id: string;
    domain: string;
    verified: boolean;
    verificationToken: string;
}

interface Instructions {
    cname: { type: string; host: string; value: string; description: string };
    txt: { type: string; host: string; value: string; description: string };
}

interface Props {
    appId: string;
}

export function CustomDomainPanel({ appId }: Props) {
    const [domains, setDomains] = useState<CustomDomainRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDomain, setNewDomain] = useState('');
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<Instructions | null>(null);
    const { copy, copied } = useCopyToClipboard();

    const load = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getAppDomains(appId);
            if (res.success && res.data) {
                setDomains((res.data.domains as CustomDomainRecord[]) ?? []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, [appId]);

    const handleAdd = async () => {
        if (!newDomain.trim() || adding) return;
        setAdding(true);
        try {
            const res = await apiClient.addAppDomain(appId, newDomain.trim());
            if (res.success && res.data) {
                const data = res.data as { domain: CustomDomainRecord; instructions: Instructions };
                setDomains(prev => [...prev.filter(d => d.id !== data.domain.id), data.domain]);
                setInstructions(data.instructions);
                setNewDomain('');
                toast.success('Domain added — follow the DNS instructions below to verify it');
            } else {
                toast.error(res.error?.message ?? 'Failed to add domain');
            }
        } catch {
            toast.error('Failed to add domain');
        } finally {
            setAdding(false);
        }
    };

    const handleVerify = async (domainId: string) => {
        setVerifying(domainId);
        try {
            const res = await apiClient.verifyAppDomain(appId, domainId);
            if (res.success && res.data?.verified) {
                toast.success('Domain verified successfully!');
                await load();
                setInstructions(null);
            } else {
                toast.error(res.data?.reason ?? 'Domain not verified yet — check your DNS records');
            }
        } catch {
            toast.error('Verification failed — try again');
        } finally {
            setVerifying(null);
        }
    };

    const handleRemove = async (domainId: string) => {
        setRemoving(domainId);
        try {
            await apiClient.removeAppDomain(appId, domainId);
            setDomains(prev => prev.filter(d => d.id !== domainId));
            setInstructions(null);
            toast.success('Domain removed');
        } catch {
            toast.error('Failed to remove domain');
        } finally {
            setRemoving(null);
        }
    };

    return (
        <LayerCard>
            <LayerCard.Secondary className="font-funky-mono tracking-tighter">
                <div className="flex items-center gap-2">
                    <Globe className="size-4" />
                    <span>Custom Domains</span>
                </div>
            </LayerCard.Secondary>
            <LayerCard.Primary>
                <div className="grid gap-4">
                    <p className="text-sm text-kumo-subtle">
                        Add a custom domain to serve your app at your own URL. You need a Pro or Team plan.
                    </p>

                    {/* Add form */}
                    <div className="flex gap-2">
                        <Input
                            value={newDomain}
                            onChange={e => setNewDomain(e.target.value)}
                            placeholder="yourdomain.com"
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="flex-1"
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAdd}
                            loading={adding}
                            icon={<Plus className="size-4" />}
                        >
                            Add
                        </Button>
                    </div>

                    {/* DNS instructions */}
                    {instructions && (
                        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 grid gap-3">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Add one of these DNS records, then click Verify:
                            </p>
                            {[instructions.cname, instructions.txt].map((rec) => (
                                <div key={rec.type} className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                                            {rec.type}
                                        </span>
                                        <span className="text-xs text-amber-700 dark:text-amber-300">{rec.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-xs bg-kumo-base rounded px-2 py-1.5">
                                        <span className="text-kumo-subtle shrink-0">Host:</span>
                                        <span className="truncate">{rec.host}</span>
                                        <button onClick={() => copy(rec.host)} className="ml-auto text-kumo-subtle hover:text-kumo-default shrink-0">
                                            {copied ? <Check className="size-3" /> : <span className="text-[10px]">copy</span>}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-xs bg-kumo-base rounded px-2 py-1.5">
                                        <span className="text-kumo-subtle shrink-0">Value:</span>
                                        <span className="truncate">{rec.value}</span>
                                        <button onClick={() => copy(rec.value)} className="ml-auto text-kumo-subtle hover:text-kumo-default shrink-0">
                                            {copied ? <Check className="size-3" /> : <span className="text-[10px]">copy</span>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Existing domains */}
                    {loading ? (
                        <p className="text-sm text-kumo-subtle">Loading domains...</p>
                    ) : domains.length > 0 ? (
                        <div className="grid gap-2">
                            {domains.map(d => (
                                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ring ring-kumo-line">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Globe className="size-4 text-kumo-subtle shrink-0" />
                                        <span className="text-sm font-mono truncate">{d.domain}</span>
                                        {d.verified ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                                                <Check className="size-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {!d.verified && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleVerify(d.id)}
                                                loading={verifying === d.id}
                                                icon={<RefreshCw className="size-3.5" />}
                                            >
                                                Verify
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            shape="square"
                                            onClick={() => handleRemove(d.id)}
                                            loading={removing === d.id}
                                            icon={<Trash2 className="size-3.5 text-kumo-danger" />}
                                            aria-label="Remove domain"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-kumo-subtle">No custom domains added yet.</p>
                    )}
                </div>
            </LayerCard.Primary>
        </LayerCard>
    );
}