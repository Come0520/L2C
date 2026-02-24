'use client';

import { logger } from "@/shared/lib/logger";
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';

/**
 * 基础应付账款表格 (AP Table)
 * 
 * @note 目前处于恢复模式，核心逻辑由 APStatementTable 提供。
 */
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
