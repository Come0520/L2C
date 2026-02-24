'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { splitOrder } from '../actions';
import { useRouter } from 'next/navigation';

interface OrderItem {
    id: string;
    productName: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
    supplierId?: string;
    poId?: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface SplitOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    orderItems: OrderItem[];
    suppliers: Supplier[];
    version: number;
}

interface SplitItem {
    itemId: string;
    quantity: string;
    supplierId: string;
    selected: boolean;
}

/**
 * 订单拆单对话框
 * 允许用户选择订单明细、指定供应商，并生成采购单
 */
export function SplitOrderDialog({
    open,
    onOpenChange,
    orderId,
    orderItems,
    suppliers,
    version,
}: SplitOrderDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [splitItems, setSplitItems] = useState<SplitItem[]>([]);

    // 初始化拆单项
    useEffect(() => {
        if (open) {
            setSplitItems(
                orderItems
                    .filter(item => !item.poId) // 只显示未分配PO的项
                    .map(item => ({
                        itemId: item.id,
                        quantity: item.quantity,
                        supplierId: item.supplierId || '',
                        selected: false,
                    }))
            );
        }
    }, [open, orderItems]);

    // 切换选择
    const toggleSelect = (itemId: string) => {
        setSplitItems(prev =>
            prev.map(item =>
                item.itemId === itemId ? { ...item, selected: !item.selected } : item
            )
        );
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        const allSelected = splitItems.every(item => item.selected);
        setSplitItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
    };

    // 更新供应商
    const updateSupplier = (itemId: string, supplierId: string) => {
        setSplitItems(prev =>
            prev.map(item =>
                item.itemId === itemId ? { ...item, supplierId } : item
            )
        );
    };

    // 更新数量
    const updateQuantity = (itemId: string, quantity: string) => {
        setSplitItems(prev =>
            prev.map(item =>
                item.itemId === itemId ? { ...item, quantity } : item
            )
        );
    };

    // 提交拆单
    const handleSubmit = async () => {
        const selectedItems = splitItems.filter(item => item.selected);

        if (selectedItems.length === 0) {
            toast.error('请至少选择一项');
            return;
        }

        const missingSupplier = selectedItems.some(item => !item.supplierId);
        if (missingSupplier) {
            toast.error('请为所有选中项指定供应商');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await splitOrder({
                orderId,
                items: selectedItems.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    supplierId: item.supplierId,
                })),
                version,
            });

            if (result.success) {
                toast.success(`已生成 ${result.data?.createdPOIds?.length || 0} 个采购单`);
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error('拆单失败');
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '拆单失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCount = splitItems.filter(item => item.selected).length;
    const allSelected = splitItems.length > 0 && splitItems.every(item => item.selected);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>生成采购单</DialogTitle>
                    <DialogDescription>
                        选择需要采购的商品，指定供应商后将自动生成采购单
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {splitItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            所有商品已生成采购单
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>商品名称</TableHead>
                                    <TableHead className="w-[100px]">数量</TableHead>
                                    <TableHead className="w-[100px]">单价</TableHead>
                                    <TableHead className="w-[200px]">供应商</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {splitItems.map(splitItem => {
                                    const orderItem = orderItems.find(oi => oi.id === splitItem.itemId);
                                    if (!orderItem) return null;

                                    return (
                                        <TableRow key={splitItem.itemId}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={splitItem.selected}
                                                    onCheckedChange={() => toggleSelect(splitItem.itemId)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {orderItem.productName}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={splitItem.quantity}
                                                    onChange={(e) => updateQuantity(splitItem.itemId, e.target.value)}
                                                    className="w-20"
                                                    disabled={!splitItem.selected}
                                                />
                                            </TableCell>
                                            <TableCell>¥{orderItem.unitPrice}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={splitItem.supplierId}
                                                    onValueChange={(value) => updateSupplier(splitItem.itemId, value)}
                                                    disabled={!splitItem.selected}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择供应商" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {suppliers.map(supplier => (
                                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                                {supplier.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <DialogFooter>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">
                            已选择 {selectedCount} 项
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedCount === 0}
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                生成采购单
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
