'use client';

import { toast } from 'sonner';
import { useTransition } from 'react';
import { format } from 'date-fns';
import { updateJournalEntryStatus, reverseJournal } from '../actions/journal-entry-actions';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';

interface JournalEntryDetailProps {
    entry: any; // 从服务端获取的含明细凭证详情
    onStatusChange?: () => void;
    permissions?: {
        canSubmit: boolean;
        canReview: boolean;
        canReverse: boolean;
    };
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    DRAFT: { label: '草稿', variant: 'secondary' },
    PENDING_REVIEW: { label: '待审核', variant: 'outline' },
    POSTED: { label: '已记账', variant: 'default' },
    REVERSED: { label: '已冲销', variant: 'destructive' },
};

export function JournalEntryDetail({ entry, onStatusChange, permissions = { canSubmit: false, canReview: false, canReverse: false } }: JournalEntryDetailProps) {
    const [isPending, startTransition] = useTransition();

    if (!entry) return <div>凭证信息加载失败</div>;

    const handleUpdateStatus = (newStatus: 'DRAFT' | 'PENDING_REVIEW' | 'POSTED', rejectReason?: string) => {
        startTransition(async () => {
            const result = await updateJournalEntryStatus({ id: entry.id, status: newStatus, rejectReason });
            if (result?.error) {
                toast.error(result.error);
                return;
            }
            toast.success('状态更新成功');
            onStatusChange?.();
        });
    };

    const handleReverse = () => {
        const reason = window.prompt('请输入冲销原因:');
        if (!reason && reason !== '') return;

        startTransition(async () => {
            try {
                await reverseJournal(entry.id, reason || '自动红字冲销');
                toast.success('冲销凭证生成成功');
                onStatusChange?.();
            } catch (error: any) {
                toast.error(error.message || '冲销失败');
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl">记账凭证: {entry.voucherNo}</CardTitle>
                        <CardDescription>记录财务账目的基本经济业务</CardDescription>
                    </div>
                    <Badge variant={statusMap[entry.status]?.variant || 'default'} className="text-sm px-3 py-1">
                        {statusMap[entry.status]?.label || entry.status}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">记账日期</p>
                            <p>{entry.entryDate ? format(new Date(entry.entryDate), 'yyyy-MM-dd') : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">会计账期</p>
                            <p>{entry.period ? `${entry.period.year}年${entry.period.month}月` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">凭证来源</p>
                            <p>{entry.sourceType === 'MANUAL' ? '手工录入' : '业务生成'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">创建时间</p>
                            <p>{entry.createdAt ? format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                            <p className="text-sm text-muted-foreground font-medium mb-1">摘要说明</p>
                            <p className="text-sm">{entry.description || '-'}</p>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">序号</TableHead>
                                    <TableHead>摘要</TableHead>
                                    <TableHead>会计科目</TableHead>
                                    <TableHead className="text-right">借方金额</TableHead>
                                    <TableHead className="text-right">贷方金额</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entry.lines?.map((line: any, idx: number) => (
                                    <TableRow key={line.id}>
                                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell>{line.description || '-'}</TableCell>
                                        <TableCell>
                                            <span className="font-medium mr-2">{line.account?.code}</span>
                                            {line.account?.name}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {Number(line.debitAmount) > 0 ? Number(line.debitAmount).toFixed(2) : ''}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {Number(line.creditAmount) > 0 ? Number(line.creditAmount).toFixed(2) : ''}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* 合计行 */}
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={3} className="text-right">合计栏</TableCell>
                                    <TableCell className="text-right text-primary">{Number(entry.totalDebit || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-primary">{Number(entry.totalCredit || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* 操作动作区域 */}
                    <div className="mt-6 flex justify-end space-x-4">
                        {entry.status === 'DRAFT' && permissions.canSubmit && (
                            <Button onClick={() => handleUpdateStatus('PENDING_REVIEW')} disabled={isPending}>
                                提交审核
                            </Button>
                        )}
                        {entry.status === 'PENDING_REVIEW' && permissions.canReview && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        const reason = window.prompt('请输入驳回原因');
                                        if (reason) handleUpdateStatus('DRAFT', reason);
                                    }}
                                    disabled={isPending}
                                >
                                    驳回
                                </Button>
                                <Button onClick={() => handleUpdateStatus('POSTED')} disabled={isPending}>
                                    审核通过并记账
                                </Button>
                            </>
                        )}
                        {entry.status === 'POSTED' && permissions.canReverse && (
                            <Button variant="destructive" onClick={handleReverse} disabled={isPending}>
                                红字冲销
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
