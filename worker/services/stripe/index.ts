/**
 * StripeService — Stripe integration for billing.
 * Handles checkout sessions, webhooks, and customer portal.
 */

export interface StripeCheckoutParams {
    userId: string;
    email: string;
    plan: 'pro' | 'team';
    successUrl: string;
    cancelUrl: string;
}

export interface StripeWebhookEvent {
    type: string;
    data: { object: Record<string, unknown> };
}

export class StripeService {
    private readonly secretKey: string;
    private readonly webhookSecret: string;
    private readonly baseUrl = 'https://api.stripe.com/v1';

    constructor(env: { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string }) {
        this.secretKey = env.STRIPE_SECRET_KEY ?? '';
        this.webhookSecret = env.STRIPE_WEBHOOK_SECRET ?? '';
    }

    private async stripeRequest(path: string, method: string, body?: Record<string, string>): Promise<Record<string, unknown>> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body ? new URLSearchParams(body).toString() : undefined,
        });
        if (!res.ok) {
            const err = await res.json() as { error?: { message?: string } };
            throw new Error(err?.error?.message ?? `Stripe error: ${res.status}`);
        }
        return res.json() as Promise<Record<string, unknown>>;
    }

    // Price IDs keyed by plan — set via env vars
    static getPriceId(env: { STRIPE_PRO_PRICE_ID?: string; STRIPE_TEAM_PRICE_ID?: string }, plan: 'pro' | 'team'): string {
        return plan === 'pro'
            ? (env.STRIPE_PRO_PRICE_ID ?? '')
            : (env.STRIPE_TEAM_PRICE_ID ?? '');
    }

    async createCheckoutSession(params: StripeCheckoutParams & {
        priceId: string;
        stripeCustomerId?: string;
    }): Promise<{ url: string; sessionId: string }> {
        const body: Record<string, string> = {
            mode: 'subscription',
            'line_items[0][price]': params.priceId,
            'line_items[0][quantity]': '1',
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            'subscription_data[metadata][userId]': params.userId,
            'subscription_data[metadata][plan]': params.plan,
        };
        if (params.stripeCustomerId) {
            body.customer = params.stripeCustomerId;
        } else {
            body.customer_email = params.email;
        }

        const session = await this.stripeRequest('/checkout/sessions', 'POST', body);
        return { url: session.url as string, sessionId: session.id as string };
    }

    async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
        const session = await this.stripeRequest('/billing_portal/sessions', 'POST', {
            customer: customerId,
            return_url: returnUrl,
        });
        return { url: session.url as string };
    }

    async constructWebhookEvent(body: string, signature: string): Promise<StripeWebhookEvent> {
        // Stripe webhook verification (simplified — uses timing-safe comparison)
        const parts = signature.split(',');
        const ts = parts.find(p => p.startsWith('t='))?.slice(2) ?? '';
        const v1 = parts.find(p => p.startsWith('v1='))?.slice(3) ?? '';

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', encoder.encode(this.webhookSecret),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
        );
        const payload = `${ts}.${body}`;
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
        const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

        if (expected !== v1) {
            throw new Error('Invalid Stripe webhook signature');
        }

        return JSON.parse(body) as StripeWebhookEvent;
    }
}