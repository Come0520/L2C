'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export function SimplifiedSummaryTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称 (Name)</TableHead>
            <TableHead>数值 (Value)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground h-20 text-center">
              汇总表格在恢复模式下暂不可用。
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
