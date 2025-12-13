import React from 'react';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

const OrdersLoading = () => {
  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <Skeleton height="2.5rem" width="200px" variant="rounded" className="mb-1" />
            <Skeleton height="1rem" width="300px" variant="rounded" />
          </div>
          <div className="flex space-x-3">
            <Skeleton width="120px" height="2.5rem" variant="rounded" />
            <Skeleton width="120px" height="2.5rem" variant="rounded" />
          </div>
        </div>

        {/* 筛选和搜索栏 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
                <Skeleton height="2.5rem" variant="rounded" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex-1 space-y-2">
              <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
              <Skeleton height="2.5rem" variant="rounded" />
            </div>
            <Skeleton width="100px" height="2.5rem" variant="rounded" />
          </div>
        </div>

        {/* 订单统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <PaperCard key={index}>
              <PaperCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton height="1rem" width="80px" variant="rounded" />
                    <Skeleton height="2rem" width="150px" variant="rounded" />
                  </div>
                  <Skeleton width="3rem" height="3rem" variant="circle" />
                </div>
                <div className="mt-4 space-y-1">
                  <Skeleton height="0.875rem" width="100%" variant="rounded" className="opacity-70" />
                  <Skeleton height="0.875rem" width="80%" variant="rounded" className="opacity-50" />
                </div>
              </PaperCardContent>
            </PaperCard>
          ))}
        </div>

        {/* 订单列表 */}
        <PaperCard>
          <PaperCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-paper-600">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                        <Skeleton height="1rem" width="120px" variant="rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-paper-600">
                      {Array.from({ length: 7 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {colIndex === 0 ? (
                            <div className="space-y-1">
                              <Skeleton height="1rem" width="150px" variant="rounded" />
                              <Skeleton height="0.875rem" width="100px" variant="rounded" className="opacity-70" />
                            </div>
                          ) : colIndex === 1 ? (
                            <Skeleton width="120px" height="1.5rem" variant="rounded" />
                          ) : colIndex === 5 ? (
                            <Skeleton width="80px" height="1.5rem" variant="rounded" />
                          ) : colIndex === 6 ? (
                            <div className="flex space-x-2">
                              <Skeleton width="60px" height="2rem" variant="rounded" />
                              <Skeleton width="60px" height="2rem" variant="rounded" />
                            </div>
                          ) : (
                            <Skeleton height="1rem" width="120px" variant="rounded" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 分页 */}
            <div className="px-6 py-3 border-t border-paper-600">
              <div className="flex items-center justify-between">
                <Skeleton height="1rem" width="150px" variant="rounded" />
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <Skeleton key={index} width="2rem" height="2rem" variant="rounded" />
                  ))}
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
};

export default OrdersLoading;
