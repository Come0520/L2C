'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

interface InventoryTableProps {
    data: any[];
}

interface InventoryTableRowProps {
    item: {
        sku: string;
        name: string;
        stock: number;
    };
}

const InventoryTableRow = React.memo(function InventoryTableRow({ item }: InventoryTableRowProps) {
    return (
        <TableRow>
            <TableCell className="font-medium">{item.sku}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell className="text-right">{item.stock}</TableCell>
            <TableCell className="text-right">
                <StockAdjustmentDialog />
            </TableCell>
        </TableRow>
    );
});

export function InventoryTable({ data }: { data: any[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <EmptyTableRow colSpan={4} message="No inventory items found." />
                    ) : (
                        data.map((item, index) => (
                            <InventoryTableRow key={index} item={item} />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
