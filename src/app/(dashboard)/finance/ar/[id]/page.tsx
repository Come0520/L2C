
import { getARStatement } from "@/features/finance/actions/ar";
import { DashboardPageHeader } from "@/shared/ui/dashboard-page-header";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PaymentOrderDialog } from "@/features/finance/components/PaymentOrderDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default async function ARStatementDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const statement = await getARStatement(id);

    if (!statement) {
        notFound();
    }

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'PARTIAL': return 'info';
            case 'PAID': return 'success';
            case 'OVERDUE': return 'error';
            case 'CANCELLED': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'PENDING': '待收款',
            'PARTIAL': '部分收款',
            'PAID': '已收款',
            'OVERDUE': '已逾期',
            'CANCELLED': '已取消',
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title={`AR对账单详情: ${statement.statementNo}`}
                subtitle="查看客户应收对账单详细信息及关联订单"
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/finance/ar">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回列表
                        </Link>
                    </Button>
                    {statement.status !== 'PAID' && statement.status !== 'CANCELLED' && (
                        <PaymentOrderDialog
                            orderId={statement.orderId}
                            customerName={statement.customerName}
                            customerId={statement.customerId}
                            amount={statement.pendingAmount}
                            trigger={<Button>登记收款</Button>}
                        />
                    )}
                </div>
            </DashboardPageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 基本信息 */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">对账单号</label>
                                <p className="text-base font-medium">{statement.statementNo}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">状态</label>
                                <div>
                                    <Badge variant={getStatusVariant(statement.status)}>
                                        {getStatusLabel(statement.status)}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">关联订单</label>
                                <p className="text-base">{statement.order?.orderNo || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">客户</label>
                                <p className="text-base">{statement.customerName || statement.customer?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">创建时间</label>
                                <p className="text-base">
                                    {statement.createdAt ? format(new Date(statement.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 金额概览 */}
                <Card>
                    <CardHeader>
                        <CardTitle>金额概览</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500">总金额</span>
                            <span className="text-xl font-bold">¥{statement.totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500">已收金额</span>
                            <span className="text-lg font-semibold text-green-600">¥{statement.receivedAmount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">待收金额</span>
                            <span className="text-lg font-semibold text-red-600">¥{statement.pendingAmount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 更多详情 */}
            {statement.channel && (
                <Card>
                    <CardHeader>
                        <CardTitle>渠道信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">所属渠道</label>
                                <p>{statement.channel.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">佣金比例</label>
                                <p>{Number(statement.commissionRate || 0) * 100}%</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">佣金金额</label>
                                <p>¥{statement.commissionAmount || '0.00'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">佣金状态</label>
                                <p>{statement.commissionStatus || '未计算'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 佣金记录 */}
            {statement.commissionRecords && statement.commissionRecords.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>佣金记录</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>佣金编号</TableHead>
                                    <TableHead>合作模式</TableHead>
                                    <TableHead>佣金金额</TableHead>
                                    <TableHead>生成时间</TableHead>
                                    <TableHead>状态</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statement.commissionRecords.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.commissionNo}</TableCell>
                                        <TableCell>{record.cooperationMode}</TableCell>
                                        <TableCell>¥{record.commissionAmount}</TableCell>
                                        <TableCell>{format(new Date(record.calculatedAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                        <TableCell>{record.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
