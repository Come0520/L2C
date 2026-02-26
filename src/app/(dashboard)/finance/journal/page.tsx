// @ts-nocheck
import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { getJournalEntries, getJournalEntryById } from '@/features/finance/actions/journal-entry-actions';
import { JournalEntryDetail } from '@/features/finance/components/journal-entry-detail';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from '@/shared/ui/dialog';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    DRAFT: { label: '草稿', variant: 'secondary' },
    PENDING_REVIEW: { label: '待审核', variant: 'outline' },
    POSTED: { label: '已记账', variant: 'default' },
    REVERSED: { label: '已冲销', variant: 'destructive' },
};

export default async function JournalPage({
    searchParams,
}: {
    searchParams: { status?: string; periodId?: string };
}) {
    const entries = await getJournalEntries({ status: searchParams.status, periodId: searchParams.periodId });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="手工记账"
                    description="管理财务记账凭证，支持审核与红字冲销"
                    breadcrumbs={[
                        { label: '财务中心', href: '/finance' },
                        { label: '手工记账' },
                    ]}
                />
                <Button asChild>
                    <Link href="/finance/journal/create">
                        <Plus className="mr-2 h-4 w-4" />
                        手工记账
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>凭证字号</TableHead>
                            <TableHead>记账日期</TableHead>
                            <TableHead>账期</TableHead>
                            <TableHead>摘要</TableHead>
                            <TableHead className="text-right">借方合计</TableHead>
                            <TableHead className="text-right">贷方合计</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>来源</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                    暂无凭证数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.voucherNo}</TableCell>
                                    <TableCell>{entry.entryDate ? format(new Date(entry.entryDate), 'yyyy-MM-dd') : '-'}</TableCell>
                                    <TableCell>{entry.period ? `${entry.period.year}年${entry.period.month}月` : '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={entry.description || ''}>
                                        {entry.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {Number(entry.totalDebit).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {Number(entry.totalCredit).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[entry.status]?.variant || 'default'} className="whitespace-nowrap">
                                            {statusMap[entry.status]?.label || entry.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{entry.sourceType === 'MANUAL' ? '手工输入' : '业务生成'}</TableCell>
                                    <TableCell className="text-center">
                                        <DetailDialog entryId={entry.id} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// 抽取个内部组件用来包裹详情的 Server Component Fetching
async function DetailDialog({ entryId }: { entryId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" size="sm">查看</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="sr-only">凭证详情</DialogTitle>
                    <DialogDescription className="sr-only">显示凭证内容与相关操作</DialogDescription>
                </DialogHeader>
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground">加载中...</div>}>
                    <EntryDetailFetcher id={entryId} />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}

async function EntryDetailFetcher({ id }: { id: string }) {
    const entry = await getJournalEntryById(id);
    if (!entry) return <div className="p-4 text-center">凭证不存在或权限不足</div>;

    return <JournalEntryDetail entry={entry} />;
}

