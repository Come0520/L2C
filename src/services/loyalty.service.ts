import { db } from "@/shared/api/db";
import { customers, loyaltyTransactions } from "@/shared/api/schema";
import { eq } from "drizzle-orm";

export class LoyaltyService {

    /**
     * Award points to a customer.
     * @param customerId 
     * @param points 
     * @param source REFERRAL, ORDER, etc.
     * @param description 
     * @param tenantId 
     * @param userId optional logic/admin user
     */
    static async awardPoints(
        customerId: string,
        points: number,
        source: string,
        description: string,
        tenantId: string,
        userId?: string
    ) {
        return await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, customerId)
            });

            if (!customer) throw new Error("Customer not found");

            const currentPoints = customer.loyaltyPoints || 0;
            const newBalance = currentPoints + points;

            // Update Customer
            await tx.update(customers)
                .set({ loyaltyPoints: newBalance })
                .where(eq(customers.id, customerId));

            // Log Transaction
            await tx.insert(loyaltyTransactions).values({
                tenantId,
                customerId,
                type: points >= 0 ? 'EARN' : 'REDEEM',
                source,
                points,
                balanceAfter: newBalance,
                description,
                createdBy: userId,
            });

            return newBalance;
        });
    }

    /**
     * Process Referral Reward
     * Triggered when a new customer makes their first order or similar event.
     */
    static async processReferralReward(newCustomerId: string, orderAmount: string, tenantId: string) {
        const newCustomer = await db.query.customers.findFirst({
            where: eq(customers.id, newCustomerId)
        });

        if (!newCustomer || !newCustomer.referrerCustomerId) return;

        // Logic: Reward referrer 10% of order amount as points? or Fixed points?
        // Assuming simple fixed points for now or logic per config.
        const rewardPoints = 100; // Mock rule

        await this.awardPoints(
            newCustomer.referrerCustomerId,
            rewardPoints,
            'REFERRAL',
            `Referral reward for new customer ${newCustomer.name}`,
            tenantId
        );
    }
}
