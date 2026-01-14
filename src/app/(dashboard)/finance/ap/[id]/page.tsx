
import { getApStatementById } from '@/features/finance/actions';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { formatCurrency } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ApDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { data: statement } = await getApStatementById({ id });

    if (!statement) {
        notFound();
    }

    const {
        statementNo,
        type,
        periodStart,
        periodEnd,
        totalAmount,
        status,
        createdAt,
        items,
        supplier,
        worker
    } = statement;

    const targetName = type === 'SUPPLIER' ? supplier?.name : worker?.name;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/finance/ap">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">对账单详情</h1>
                        <p className="text-muted-foreground">
                            {statementNo}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        打印
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        导出
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">对账对象</span>
                            <span className="font-medium">{targetName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">对账类型</span>
                            <span className="font-medium">
                                {type === 'SUPPLIER' ? '供应商对账' : '工人工费'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">对账周期</span>
                            <span className="font-medium">
                                {format(new Date(periodStart), 'yyyy-MM-dd')} 至{' '}
                                {format(new Date(periodEnd), 'yyyy-MM-dd')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">创建时间</span>
                            <span className="font-medium">
                                {createdAt ? format(new Date(createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="金额信息" />
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">状态</span>
                            <Badge variant={status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {status === 'COMPLETED' ? '已付款' : status === 'PENDING_PAYMENT' ? '待付款' : '已取消'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">总金额</span>
                            <span className="text-2xl font-bold">
                                {formatCurrency(Number(totalAmount))}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>对账明细</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>来源类型</TableHead>
                                <TableHead>来源单号</TableHead>
                                <TableHead>备注</TableHead>
                                <TableHead className="text-right">金额</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {item.sourceType === 'PURCHASE_ORDER'
                                            ? '采购单'
                                            : item.sourceType === 'INSTALL_TASK'
                                            ? '安装任务'
                                            : '其他'}
                                    </TableCell>
                                    <TableCell>{item.sourceNo}</TableCell>
                                    <TableCell>{item.remark || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(item.amount))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
