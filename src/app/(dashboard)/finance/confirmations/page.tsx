import { Suspense } from 'react';
import { getStatementConfirmations } from '@/features/finance/actions/statement-confirmations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Plus, FileCheck2, AlertTriangle, Clock, CheckCircle2, Send } from 'lucide-react';
import { formatDate } from '@/shared/lib/date';

/**
 * 对账确认管理页面
 * 显示月结对账确认单列表
 */
export default async function StatementConfirmationsPage() {
    const result = await getStatementConfirmations();
    const confirmations = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            {/* 页头 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">对账确认</h1>
                    <p className="text-sm text-muted-foreground">管理月结客户和供应商的对账确认</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    生成对账单
                </Button>
            </div>

            {/* 列表 */}
            <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
                {confirmations.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <FileCheck2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            暂无对账确认单
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {confirmations.map((confirmation) => (
                            <Card key={confirmation.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-base font-semibold">
                                                {confirmation.confirmationNo}
                                            </CardTitle>
                                            <StatusBadge status={confirmation.status} />
                                        </div>
                                        <Badge variant={confirmation.type === 'CUSTOMER' ? 'default' : 'secondary'}>
                                            {confirmation.type === 'CUSTOMER' ? '客户对账' : '供应商对账'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {confirmation.targetName} · {confirmation.periodLabel}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-muted-foreground">账单金额</p>
                                                <p className="text-lg font-semibold text-primary">
                                                    ¥{Number(confirmation.totalAmount).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">已确认</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    ¥{Number(confirmation.confirmedAmount || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">争议金额</p>
                                                <p className="text-lg font-semibold text-orange-500">
                                                    ¥{Number(confirmation.disputedAmount || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                查看明细
                                            </Button>
                                            {confirmation.status === 'PENDING' && (
                                                <Button size="sm" variant="default">
                                                    <Send className="mr-1 h-3 w-3" />
                                                    发送
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                        创建于 {formatDate(confirmation.createdAt)}
                                        {confirmation.sentAt && ` · 发送于 ${formatDate(confirmation.sentAt)}`}
                                        {confirmation.confirmedAt && ` · 确认于 ${formatDate(confirmation.confirmedAt)}`}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </Suspense>
        </div>
    );
}

// 状态徽章组件
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        PENDING: { icon: Clock, label: '待发送', variant: 'secondary' },
        SENT: { icon: Send, label: '已发送', variant: 'outline' },
        CONFIRMED: { icon: CheckCircle2, label: '已确认', variant: 'default' },
        DISPUTED: { icon: AlertTriangle, label: '有争议', variant: 'destructive' },
        RESOLVED: { icon: CheckCircle2, label: '已解决', variant: 'default' },
    };

    const { icon: Icon, label, variant } = config[status] || config.PENDING;

    return (
        <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}
