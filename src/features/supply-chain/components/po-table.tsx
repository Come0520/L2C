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
import Printer from 'lucide-react/dist/esm/icons/printer';
import { StatusBadge } from '@/shared/ui/status-badge';
import Link from 'next/link';

interface POTableProps {
    data: any[];
}

export function POTable({ data }: POTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>PO No</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No Purchase Orders found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.poNo}</TableCell>
                                <TableCell>{item.supplierName}</TableCell>
                                <TableCell>{item.totalAmount}</TableCell>
                                <TableCell>
                                    <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>{item.createdAt}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/supply-chain/po/${item.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Printer className="h-4 w-4" />
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
