import { useEffect, useState, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { getLeadFunnelStats } from '../actions/queries';
import { getLeadChannelROIStats, LeadChannelROIStats } from '../actions/analytics';
import { SalesFunnelChart, FunnelStage } from '@/features/analytics/components/sales-funnel-chart';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Loader2, RefreshCw, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { exportToExcel, ExportColumn } from '@/shared/lib/export-utils';

export function LeadAnalyticsDashboard() {
    const [isPending, startTransition] = useTransition();
    const [dateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
    const [roiStats, setRoiStats] = useState<LeadChannelROIStats[]>([]);

    const handleExport = () => {
        if (roiStats.length === 0) {
            toast.error('暂无数据可导出');
            return;
        }

        const columns: ExportColumn<LeadChannelROIStats>[] = [
            { header: '渠道名称', accessorKey: 'channelName' },
            { header: '线索总数', accessorKey: 'leadCount' },
            { header: '报价总数', accessorKey: 'quoteCount' },
            { header: '成交订单数', accessorKey: 'orderCount' },
            { header: '成交转化率 (%)', accessorKey: (row) => `${row.conversionRate}%` },
            { header: '成交总金额 (¥)', accessorKey: 'totalAmount' },
            { header: '客单价 (¥)', accessorKey: 'avgOrderValue' },
            { header: '平均成交周期 (天)', accessorKey: 'avgCycleDays' },
        ];

        const dateStr = dateRange?.from ? `_${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to || new Date(), 'yyyyMMdd')}` : '';
        exportToExcel(roiStats, columns, `线索渠道ROI分析报告${dateStr}`);
        toast.success('报告导出成功');
    };

    const loadData = useCallback(() => {
        startTransition(async () => {
            try {
                const range = { from: dateRange?.from, to: dateRange?.to };
                const [funnelRes, roiRes] = await Promise.all([
                    getLeadFunnelStats(range),
                    getLeadChannelROIStats(range),
                ]);

                // 转换漏斗数据格式
                const statusMap: Record<string, string> = {
                    'PENDING_ASSIGNMENT': '线索流入',
                    'FOLLOWING_UP': '跟进中',
                    'WON': '成交',
                };

                const formattedFunnel: FunnelStage[] = Object.entries(statusMap).map(([status, label]) => {
                    const found = funnelRes.find(s => s.status === status);
                    return {
                        stage: label,
                        count: Number(found?.count || 0),
                    };
                });

                // 计算转化率
                formattedFunnel.forEach((item, index) => {
                    if (index > 0 && formattedFunnel[index - 1].count > 0) {
                        item.conversionRate = ((item.count / formattedFunnel[index - 1].count) * 100).toFixed(1);
                    } else {
                        item.conversionRate = null;
                    }
                });

                setFunnelData(formattedFunnel);
                setRoiStats(roiRes);
            } catch (error) {
                console.error('Failed to load analytics:', error);
                toast.error('获取分析数据异常');
            }
        });
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 计算全局平均成交周期
    const totalWon = roiStats.reduce((acc, curr) => acc + (curr.orderCount > 0 ? 1 : 0), 0);
    const globalAvgCycle = totalWon > 0
        ? (roiStats.reduce((acc, curr) => acc + curr.avgCycleDays, 0) / roiStats.length).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">线索高级分析</h2>
                    <p className="text-muted-foreground underline-offset-4">监控转化漏斗与渠道质量</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isPending || roiStats.length === 0}
                    >
                        导出报告
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => loadData()}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        刷新
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">累计线索数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{roiStats.reduce((acc, curr) => acc + curr.leadCount, 0)}</div>
                        <p className="text-xs text-muted-foreground">所选时间范围内</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总成交额</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{roiStats.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">订单确认金额</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均转化率</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(roiStats.reduce((acc, curr) => acc + curr.orderCount, 0) / (roiStats.reduce((acc, curr) => acc + curr.leadCount, 0) || 1) * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">线索 {'->'} 订单</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均成交周期</CardTitle>
                        <Loader2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{globalAvgCycle} 天</div>
                        <p className="text-xs text-muted-foreground">线索流入到 WON 耗时</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <SalesFunnelChart
                    data={funnelData}
                    className="col-span-3"
                    summary={{
                        overallConversion: funnelData.length > 0 && funnelData[0].count > 0
                            ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(1)
                            : 0,
                        avgCycleTime: globalAvgCycle
                    }}
                />

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            渠道转化分析 (ROI)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>渠道名称</TableHead>
                                    <TableHead className="text-right">线索数</TableHead>
                                    <TableHead className="text-right">转化率</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">成交周期</TableHead>
                                    <TableHead className="text-right">总成交额</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roiStats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            暂无渠道数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roiStats.map((row) => (
                                        <TableRow key={row.channelId}>
                                            <TableCell className="font-medium max-w-[120px] truncate">{row.channelName}</TableCell>
                                            <TableCell className="text-right">{row.leadCount}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {row.conversionRate}%
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {row.avgCycleDays}天
                                            </TableCell>
                                            <TableCell className="text-right">¥{row.totalAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
