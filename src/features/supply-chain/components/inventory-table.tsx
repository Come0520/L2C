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
import { Button } from '@/shared/ui/button';
import Archive from 'lucide-react/dist/esm/icons/archive';
import { AdjustInventoryDialog } from './adjust-inventory-dialog';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

interface InventoryTableProps {
    data: InventoryItem[];
}

export interface InventoryItem {
    sku: string;
    name: string;
    stock: number;
}

interface InventoryTableRowProps {
    item: InventoryItem;
}

const InventoryTableRow = React.memo(function InventoryTableRow({ item }: InventoryTableRowProps) {
    return (
        <TableRow>
            <TableCell className="font-medium">{item.sku}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell className="text-right">{item.stock}</TableCell>
            <TableCell className="text-right">
                <AdjustInventoryDialog
                    trigger={
                        <Button variant="outline" size="sm">
                            <Archive className="mr-2 h-4 w-4" />
                            库存调整
                        </Button>
                    }
                />
            </TableCell>
        </TableRow>
    );
});

export function InventoryTable({ data }: { data: InventoryItem[] }) {
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
