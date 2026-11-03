/**
 * UsageService — tracks per-user build counts per calendar month.
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';
import { SubscriptionService } from './SubscriptionService';

export class UsageService extends BaseService {

    /** Returns the first moment of the current UTC calendar month. */
    static currentPeriodStart(): Date {
        const d = new Date();
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    }

    /** Get (or create) the usage row for this user for the current month. */
    async getOrCreateCurrentUsage(userId: string): Promise<schema.UserUsage> {
        const periodStart = UsageService.currentPeriodStart();
        const existing = await this.database
            .select()
            .from(schema.userUsage)
            .where(
                and(
                    eq(schema.userUsage.userId, userId),
                    eq(schema.userUsage.periodStart, periodStart),
                ),
            )
            .get();
        if (existing) return existing;

        const [created] = await this.database
            .insert(schema.userUsage)
            .values({ id: generateId(), userId, periodStart, buildsUsed: 0 })
            .returning();
        return created;
    }

    /** Increment the build counter for the current month. Returns new count. */
    async incrementBuildCount(userId: string): Promise<number> {
        const row = await this.getOrCreateCurrentUsage(userId);
        const newCount = row.buildsUsed + 1;
        await this.database
            .update(schema.userUsage)
            .set({ buildsUsed: newCount, updatedAt: new Date() })
            .where(eq(schema.userUsage.id, row.id));
        return newCount;
    }

    /** Get current month usage + plan limits. */
    async getUserUsageSummary(userId: string): Promise<{
        buildsUsed: number;
        buildsLimit: number;
        plan: schema.Plan;
        periodStart: Date;
        periodEnd: Date;
        withinLimits: boolean;
    }> {
        const [usage, plan] = await Promise.all([
            this.getOrCreateCurrentUsage(userId),
            new SubscriptionService(this.env).getUserPlan(userId),
        ]);

        const limit = schema.PLAN_BUILD_LIMITS[plan];
        const periodStart = usage.periodStart;
        // Period ends at the start of next month
        const periodEnd = new Date(
            Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1),
        );

        return {
            buildsUsed: usage.buildsUsed,
            buildsLimit: Number.isFinite(limit) ? limit : 999999,
            plan,
            periodStart,
            periodEnd,
            withinLimits: !Number.isFinite(limit) || usage.buildsUsed < limit,
        };
    }
}