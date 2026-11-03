/**
 * Billing Routes
 */
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
import { BillingController } from '../controllers/billing/controller';

export function setupBillingRoutes(app: Hono<AppEnv>): void {
    // Public: plan list
    app.get(
        '/api/billing/plans',
        setAuthLevel(AuthConfig.public),
        adaptController(BillingController, BillingController.getPlans),
    );

    // Authenticated: create checkout session
    app.post(
        '/api/billing/checkout',
        setAuthLevel(AuthConfig.authenticated),
        adaptController(BillingController, BillingController.createCheckout),
    );

    // Authenticated: customer portal
    app.post(
        '/api/billing/portal',
        setAuthLevel(AuthConfig.authenticated),
        adaptController(BillingController, BillingController.createPortal),
    );

    // Public: Stripe webhook
    app.post(
        '/api/webhooks/stripe',
        setAuthLevel(AuthConfig.public),
        adaptController(BillingController, BillingController.handleWebhook),
    );
}
