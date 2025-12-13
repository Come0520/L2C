'use client';

import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      <PaperTable>
        <PaperTableHeader>
          <PaperTableCell>客户信息</PaperTableCell>
          <PaperTableCell>联系方式</PaperTableCell>
          <PaperTableCell>等级</PaperTableCell>
          <PaperTableCell>状态</PaperTableCell>
          <PaperTableCell>交易额</PaperTableCell>
          <PaperTableCell>订单数</PaperTableCell>
          <PaperTableCell>最后交易</PaperTableCell>
          <PaperTableCell>操作</PaperTableCell>
        </PaperTableHeader>
        <PaperTableBody>
          {/* 渲染5行骨架屏 */}
          {Array.from({ length: 5 }).map((_, index) => (
            <PaperTableRow key={index}>
              <PaperTableCell>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </PaperTableCell>
              <PaperTableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </PaperTableCell>
              <PaperTableCell>
                <Skeleton className="h-8 w-16 rounded-full" />
              </PaperTableCell>
              <PaperTableCell>
                <Skeleton className="h-8 w-24 rounded-full" />
              </PaperTableCell>
              <PaperTableCell>
                <Skeleton className="h-5 w-24" />
              </PaperTableCell>
              <PaperTableCell>
                <Skeleton className="h-4 w-8" />
              </PaperTableCell>
              <PaperTableCell>
                <Skeleton className="h-4 w-20" />
              </PaperTableCell>
              <PaperTableCell>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </PaperTableCell>
            </PaperTableRow>
          ))}
        </PaperTableBody>
      </PaperTable>
      <PaperTablePagination
        currentPage={1}
        totalPages={1}
        totalItems={0}
        itemsPerPage={10}
        onPageChange={() => {}}
      />
    </div>
  );
}