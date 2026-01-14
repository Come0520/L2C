
import { getReconciliation } from "@/features/finance/actions/reconciliation";
import { DashboardPageHeader } from "@/shared/ui/dashboard-page-header";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default async function ReconciliationDetailPage({ params }: { params: { id: string } }) {
    const reconciliation = await getReconciliation(params.id);

    if (!reconciliation) {
        notFound();
    }

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'COMPLETED': return 'success';
            case 'DISPUTED': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'PENDING': '待核对',
            'COMPLETED': '已平账',
            'DISPUTED': '有差异',
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title={`对账单详情: ${reconciliation.reconciliationNo}`}
                subtitle="查看对账详细信息、差异及处理记录"
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/finance/reconciliation">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回列表
                        </Link>
                    </Button>
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
                                <p className="text-base font-medium">{reconciliation.reconciliationNo}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">状态</label>
                                <div>
                                    <Badge variant={getStatusVariant(reconciliation.status)}>
                                        {getStatusLabel(reconciliation.status)}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">对账类型</label>
                                <p className="text-base">{reconciliation.reconciliationType}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">对方名称</label>
                                <p className="text-base">{reconciliation.targetName || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">对账周期</label>
                                <p className="text-base">
                                    {/* 对账周期暂无字段，使用创建时间 */}
                                    {reconciliation.createdAt ? format(new Date(reconciliation.createdAt), 'yyyy-MM') : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">创建时间</label>
                                <p className="text-base">
                                    {reconciliation.createdAt ? format(new Date(reconciliation.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
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
                            <span className="text-xl font-bold">¥{reconciliation.totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-500">差异金额</span>
                            <span className={`text-lg font-semibold ${Number(reconciliation.unmatchedAmount || 0) !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ¥{reconciliation.unmatchedAmount}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 明细列表 (如果有) */}
            {reconciliation.details && reconciliation.details.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>对账明细</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>单据编号</TableHead>
                                    <TableHead>关联单号</TableHead>
                                    <TableHead>账单金额</TableHead>
                                    <TableHead>核销金额</TableHead>
                                    <TableHead>差异</TableHead>
                                    <TableHead>说明</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reconciliation.details.map((detail: any) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>{detail.documentNo}</TableCell>
                                        <TableCell>{detail.relatedDocumentNo || '-'}</TableCell>
                                        <TableCell>¥{detail.documentAmount || '0.00'}</TableCell>
                                        <TableCell>¥{detail.reconciliationAmount || '0.00'}</TableCell>
                                        <TableCell className={Number(detail.difference) !== 0 ? 'text-red-500 font-bold' : ''}>
                                            ¥{detail.difference || '0.00'}
                                        </TableCell>
                                        <TableCell>{detail.remark || '-'}</TableCell>
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
