'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { deleteSupplier } from '../actions/supplier-actions';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { format } from 'date-fns';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { differenceInDays } from 'date-fns';

interface Processor {
    id: string;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
    address?: string | null;
    contractExpiryDate?: Date | null;
    isActive?: boolean | null;
    // 其他可能需要的字段，如 processingPrices 等，列表页可能不用全展示
}

interface ProcessorTableProps {
    data: Processor[];
    page: number;
    pageSize: number;
    total: number;
    onPageChange?: (page: number) => void;
    onEdit?: (processor: Processor) => void;
    onSuccess?: () => void;
}

export function ProcessorTable({ data, page: _page, pageSize: _pageSize, total: _total, onPageChange: _onPageChange, onEdit, onSuccess }: ProcessorTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            const res = await deleteSupplier({ id: deletingId });
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success('加工厂已删除');
                setDeletingId(null);
                onSuccess?.(); // 触发刷新
            }
        } catch (_error) {
            toast.error('删除操作异常');
        } finally {
            setIsDeleting(false);
        }
    }, [deletingId, onSuccess]);

    const getContractStatus = (expiryDate?: Date | null) => {
        if (!expiryDate) return { label: '未签署', variant: 'secondary' as const };

        const days = differenceInDays(new Date(expiryDate), new Date());

        if (days < 0) return { label: '已过期', variant: 'destructive' as const };
        if (days <= 30) return { label: '即将到期', variant: 'warning' as const }; // warning variant 需要确保 Badge 支持，或者用 style
        return { label: '正常', variant: 'success' as const };
    };

    // 自定义 Badge 样式辅助
    const getBadgeClassName = (variant: string) => {
        switch (variant) {
            case 'destructive': return 'bg-red-100 text-red-800 hover:bg-red-100';
            case 'warning': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'success': return 'bg-green-100 text-green-800 hover:bg-green-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>加工厂名称</TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>联系电话</TableHead>
                            <TableHead>地址</TableHead>
                            <TableHead>合同到期日</TableHead>
                            <TableHead>合同状态</TableHead>
                            <TableHead className="w-[70px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((processor) => {
                            const status = getContractStatus(processor.contractExpiryDate);
                            return (
                                <TableRow key={processor.id}>
                                    <TableCell className="font-medium">{processor.name}</TableCell>
                                    <TableCell>{processor.contactPerson || '-'}</TableCell>
                                    <TableCell>{processor.phone || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={processor.address || ''}>
                                        {processor.address || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {processor.contractExpiryDate ? format(new Date(processor.contractExpiryDate), 'yyyy-MM-dd') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("font-normal border-0", getBadgeClassName(status.variant))}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">打开菜单</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit?.(processor)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    编辑
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeletingId(processor.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    删除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    暂无加工厂数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销。这将永久删除该加工厂信息。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
