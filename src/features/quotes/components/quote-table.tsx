'use client';

import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';

import { Button } from '../../../shared/ui/button';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Link from 'next/link';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { format } from 'date-fns';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

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

export const QuoteTable = React.memo(function QuoteTable({ data }: QuoteTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto w-full">
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
            <EmptyTableRow colSpan={7} message="暂无报价单。" />
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
                <TableCell>{format(new Date(quote.createdAt), 'yyyy-MM-dd')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/quotes/${quote.id}`}>
                      <Eye className="mr-1 h-4 w-4" />
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
});
