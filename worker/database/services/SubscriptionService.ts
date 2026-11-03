/**
 * SubscriptionService — manages user plan/subscription state.
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';

export class SubscriptionService extends BaseService {

    /** Get or create a free subscription for a user. */
    async getOrCreateSubscription(userId: string): Promise<schema.Subscription> {
        const existing = await this.database
            .select()
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.userId, userId))
            .get();
        if (existing) return existing;

        const [created] = await this.database
            .insert(schema.subscriptions)
            .values({ id: generateId(), userId, plan: 'free', status: 'active' })
            .returning();
        return created;
    }

    async getSubscription(userId: string): Promise<schema.Subscription | null> {
        return await this.database
            .select()
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.userId, userId))
            .get() ?? null;
    }

    async getUserPlan(userId: string): Promise<schema.Plan> {
        const sub = await this.getSubscription(userId);
        if (!sub || sub.status === 'canceled') return 'free';
        return sub.plan as schema.Plan;
    }

    async updateSubscription(
        userId: string,
        updates: Partial<typeof schema.subscriptions.$inferInsert>,
    ): Promise<void> {
        await this.database
            .update(schema.subscriptions)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.subscriptions.userId, userId));
    }

    /** Upsert from Stripe webhook data. */
    async upsertFromStripe(data: {
        userId: string;
        plan: schema.Plan;
        stripeCustomerId: string;
        stripeSubscriptionId: string;
        status: 'active' | 'canceled' | 'past_due' | 'trialing';
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
    }): Promise<void> {
        const existing = await this.getSubscription(data.userId);
        if (existing) {
            await this.database
                .update(schema.subscriptions)
                .set({
                    plan: data.plan,
                    stripeCustomerId: data.stripeCustomerId,
                    stripeSubscriptionId: data.stripeSubscriptionId,
                    status: data.status,
                    currentPeriodStart: data.currentPeriodStart,
                    currentPeriodEnd: data.currentPeriodEnd,
                    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                    updatedAt: new Date(),
                })
                .where(eq(schema.subscriptions.userId, data.userId));
        } else {
            await this.database
                .insert(schema.subscriptions)
                .values({ id: generateId(), ...data });
        }
    }
}