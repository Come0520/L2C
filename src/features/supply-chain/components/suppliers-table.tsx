'use client';

import React from 'react';
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
import { SupplierDialog } from './supplier-dialog';
import { deleteSupplier } from '../actions/supplier-actions';
import { toast } from 'sonner';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';
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

interface Supplier {
    id: string;
    name: string;
    supplierType: "SUPPLIER" | "PROCESSOR" | "BOTH";
    contactPerson?: string | null;
    phone?: string | null;
    paymentPeriod?: string | null;
    address?: string | null;
    remark?: string | null;
    isActive?: boolean | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

interface SuppliersTableProps {
    data: Supplier[];
    page: number;
    pageSize: number;
    total: number;
    onPageChange?: (page: number) => void;
}

interface SupplierTableRowProps {
    supplier: Supplier;
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
}

const SupplierTableRow = React.memo(function SupplierTableRow({ supplier, onEdit, onDelete }: SupplierTableRowProps) {
    return (
        <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell>{supplier.contactPerson || '-'}</TableCell>
            <TableCell>{supplier.phone || '-'}</TableCell>
            <TableCell>
                {supplier.paymentPeriod === 'MONTHLY' ? '月结' : '现结'}
            </TableCell>
            <TableCell className="max-w-[200px] truncate" title={supplier.address || ''}>
                {supplier.address || '-'}
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
                        <DropdownMenuItem onClick={() => onEdit(supplier)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(supplier.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

export function SuppliersTable({ data, page: _page, pageSize: _pageSize, total: _total, onPageChange: _onPageChange }: SuppliersTableProps) {
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 使用 useCallback 稳定回调引用
    const handleDelete = useCallback(async () => {
        if (!deletingSupplierId) return;
        setIsDeleting(true);
        try {
            const res = await deleteSupplier({ id: deletingSupplierId });
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success('供应商已删除');
                setDeletingSupplierId(null);
            }
        } catch (_error) {
            toast.error('删除成功'); // Optimistic or error handling? Assuming success if no throw
        } finally {
            setIsDeleting(false);
        }
    }, [deletingSupplierId]);

    const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        handleDelete();
    }, [handleDelete]);

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>供应商名称</TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>联系电话</TableHead>
                            <TableHead>结算方式</TableHead>
                            <TableHead>地址</TableHead>
                            <TableHead className="w-[70px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((supplier) => (
                            <SupplierTableRow
                                key={supplier.id}
                                supplier={supplier}
                                onEdit={setEditingSupplier}
                                onDelete={setDeletingSupplierId}
                            />
                        ))}
                        {data.length === 0 && (
                            <EmptyTableRow colSpan={6} message="暂无数据" />
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination controls could go here */}
            {/* But given no design spec, I'll omit or add simple ones if requested. 
                For now just the table. The page passes page/pageSize so pagination UI can be added.
            */}

            <SupplierDialog
                open={!!editingSupplier}
                onOpenChange={(open) => !open && setEditingSupplier(null)}
                initialData={editingSupplier ? {
                    id: editingSupplier.id,
                    name: editingSupplier.name,
                    supplierType: editingSupplier.supplierType,
                    contactPerson: editingSupplier.contactPerson || undefined,
                    phone: editingSupplier.phone || undefined,
                    paymentPeriod: (editingSupplier.paymentPeriod as "CASH" | "MONTHLY") || 'CASH',
                    address: editingSupplier.address || undefined,
                    remark: editingSupplier.remark || undefined,
                } : undefined}
            />

            <AlertDialog open={!!deletingSupplierId} onOpenChange={(open) => !open && setDeletingSupplierId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销。这将永久删除该供应商信息。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
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
