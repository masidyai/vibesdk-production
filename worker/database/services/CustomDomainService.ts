/**
 * CustomDomainService — manages custom domain → app mappings.
 *
 * Verification flow:
 * 1. User adds domain → we create a record with a random verification_token
 * 2. User adds a CNAME or TXT record to their DNS pointing to masidy.dev
 * 3. User clicks "Verify" → we check DNS (best-effort via Cloudflare DNS-over-HTTPS)
 * 4. On success we mark verified=true and optionally provision a CF custom hostname
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';

function generateVerificationToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class CustomDomainService extends BaseService {

    async getDomainsForApp(appId: string): Promise<schema.CustomDomain[]> {
        return this.database
            .select()
            .from(schema.customDomains)
            .where(eq(schema.customDomains.appId, appId));
    }

    async getDomainByName(domain: string): Promise<schema.CustomDomain | null> {
        const rows = await this.database
            .select()
            .from(schema.customDomains)
            .where(eq(schema.customDomains.domain, domain))
            .limit(1);
        return rows[0] ?? null;
    }

    async addDomain(appId: string, userId: string, domain: string): Promise<schema.CustomDomain> {
        // Normalize domain — lowercase, no trailing slash or protocol
        const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

        // Check it looks like a valid domain
        if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(normalized)) {
            throw new Error('Invalid domain format');
        }

        // Check not already taken by another app
        const existing = await this.getDomainByName(normalized);
        if (existing && existing.appId !== appId) {
            throw new Error('Domain is already in use by another app');
        }
        if (existing) return existing; // idempotent re-add

        const verificationToken = generateVerificationToken();
        const [created] = await this.database
            .insert(schema.customDomains)
            .values({ id: generateId(), appId, userId, domain: normalized, verificationToken })
            .returning();
        return created;
    }

    async removeDomain(domainId: string, userId: string): Promise<boolean> {
        const rows = await this.database
            .select({ id: schema.customDomains.id })
            .from(schema.customDomains)
            .where(and(
                eq(schema.customDomains.id, domainId),
                eq(schema.customDomains.userId, userId),
            ))
            .limit(1);
        if (!rows[0]) return false;

        await this.database
            .delete(schema.customDomains)
            .where(eq(schema.customDomains.id, domainId));
        return true;
    }

    /**
     * Verify a domain by checking DNS via Cloudflare DoH.
     * The user must have added a CNAME masidy.dev OR a TXT record
     * with the verification token.
     */
    async verifyDomain(
        domainId: string,
        userId: string,
        customDomain: string,
    ): Promise<{ verified: boolean; reason?: string }> {
        const rows = await this.database
            .select()
            .from(schema.customDomains)
            .where(and(
                eq(schema.customDomains.id, domainId),
                eq(schema.customDomains.userId, userId),
            ))
            .limit(1);
        const record = rows[0];
        if (!record) return { verified: false, reason: 'Domain record not found' };
        if (record.verified) return { verified: true };

        try {
            // Check CNAME record via Cloudflare DNS-over-HTTPS
            const cnameRes = await fetch(
                `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(record.domain)}&type=CNAME`,
                { headers: { Accept: 'application/dns-json' } },
            );
            const cnameData = await cnameRes.json() as { Answer?: { data: string }[] };
            const cnameTarget = cnameData.Answer?.[0]?.data?.replace(/\.$/, '');
            const cnameOk = cnameTarget === customDomain || cnameTarget?.endsWith(`.${customDomain}`);

            // Check TXT record for verification token
            const txtRes = await fetch(
                `https://cloudflare-dns.com/dns-query?name=_masidy-verify.${encodeURIComponent(record.domain)}&type=TXT`,
                { headers: { Accept: 'application/dns-json' } },
            );
            const txtData = await txtRes.json() as { Answer?: { data: string }[] };
            const txtOk = txtData.Answer?.some(a => a.data.includes(record.verificationToken));

            if (!cnameOk && !txtOk) {
                return {
                    verified: false,
                    reason: `No matching CNAME (pointing to ${customDomain}) or TXT (_masidy-verify.${record.domain}) record found`,
                };
            }

            await this.database
                .update(schema.customDomains)
                .set({ verified: true, updatedAt: new Date() })
                .where(eq(schema.customDomains.id, domainId));

            return { verified: true };
        } catch (error) {
            return { verified: false, reason: 'DNS lookup failed — please try again shortly' };
        }
    }
}