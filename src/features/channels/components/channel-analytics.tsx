'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { getChannelAnalytics, ChannelAnalyticsData } from '../actions/analytics';
import { StatCard } from '@/features/analytics/components/stat-card';
import { ArrowUpRight, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

export function ChannelAnalytics() {
    const [data, setData] = useState<ChannelAnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getChannelAnalytics();
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" />
                <Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[400px]" />
        </div>;
    }

    // Aggregates
    const totalLeads = data.reduce((acc, curr) => acc + curr.totalLeads, 0);
    const totalOrders = data.reduce((acc, curr) => acc + curr.totalOrders, 0);
    const totalRevenue = data.reduce((acc, curr) => acc + curr.totalDealAmount, 0);
    const totalCommission = data.reduce((acc, curr) => acc + curr.commissionAmount, 0);

    // Avg ROI
    const avgRoi = totalCommission > 0 ? ((totalRevenue - totalCommission) / totalCommission) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Top Level Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="总线索数"
                    value={totalLeads}
                    icon={Users}
                    description="来自所有渠道"
                />
                <StatCard
                    title="总转化订单"
                    value={totalOrders}
                    icon={ShoppingCart}
                    description={`转化率 ${totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : 0}%`}
                />
                <StatCard
                    title="渠道总营收"
                    value={`¥${totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    description="成交总金额"
                />
                <StatCard
                    title="整体 ROI"
                    value={`${avgRoi.toFixed(0)}%`}
                    icon={ArrowUpRight}
                    trend={{ value: 12, label: '月环比' }} // Mock trend
                    className={cn(avgRoi > 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500")}
                />
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>渠道效果分析明细</CardTitle>
                    <CardDescription>各渠道投入产出比详细数据</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>渠道名称</TableHead>
                                <TableHead className="text-right">线索数</TableHead>
                                <TableHead className="text-right">成交订单</TableHead>
                                <TableHead className="text-right">转化率</TableHead>
                                <TableHead className="text-right">成交金额</TableHead>
                                <TableHead className="text-right">客单价</TableHead>
                                <TableHead className="text-right">佣金成本</TableHead>
                                <TableHead className="text-right">ROI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell className="text-right">{row.totalLeads}</TableCell>
                                    <TableCell className="text-right">{row.totalOrders}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={row.conversionRate > 20 ? "default" : "secondary"}>
                                            {row.conversionRate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">¥{row.totalDealAmount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">¥{row.avgTransactionValue.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">¥{row.commissionAmount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        <span className={cn(row.roi >= 100 ? "text-green-600" : "text-yellow-600")}>
                                            {row.roi}%
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
