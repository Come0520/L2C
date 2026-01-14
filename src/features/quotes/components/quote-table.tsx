'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../shared/ui/table';

import { Button } from '../../../shared/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { format } from 'date-fns';

export interface Quote {
    id: string;
    quoteNo: string;
    customer: { name: string } | null;
    totalAmount: string; // decimal string
    status: string;
    createdAt: Date | string;
    creator: { name: string } | null;
}

interface QuoteTableProps {
    data: Quote[];
}

export function QuoteTable({ data }: QuoteTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Quote No</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No quotes found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((quote) => (
                            <TableRow key={quote.id}>
                                <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                                <TableCell>{quote.customer?.name || '-'}</TableCell>
                                <TableCell>{quote.creator?.name || '-'}</TableCell>
                                <TableCell>{quote.totalAmount}</TableCell>
                                <TableCell>
                                    <StatusBadge status={quote.status} />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(quote.createdAt), 'yyyy-MM-dd')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/quotes/${quote.id}`}>
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Link>
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
