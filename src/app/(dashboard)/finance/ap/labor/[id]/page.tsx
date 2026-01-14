
import { getAPLaborStatement } from "@/features/finance/actions/ap";
import { DashboardPageHeader } from "@/shared/ui/dashboard-page-header";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PaymentBillDialog } from "@/features/finance/components/PaymentBillDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default async function APLaborStatementDetailPage({ params }: { params: { id: string } }) {
    const statement = await getAPLaborStatement(params.id);

    if (!statement) {
        notFound();
    }

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'PARTIAL': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'PENDING': '待结算',
            'PARTIAL': '部分结算',
            'COMPLETED': '已结算',
            'CANCELLED': '已取消',
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title={`劳务结算单详情: ${statement.statementNo}`}
                subtitle="查看工人劳务结算详情及费用构成"
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/finance/ap?tab=labor">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回列表
                        </Link>
                    </Button>
                    {statement.status !== 'COMPLETED' && statement.status !== 'CANCELLED' && (
                        <PaymentBillDialog
                            statementType="AP_LABOR"
                            statementId={statement.id}
                            supplierName={statement.workerName}
                            supplierId={statement.workerId}
                            amount={statement.pendingAmount}
                            trigger={<Button>登记结算</Button>}
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
                                <label className="text-sm font-medium text-gray-500">结算单号</label>
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
                                <label className="text-sm font-medium text-gray-500">结算对象(工人)</label>
                                <p className="text-base">{statement.workerName || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">结算周期</label>
                                <p className="text-base">{statement.settlementPeriod || '-'}</p>
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
                            <span className="text-gray-500">已付金额</span>
                            <span className="text-lg font-semibold text-green-600">¥{statement.paidAmount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">剩余应付</span>
                            <span className="text-lg font-semibold text-red-600">¥{statement.pendingAmount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 费用明细 */}
            {statement.feeDetails && statement.feeDetails.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>费用明细</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>安装单号</TableHead>
                                    <TableHead>费用类型</TableHead>
                                    <TableHead>描述</TableHead>
                                    <TableHead>计算公式</TableHead>
                                    <TableHead>金额</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statement.feeDetails.map((detail: any) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>{detail.installTaskNo}</TableCell>
                                        <TableCell>{detail.feeType === 'BASE' ? '基础费用' : detail.feeType === 'EXTRA' ? '附加费' : '扣款'}</TableCell>
                                        <TableCell>{detail.description}</TableCell>
                                        <TableCell className="font-mono text-xs">{detail.calculation}</TableCell>
                                        <TableCell>¥{detail.amount}</TableCell>
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
