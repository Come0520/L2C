import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

const LeadsLoading = () => {
  return (
    <DashboardLayout>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
              <Skeleton height="2.5rem" variant="rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
              <Skeleton height="2.5rem" variant="rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
              <Skeleton height="2.5rem" variant="rounded" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex-1 space-y-2">
              <Skeleton height="1rem" width="100px" variant="rounded" className="mb-1" />
              <Skeleton height="2.5rem" variant="rounded" />
            </div>
            <Skeleton width="100px" height="2.5rem" variant="rounded" />
          </div>
        </div>

        {/* 数据表格 */}
        <PaperCard>
          <PaperCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-paper-600">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                        <Skeleton height="1rem" width="100px" variant="rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-paper-600">
                      {Array.from({ length: 8 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {colIndex === 0 ? (
                            <Skeleton width="40px" height="40px" variant="circle" />
                          ) : colIndex === 1 ? (
                            <div className="space-y-1">
                              <Skeleton height="1rem" width="150px" variant="rounded" />
                              <Skeleton height="0.875rem" width="100px" variant="rounded" className="opacity-70" />
                            </div>
                          ) : colIndex === 7 ? (
                            <div className="flex space-x-2">
                              <Skeleton width="60px" height="2rem" variant="rounded" />
                              <Skeleton width="60px" height="2rem" variant="rounded" />
                            </div>
                          ) : colIndex === 2 ? (
                            <Skeleton width="80px" height="1.5rem" variant="rounded" />
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
    </DashboardLayout>
  );
};

export default LeadsLoading;
