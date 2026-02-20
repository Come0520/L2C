'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { LiabilityNotice } from '../types';
import { confirmLiabilityNotice } from '../actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/shared/ui/badge';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { LiabilityDrawer } from './liability-drawer';

interface LiabilityNoticeListProps {
    notices: LiabilityNotice[];
}

export function LiabilityNoticeList({ notices }: LiabilityNoticeListProps) {

    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [selectedNotice, setSelectedNotice] = useState<LiabilityNotice | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleConfirm = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // 阻止触发行的点击事件
        setConfirmingId(id);
        const result = await confirmLiabilityNotice({ noticeId: id });
        setConfirmingId(null);

        if (result.data?.success) {
            toast.success('确认成功', { description: result.data.message });
        } else {
            toast.error('确认失败', { description: result.error || result.data?.message });
        }
    };

    const handleRowClick = (notice: LiabilityNotice) => {
        setSelectedNotice(notice);
        setDrawerOpen(true);
    };

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>定责单号</TableHead>
                        <TableHead>责任方类型</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>原因</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                                暂无定责单
                            </TableCell>
                        </TableRow>
                    ) : (
                        notices.map((notice) => (
                            <TableRow
                                key={notice.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleRowClick(notice)}
                            >
                                <TableCell className="font-medium">{notice.noticeNo}</TableCell>
                                <TableCell>{notice.liablePartyType}</TableCell>
                                <TableCell>¥{Number(notice.amount).toFixed(2)}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={notice.reason}>{notice.reason}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        notice.status === 'CONFIRMED' ? 'default' :
                                            notice.status === 'DRAFT' ? 'secondary' : 'outline'
                                    }>
                                        {notice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(notice.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell>
                                    {notice.status !== 'CONFIRMED' && (
                                        <Button
                                            size="sm"
                                            onClick={(e) => handleConfirm(e, notice.id)}
                                            disabled={confirmingId === notice.id}
                                        >
                                            {confirmingId === notice.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            确认
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <LiabilityDrawer
                notice={selectedNotice}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </div>
    );
}
