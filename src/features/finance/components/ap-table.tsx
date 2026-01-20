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

export function APTable() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>应付账款 (AP)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="h-24 text-center">
                            AP 表格在恢复模式下暂不可用�?
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
