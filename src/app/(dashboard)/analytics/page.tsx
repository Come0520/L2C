"use client";

import React, { useEffect, useState } from "react";
import {
    getDashboardStats,
    getSalesFunnel,
    getOrderTrend,
    getLeaderboard
} from "@/features/analytics/actions";
import { StatCard } from "@/features/analytics/components/stat-card";
import { SalesFunnelChart } from "@/features/analytics/components/sales-funnel-chart";
import { OrderTrendChart } from "@/features/analytics/components/order-trend-chart";
import { LeaderboardTable, LeaderboardItem } from "@/features/analytics/components/leaderboard-table";
import { ARAgingWidget } from "@/features/dashboard/widgets/ar-aging-widget";
import { startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Loader2, DollarSign, Users, ShoppingCart, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";

interface KeyMetrics {
    totalSales: string;
    newLeads: number;
    orderCount: number;
    conversionRate: string;
    pendingReceivables: string;
    pendingPayables: string;
}

interface FunnelResponse {
    stages: any[];
    summary: {
        overallConversion: string;
        avgCycleTime: string;
    };
}

interface TrendData {
    date: string;
    amount: number;
    count: number;
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<KeyMetrics | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelResponse | null>(null);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);

    // Default to current month
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const startDate = dateRange?.from || startOfMonth(new Date());
                const endDate = dateRange?.to || endOfMonth(new Date());

                const [metricsRes, funnelRes, trendRes, leaderboardRes] = await Promise.all([
                    getDashboardStats({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
                    getSalesFunnel({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
                    getOrderTrend({ startDate: startDate.toISOString(), endDate: endDate.toISOString(), granularity: 'day' }),
                    getLeaderboard({ startDate: startDate.toISOString(), endDate: endDate.toISOString(), limit: 5, sortBy: 'amount' }),
                ]);

                if (metricsRes?.data?.success) setMetrics(metricsRes.data.data);
                if (funnelRes?.data?.success) setFunnelData(funnelRes.data.data);
                if (trendRes?.data?.success) setTrendData(trendRes.data.data.map((item: { date: string; amount: string; count: number }) => ({ ...item, amount: Number(item.amount) })));
                if (leaderboardRes?.data?.success) setLeaderboardData(leaderboardRes.data.data);

            } catch (error) {
                console.error(error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [dateRange]);

    if (loading && !metrics) {
        return <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => dateRange && setDateRange({ ...dateRange })} size="sm">
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Sales"
                    value={`¥${Number(metrics?.totalSales || 0).toLocaleString()}`}
                    icon={DollarSign}
                    description="Revenue in period"
                />
                <StatCard
                    title="Active Leads"
                    value={metrics?.newLeads || 0}
                    icon={Users}
                    description="New leads created"
                />
                <StatCard
                    title="Orders Won"
                    value={metrics?.orderCount || 0}
                    icon={ShoppingCart}
                    description="Confirmed orders"
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${metrics?.conversionRate || 0}%`}
                    icon={Percent}
                    description="Lead to Order"
                />
            </div>

            {/* Charts Row 1: Trend & Funnel */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <OrderTrendChart data={trendData} className="col-span-4" />
                <SalesFunnelChart
                    data={funnelData?.stages || []}
                    summary={funnelData?.summary}
                    className="col-span-3"
                />
            </div>

            {/* Charts Row 2: AR Aging & Leaderboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ARAgingWidget className="col-span-3" />
                <div className="col-span-4 space-y-4">
                    {/* We can keep pending payables here as a smaller card if needed, or just leaderboard */}
                    <StatCard
                        title="Pending Payables"
                        value={`¥${Number(metrics?.pendingPayables || 0).toLocaleString()}`}
                        icon={Wallet}
                        description="Unpaid purchase orders"
                        className=""
                    />
                    <LeaderboardTable data={leaderboardData} />
                </div>
            </div>
        </div>
    );
}
