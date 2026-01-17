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
import Eye from 'lucide-react/dist/esm/icons/eye';
import Edit from 'lucide-react/dist/esm/icons/edit';
import { StatusBadge } from '@/shared/ui/status-badge';

interface ProcessingOrderTableProps {
    data: any[];
}

export function ProcessingOrderTable({ data }: ProcessingOrderTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Processing No</TableHead>
                        <TableHead>Order No</TableHead>
                        <TableHead>Processor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No processing orders found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.processingNo}</TableCell>
                                <TableCell>{item.order?.orderNo || '-'}</TableCell>
                                <TableCell>{item.processorName}</TableCell>
                                <TableCell>
                                    <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>{item.startedAt}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
