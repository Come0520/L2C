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
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';

interface InventoryTableProps {
    data: any[];
}

export function InventoryTable({ data }: InventoryTableProps) {
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
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No inventory items found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.sku}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{item.stock}</TableCell>
                                <TableCell className="text-right">
                                    <StockAdjustmentDialog />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
