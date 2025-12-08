import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardLoading = () => {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton height="2.5rem" width="200px" variant="rounded" className="mb-1" />
            <Skeleton height="1rem" width="300px" variant="rounded" />
          </div>
          <div className="flex space-x-3">
            <Skeleton width="120px" height="2.5rem" variant="rounded" />
            <Skeleton width="120px" height="2.5rem" variant="rounded" />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <PaperCard key={index}>
              <PaperCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton height="1rem" width="80px" variant="rounded" />
                    <Skeleton height="2rem" width="120px" variant="rounded" />
                    <div className="flex items-center space-x-1">
                      <Skeleton height="1rem" width="1rem" />
                      <Skeleton height="1rem" width="60px" variant="rounded" />
                    </div>
                  </div>
                  <Skeleton width="3rem" height="3rem" variant="circle" />
                </div>
              </PaperCardContent>
            </PaperCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最近活动 */}
          <div className="lg:col-span-2">
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>最近活动</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent className="p-0">
                <div className="space-y-4 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton width="3rem" height="3rem" variant="circle" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="1rem" width="60%" variant="rounded" />
                        <Skeleton height="0.875rem" width="80%" variant="rounded" className="opacity-70" />
                        <Skeleton height="0.75rem" width="40%" variant="rounded" className="opacity-50" />
                      </div>
                    </div>
                  ))}
                </div>
              </PaperCardContent>
            </PaperCard>
          </div>

          {/* 待办任务 */}
          <div>
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>待办任务</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent className="p-0">
                <div className="space-y-4 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-3 border border-paper-600 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Skeleton height="1rem" width="80%" variant="rounded" className="mb-2" />
                          <div className="flex items-center space-x-2">
                            <Skeleton width="60px" height="1.5rem" variant="rounded" />
                            <Skeleton width="60px" height="1.5rem" variant="rounded" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Skeleton height="0.75rem" width="80px" variant="rounded" />
                        <Skeleton height="0.75rem" width="80px" variant="rounded" />
                      </div>
                    </div>
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
              <Skeleton width="80px" height="2rem" variant="rounded" />
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-paper-600">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                        <Skeleton height="1rem" width="80px" variant="rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-paper-600">
                      {Array.from({ length: 6 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {colIndex === 3 ? (
                            <Skeleton width="60px" height="1.5rem" variant="rounded" />
                          ) : colIndex === 5 ? (
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
            <div className="px-6 py-3 border-t border-paper-600">
              <div className="flex items-center justify-between">
                <Skeleton height="1rem" width="120px" variant="rounded" />
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 5 }).map((_, index) => (
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

export default DashboardLoading;
