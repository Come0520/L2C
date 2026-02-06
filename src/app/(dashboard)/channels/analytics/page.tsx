import { Suspense } from 'react';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import {
    getChannelStatsOverview,
    getChannelRanking,
    getChannelTrend
} from '@/features/channels/actions/channel-stats';
import { ChannelRanking } from '@/features/channels/components/channel-ranking';
import { TrendingUp, Users, DollarSign, Percent, Wallet } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * 渠道业绩分析页面
 * 
 * 权限：仅 ADMIN / MANAGER 可访问
 */
export default async function ChannelAnalyticsPage() {
    const session = await auth();

    if (!session?.user?.tenantId) {
        redirect('/login');
    }

    // 权限检查
    const userRole = session.user.role;
    if (!['ADMIN', 'MANAGER'].includes(userRole || '')) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">您没有权限访问此页面</p>
            </div>
        );
    }

    // 获取数据
    let overview = {
        activeChannelCount: 0,
        totalDealAmount: 0,
        totalLeadCount: 0,
        avgConversionRate: 0,
        pendingCommission: 0,
    };
    let ranking: Awaited<ReturnType<typeof getChannelRanking>> = [];
    let trend: Awaited<ReturnType<typeof getChannelTrend>> = [];

    try {
        [overview, ranking, trend] = await Promise.all([
            getChannelStatsOverview(),
            getChannelRanking({ limit: 10, period: 'month' }),
            getChannelTrend({ months: 6 }),
        ]);
    } catch (error) {
        console.error('加载渠道统计数据失败:', error);
    }

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="渠道业绩分析"
                subtitle="查看渠道合作数据、业绩排名与趋势分析"
            />

            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="活跃渠道"
                    value={overview.activeChannelCount.toString()}
                    icon={<Users className="h-4 w-4" />}
                    description="30天内有成交"
                />
                <StatCard
                    title="本月带单"
                    value={formatAmount(overview.totalDealAmount)}
                    icon={<DollarSign className="h-4 w-4" />}
                    valueColor="text-green-600"
                />
                <StatCard
                    title="本月线索"
                    value={overview.totalLeadCount.toString()}
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatCard
                    title="平均转化率"
                    value={`${overview.avgConversionRate.toFixed(1)}%`}
                    icon={<Percent className="h-4 w-4" />}
                />
                <StatCard
                    title="待结算佣金"
                    value={formatAmount(overview.pendingCommission)}
                    icon={<Wallet className="h-4 w-4" />}
                    valueColor="text-orange-600"
                />
            </div>

            {/* 趋势图 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">带单趋势</CardTitle>
                </CardHeader>
                <CardContent>
                    <TrendChart data={trend} />
                </CardContent>
            </Card>

            {/* 渠道排行榜 */}
            <ChannelRanking data={ranking} />
        </div>
    );
}

/**
 * 统计卡片组件
 */
function StatCard({
    title,
    value,
    icon,
    description,
    valueColor = 'text-foreground'
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    description?: string;
    valueColor?: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    <span className="text-muted-foreground">{icon}</span>
                </div>
                <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * 简单的趋势图（使用 CSS 条形图）
 */
function TrendChart({ data }: { data: { month: string; dealAmount: number; dealCount: number }[] }) {
    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
                暂无趋势数据
            </div>
        );
    }

    const maxAmount = Math.max(...data.map(d => d.dealAmount), 1);

    return (
        <div className="h-48 flex items-end gap-2">
            {data.map((item) => {
                const height = (item.dealAmount / maxAmount) * 100;
                return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                            <span className="text-xs font-medium mb-1">
                                {formatAmount(item.dealAmount)}
                            </span>
                            <div
                                className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary"
                                style={{ height: `${Math.max(height, 5)}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {item.month.slice(5)}月
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * 格式化金额
 */
function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `¥${(amount / 10000).toFixed(1)}万`;
    }
    return `¥${amount.toLocaleString()}`;
}
