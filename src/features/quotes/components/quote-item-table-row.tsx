'use client';

import React from 'react';
import { TableRow, TableCell } from '@/shared/components/ui/table';

export function QuoteItemTableRow() {
    return (
        <TableRow>
            <TableCell colSpan={10}>
                报价项行在恢复模式下暂不可用。
            </TableCell>
        </TableRow>
    );
}
