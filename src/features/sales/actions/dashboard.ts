'use server';

import { db } from '@/shared/api/db';
import { quotes, customers, salesTargets, users } from '@/shared/api/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

export interface DashboardStats {
    target: {
        amount: number;
        achieved: number;
        percentage: number;
    };
    stats: {
        leads: number;
        leadsBreakdown: {
            pending: number;
            following: number;
            won: number;
        };
        quotes: number;
        orders: number;
        cash: string;
        conversionRate: string;
        avgOrderValue: string;
    };
}

export async function getSalesDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true, role: true, tenantId: true }
        });

        if (!user) return { success: false, error: 'User not found' };

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let targetAmount = 0;
        let totalCash = 0;
        let totalLeads = 0;
        let pendingLeads = 0;
        let followingLeads = 0;
        let wonLeads = 0;
        let quotesCount = 0;
        let ordersCount = 0;

        if (user.role === 'admin' || user.role === 'BOSS' || user.role === 'manager') {
            // --- TEAM VIEW ---
            const teamTargetRes = await db
                .select({ total: sum(salesTargets.targetAmount) })
                .from(salesTargets)
                .where(and(
                    eq(salesTargets.tenantId, user.tenantId),
                    eq(salesTargets.year, currentYear),
                    eq(salesTargets.month, currentMonth)
                ));

            targetAmount = parseFloat(teamTargetRes[0]?.total as string) || 0;

            const leadsStats = await db
                .select({
                    status: customers.pipelineStatus,
                    count: count()
                })
                .from(customers)
                .where(eq(customers.tenantId, user.tenantId))
                .groupBy(customers.pipelineStatus);

            totalLeads = leadsStats.reduce((acc, curr) => acc + curr.count, 0);
            pendingLeads = leadsStats.filter(s => ['UNASSIGNED', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
            followingLeads = leadsStats.filter(s => ['PENDING_QUOTE', 'QUOTE_SENT', 'PENDING_MEASUREMENT'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
            wonLeads = leadsStats.filter(s => ['IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);

            const qCount = await db.select({ count: count() }).from(quotes).where(eq(quotes.tenantId, user.tenantId));
            quotesCount = qCount[0].count;

            const oCount = await db.select({ count: count() }).from(quotes).where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'ORDERED')));
            ordersCount = oCount[0].count;

            const confirmedQuotes = await db.query.quotes.findMany({
                where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'ACCEPTED')),
                columns: { finalAmount: true },
            });
            totalCash = confirmedQuotes.reduce((sum, q) => sum + (parseFloat(q.finalAmount as string) || 0), 0);

        } else {
            // --- INDIVIDUAL SALES VIEW ---
            const myTargetRes = await db.query.salesTargets.findFirst({
                where: and(
                    eq(salesTargets.tenantId, user.tenantId),
                    eq(salesTargets.userId, user.id),
                    eq(salesTargets.year, currentYear),
                    eq(salesTargets.month, currentMonth)
                ),
                columns: { targetAmount: true }
            });
            targetAmount = parseFloat(myTargetRes?.targetAmount as string) || 0;

            const myLeadsStats = await db
                .select({
                    status: customers.pipelineStatus,
                    count: count()
                })
                .from(customers)
                .where(and(eq(customers.tenantId, user.tenantId), eq(customers.assignedSalesId, user.id)))
                .groupBy(customers.pipelineStatus);

            totalLeads = myLeadsStats.reduce((acc, curr) => acc + curr.count, 0);
            pendingLeads = myLeadsStats.filter(s => ['UNASSIGNED', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
            followingLeads = myLeadsStats.filter(s => ['PENDING_QUOTE', 'QUOTE_SENT', 'PENDING_MEASUREMENT'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
            wonLeads = myLeadsStats.filter(s => ['IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);

            const qCount = await db.select({ count: count() }).from(quotes).where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.createdBy, user.id)));
            quotesCount = qCount[0].count;

            const oCount = await db.select({ count: count() }).from(quotes).where(and(
                eq(quotes.tenantId, user.tenantId),
                eq(quotes.createdBy, user.id),
                eq(quotes.status, 'ORDERED')
            ));
            ordersCount = oCount[0].count;

            const myConfirmed = await db.query.quotes.findMany({
                where: and(
                    eq(quotes.tenantId, user.tenantId),
                    eq(quotes.createdBy, user.id),
                    eq(quotes.status, 'ACCEPTED')
                ),
                columns: { finalAmount: true },
            });
            totalCash = myConfirmed.reduce((sum, q) => sum + (parseFloat(q.finalAmount as string) || 0), 0);
        }

        return {
            success: true,
            data: {
                target: {
                    amount: targetAmount,
                    achieved: totalCash,
                    percentage: targetAmount > 0 ? Math.min(Math.round((totalCash / targetAmount) * 100), 100) : 0
                },
                stats: {
                    leads: totalLeads,
                    leadsBreakdown: {
                        pending: pendingLeads,
                        following: followingLeads,
                        won: wonLeads
                    },
                    quotes: quotesCount,
                    orders: ordersCount,
                    cash: (totalCash / 1000).toFixed(1),
                    conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0',
                    avgOrderValue: ordersCount > 0 ? (totalCash / ordersCount).toFixed(0) : '0'
                }
            }
        };

    } catch (error) {
        console.error('getSalesDashboardStats error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
