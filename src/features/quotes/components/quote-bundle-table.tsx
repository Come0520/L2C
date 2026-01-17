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

export function QuoteBundleTable() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>报价单编号 (Bundle No)</TableHead>
                        <TableHead>客户 (Customer)</TableHead>
                        <TableHead>金额 (Amount)</TableHead>
                        <TableHead>状态 (Status)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            报价单列表在恢复模式下暂不可用。
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
