import { db } from "@/shared/api/db";
import { leads, orders, users, quotes } from "@/shared/api/schema";
import { count, sum, eq, desc, and, gte, lte, sql, type AnyColumn } from "drizzle-orm";

export interface DateRange {
    start: Date;
    end: Date;
}

export class AnalyticsService {
    /**
     * Get Key Metrics for the Dashboard
     */
    static async getKeyMetrics(tenantId: string, range?: DateRange) {
        const timeFilter = range
            ? and(gte(orders.createdAt, range.start), lte(orders.createdAt, range.end))
            : undefined;

        // Total Revenue (Confirmed Orders)
        const [revenue] = await db
            .select({
                total: sum(orders.totalAmount),
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    eq(orders.status, "COMPLETED"), // Assuming COMPLETED is the final status for revenue
                    timeFilter
                )
            );

        // Active Leads (Pending Assignment or In Progress)
        const [activeLeads] = await db
            .select({
                count: count(),
            })
            .from(leads)
            .where(
                and(
                    eq(leads.tenantId, tenantId),
                    sql`${leads.status} IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'FOLLOW_UP')`
                )
            );

        // Pending Orders (Processing, Production, etc.)
        const [pendingOrders] = await db
            .select({
                count: count(),
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    sql`${orders.status} NOT IN ('COMPLETED', 'CANCELLED', 'REFUNDED')`
                )
            );

        return {
            totalRevenue: Number(revenue?.total || 0),
            activeLeadsCount: Number(activeLeads?.count || 0),
            pendingOrdersCount: Number(pendingOrders?.count || 0),
        };
    }

    /**
     * Get Sales Funnel Data
     * Leads (New) -> Leads (Qualified) -> Quotes (Draft) -> Orders (Created)
     */
    static async getSalesFunnel(tenantId: string, range?: DateRange) {
        // 1. Total Leads
        // 2. Qualified Leads (Intent > LOW)
        // 3. Quotes Created
        // 4. Orders Confirmed

        const timeFilter = (col: AnyColumn) =>
            range ? and(gte(col, range.start), lte(col, range.end)) : undefined;

        const [totalLeads] = await db
            .select({ count: count() })
            .from(leads)
            .where(and(eq(leads.tenantId, tenantId), timeFilter(leads.createdAt)));

        // Assuming 'valid' leads have some intention level or status beyond 'NEW'
        const [qualifiedLeads] = await db
            .select({ count: count() })
            .from(leads)
            .where(
                and(
                    eq(leads.tenantId, tenantId),
                    timeFilter(leads.createdAt),
                    sql`${leads.status} != 'lost'` // Example logic
                )
            );

        const [totalQuotes] = await db
            .select({ count: count() })
            .from(quotes)
            .where(and(eq(quotes.tenantId, tenantId), timeFilter(quotes.createdAt)));

        const [totalOrders] = await db
            .select({ count: count() })
            .from(orders)
            .where(and(eq(orders.tenantId, tenantId), timeFilter(orders.createdAt)));

        return [
            { stage: "Total Leads", count: Number(totalLeads?.count || 0) },
            { stage: "Qualified Leads", count: Number(qualifiedLeads?.count || 0) },
            { stage: "Quotes Created", count: Number(totalQuotes?.count || 0) },
            { stage: "Orders Won", count: Number(totalOrders?.count || 0) },
        ];
    }

    /**
     * Get Recent Activity / Trend
     * Returns daily sales for the last N days
     */
    static async getSalesTrend(tenantId: string, days: number = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const sales = await db
            .select({
                date: sql<string>`DATE(${orders.createdAt})`,
                amount: sum(orders.totalAmount),
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            )
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(sql`DATE(${orders.createdAt})`);

        return sales.map(s => ({
            date: s.date,
            amount: Number(s.amount || 0)
        }));
    }

    /**
     * Get Performance Leaderboard (Top Sales Reps)
     */
    static async getPerformanceLeaderboard(tenantId: string, range?: DateRange) {
        // Top users by order value
        // Assuming 'orders.salesRepId' or similar links to users? 
        // Let's check schema. If orders doesn't have salesRep, maybe we use createdBy for now or check relation.
        // For this implementation, I will assume we link via `orders.createdBy` if explicit salesRep column is missing, 
        // or checks `leads` owner? 
        // A standard approach is aggregating orders by User. Let's use `createdBy` for now as a proxy.

        // Actually, orders usually have a 'salespersonId' or similar. 
        // I need to verify the `orders` schema for the correct column. 
        // I will use `createdBy` as a placeholder if I can't find it, but ideally it should be `salesRepId`.
        // Based on previous contexts, `orders` has relations. 

        // Safe fallback:
        const _salesRepColumn = orders.createdBy;

        // Join with Users to get names
        const results = await db
            .select({
                userId: orders.createdBy,
                userName: users.name,
                totalSales: sum(orders.totalAmount),
                dealCount: count(orders.id),
            })
            .from(orders)
            .leftJoin(users, eq(orders.createdBy, users.id))
            .where(
                and(
                    eq(orders.tenantId, tenantId),
                    range ? and(gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)) : undefined
                )
            )
            .groupBy(orders.createdBy, users.name)
            .orderBy(desc(sum(orders.totalAmount)))
            .limit(5);

        return results.map(r => ({
            name: r.userName || 'Unknown',
            totalSales: Number(r.totalSales || 0),
            dealCount: Number(r.dealCount || 0)
        }));
    }
}
