import React from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

// 统计卡片骨架组件
const StatCardSkeleton = () => (
  <PaperCard>
    <PaperCardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-8 w-32 rounded" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="w-12 h-12 rounded-full" variant="circle" />
      </div>
    </PaperCardContent>
  </PaperCard>
);

// 最近活动项骨架组件
const ActivityItemSkeleton = () => (
  <div className="flex items-center space-x-4">
    <div className="flex items-center space-x-3">
      <Skeleton className="w-12 h-12 rounded-full" variant="circle" />
      <Skeleton className="w-12 h-12 rounded" />
    </div>
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/5 rounded" />
      <Skeleton className="h-3.5 w-4/5 rounded opacity-70" />
      <Skeleton className="h-3 w-2/5 rounded opacity-50" />
    </div>
  </div>
);

// 表格行骨架组件
const TableRowSkeleton = () => (
  <tr className="border-b border-paper-600">
    {Array.from({ length: 6 }).map((_, colIndex) => (
      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
        {colIndex === 3 ? (
          <Skeleton className="w-16 h-6 rounded" />
        ) : colIndex === 5 ? (
          <div className="flex space-x-2">
            <Skeleton className="w-16 h-8 rounded" />
            <Skeleton className="w-16 h-8 rounded" />
          </div>
        ) : (
          <Skeleton className="h-4 w-30 rounded" />
        )}
      </td>
    ))}
  </tr>
);

const DashboardLoading = () => {
  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-52 rounded mb-1" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="w-32 h-10 rounded" />
            <Skeleton className="w-30 h-10 rounded" />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* 最近活动 */}
          <div>
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>最近活动</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent className="p-0">
                <div className="space-y-4 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ActivityItemSkeleton key={index} />
                  ))}
                </div>
              </PaperCardContent>
            </PaperCard>
          </div>
        </div>

        {/* 数据表格 */}
        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <PaperCardTitle>最近订单</PaperCardTitle>
              <Skeleton className="w-20 h-8 rounded" />
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-paper-600">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                        <Skeleton className="h-4 w-20 rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <TableRowSkeleton key={rowIndex} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-paper-600">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-30 rounded" />
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="w-8 h-8 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
};

export default DashboardLoading;
