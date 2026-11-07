/**
 * Billing Controller — Stripe checkout + portal + plan management.
 */
import { BaseController } from '../baseController';
import type { RouteContext } from '../../types/route-context';
import { StripeService } from '../../../services/stripe';
import { SubscriptionService } from '../../../database/services/SubscriptionService';
import { createLogger } from '../../../logger';

const logger = createLogger('BillingController');

export class BillingController extends BaseController {

    /** GET /api/billing/plans — public, returns plan info */
    static async getPlans(_request: Request, _env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response> {
        return BillingController.createSuccessResponse({
            plans: [
                {
                    id: 'free',
                    name: 'Free',
                    price: 0,
                    buildsPerMonth: 10,
                    features: ['10 builds/month', 'masidy.dev subdomain', 'Community support'],
                },
                {
                    id: 'pro',
                    name: 'Pro',
                    price: 19,
                    buildsPerMonth: 50,
                    features: ['100 builds/month', 'Custom domain', 'Priority AI', 'Email support'],
                },
                {
                    id: 'team',
                    name: 'Team',
                    price: 49,
                    buildsPerMonth: 200,
                    features: ['200 credits/month', 'Custom domains (10)', 'Team workspaces', 'Priority support'],
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise',
                    price: 199,
                    buildsPerMonth: 1000,
                    features: ['1,000 credits/month', 'Unlimited custom domains', 'Dedicated support'],
                },
            ],
        });
    }

    /** POST /api/billing/checkout — create Stripe checkout session */
    static async createCheckout(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const user = routeContext.user;
        if (!user) return BillingController.createErrorResponse('Unauthorized', 401);

        if (!('STRIPE_SECRET_KEY' in env) || !(env as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY) {
            return BillingController.createErrorResponse('Billing not configured', 503);
        }

        const body = await BillingController.parseJsonBody<{ plan?: string }>(request);
        if (!body.success) return body.response!;
        const plan = body.data?.plan;
        if (plan !== 'pro' && plan !== 'team' && plan !== 'enterprise') {
            return BillingController.createErrorResponse('Invalid plan. Must be "pro" or "team"', 400);
        }

        const stripe = new StripeService(env as { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string });
        const subService = new SubscriptionService(env);
        const existing = await subService.getSubscription(user.id);

        const origin = new URL(request.url).origin;
        const priceId = StripeService.getPriceId(
            env as { STRIPE_PRO_PRICE_ID?: string; STRIPE_TEAM_PRICE_ID?: string; STRIPE_ENTERPRISE_PRICE_ID?: string },
            plan,
        );

        if (!priceId) {
            return BillingController.createErrorResponse('Plan price not configured', 503);
        }

        const { url } = await stripe.createCheckoutSession({
            userId: user.id,
            email: user.email,
            plan,
            priceId,
            stripeCustomerId: existing?.stripeCustomerId ?? undefined,
            successUrl: `${origin}/settings?upgraded=1`,
            cancelUrl: `${origin}/pricing`,
        });

        return BillingController.createSuccessResponse({ url });
    }

    /** POST /api/billing/portal — Stripe customer portal */
    static async createPortal(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const user = routeContext.user;
        if (!user) return BillingController.createErrorResponse('Unauthorized', 401);

        const subService = new SubscriptionService(env);
        const sub = await subService.getSubscription(user.id);
        if (!sub?.stripeCustomerId) {
            return BillingController.createErrorResponse('No active subscription found', 404);
        }

        const stripe = new StripeService(env as { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string });
        const origin = new URL(request.url).origin;
        const { url } = await stripe.createPortalSession(sub.stripeCustomerId, `${origin}/settings`);
        return BillingController.createSuccessResponse({ url });
    }

    /** POST /api/webhooks/stripe — Stripe webhook handler (public) */
    static async handleWebhook(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response> {
        const sig = request.headers.get('stripe-signature') ?? '';
        const body = await request.text();

        try {
            const stripe = new StripeService(env as { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string });
            const event = await stripe.constructWebhookEvent(body, sig);

            const obj = event.data.object as Record<string, unknown>;

            if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
                const metadata = (obj.metadata ?? (obj.subscription_data as Record<string, unknown>)?.metadata ?? {}) as Record<string, string>;
                const userId = metadata.userId ?? (obj.client_reference_id as string | undefined);
                const plan = (metadata.plan ?? 'free') as 'free' | 'pro' | 'team' | 'enterprise';

                if (userId) {
                    const subService = new SubscriptionService(env);
                    const status = event.type === 'customer.subscription.deleted' ? 'canceled'
                        : (obj.status as 'active' | 'trialing' | 'past_due') ?? 'active';

                    await subService.upsertFromStripe({
                        userId,
                        plan: status === 'canceled' ? 'free' : plan,
                        stripeCustomerId: (obj.customer as string) ?? '',
                        stripeSubscriptionId: ((obj.subscription ?? obj.id) as string) ?? '',
                        status,
                        currentPeriodStart: new Date(((obj.current_period_start as number) ?? 0) * 1000),
                        currentPeriodEnd: new Date(((obj.current_period_end as number) ?? 0) * 1000),
                        cancelAtPeriodEnd: (obj.cancel_at_period_end as boolean) ?? false,
                    });
                    logger.info('Subscription updated via webhook', { userId, plan, status });
                }
            }

            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            logger.error('Stripe webhook error', error);
            return new Response('Webhook error', { status: 400 });
        }
    }
}