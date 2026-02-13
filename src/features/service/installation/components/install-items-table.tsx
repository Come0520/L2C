'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { updateInstallItemStatus } from '../actions';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface InstallItem {
    id: string;
    productName: string;
    roomName: string | null;
    quantity: string; // decimal string
    actualInstalledQuantity: string | null;
    isInstalled: boolean;
    issueCategory: 'NONE' | 'MISSING' | 'DAMAGED' | 'WRONG_SIZE' | null;
}

interface InstallItemsTableProps {
    items: InstallItem[];
    allowEdit: boolean;
}

const ISSUE_Category_MAP = {
    NONE: '无异常',
    MISSING: '缺件',
    DAMAGED: '破损',
    WRONG_SIZE: '尺寸不符',
} as const;

export function InstallItemsTable({ items, allowEdit }: InstallItemsTableProps) {
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const handleStatusChange = async (item: InstallItem, isInstalled: boolean) => {
        if (!allowEdit) return;

        setUpdatingIds(prev => new Set(prev).add(item.id));
        try {
            const result = await updateInstallItemStatus({
                itemId: item.id,
                isInstalled,
                issueCategory: item.issueCategory || 'NONE',
            });

            if (result.data?.success) {
                toast.success(isInstalled ? '已标记为安装完成' : '已取消安装状态');
            } else {
                toast.error(result.data?.error || result.error || '更新失败');
            }

        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleIssueChange = async (item: InstallItem, issue: keyof typeof ISSUE_Category_MAP) => {
        if (!allowEdit) return;

        setUpdatingIds(prev => new Set(prev).add(item.id));
        try {
            const result = await updateInstallItemStatus({
                itemId: item.id,
                isInstalled: item.isInstalled,
                issueCategory: issue,
            });

            if (result.data?.success) {
                toast.success('异常状态已更新');
            } else {
                toast.error(result.data?.error || result.error || '更新失败');
            }

        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>产品名称</TableHead>
                        <TableHead>空间</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>异常状态</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                {updatingIds.has(item.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Checkbox
                                        checked={item.isInstalled}
                                        onCheckedChange={(checked) => handleStatusChange(item, checked as boolean)}
                                        disabled={!allowEdit || updatingIds.has(item.id)}
                                    />
                                )}
                            </TableCell>
                            <TableCell className="font-medium">
                                <span className={item.isInstalled ? 'text-muted-foreground line-through' : ''}>
                                    {item.productName}
                                </span>
                            </TableCell>
                            <TableCell>{item.roomName || '-'}</TableCell>
                            <TableCell>{Number(item.quantity) || 0}</TableCell>
                            <TableCell>
                                {allowEdit ? (
                                    <Select
                                        value={item.issueCategory || 'NONE'}
                                        onValueChange={(val) => handleIssueChange(item, val as keyof typeof ISSUE_Category_MAP)}
                                        disabled={updatingIds.has(item.id)}
                                    >
                                        <SelectTrigger className="h-8 w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ISSUE_Category_MAP).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={item.issueCategory && item.issueCategory !== 'NONE' ? 'error' : 'outline'}>
                                        {ISSUE_Category_MAP[item.issueCategory || 'NONE']}
                                    </Badge>
                                )}

                            </TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                暂无安装明细数据
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
