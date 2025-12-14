import React from 'react';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductTableSkeleton() {
  // 生成6行骨架屏数据
  const skeletonRows = Array.from({ length: 6 });

  return (
    <PaperCard>
      <PaperCardContent className="p-6">
        {/* 搜索栏骨架 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Skeleton width="100%" height="40px" />
          </div>
          <div className="w-48">
            <Skeleton width="100%" height="40px" />
          </div>
          <div className="w-48">
            <Skeleton width="100%" height="40px" />
          </div>
          <div className="w-48">
            <Skeleton width="100%" height="40px" />
          </div>
          <div className="w-32">
            <Skeleton width="100%" height="40px" />
          </div>
        </div>
        
        {/* 表格骨架 */}
        <PaperTable>
          <PaperTableHeader>
            <PaperTableCell>产品编码</PaperTableCell>
            <PaperTableCell>产品名称</PaperTableCell>
            <PaperTableCell>分类</PaperTableCell>
            <PaperTableCell>单位</PaperTableCell>
            <PaperTableCell>零售价</PaperTableCell>
            <PaperTableCell>状态</PaperTableCell>
            <PaperTableCell>操作</PaperTableCell>
          </PaperTableHeader>
          <PaperTableBody>
            {skeletonRows.map((_, index) => (
              <PaperTableRow key={index}>
                <PaperTableCell>
                  <Skeleton width="100px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <Skeleton width="150px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <Skeleton width="100px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <Skeleton width="50px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <Skeleton width="80px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <Skeleton width="60px" height="20px" />
                </PaperTableCell>
                <PaperTableCell>
                  <div className="flex gap-2">
                    <Skeleton width="60px" height="32px" />
                    <Skeleton width="60px" height="32px" />
                  </div>
                </PaperTableCell>
              </PaperTableRow>
            ))}
          </PaperTableBody>
        </PaperTable>
        
        {/* 分页骨架 */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <Skeleton width="80px" height="20px" />
            <Skeleton width="120px" height="32px" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width="60px" height="32px" />
            <Skeleton width="60px" height="32px" />
            <Skeleton width="60px" height="32px" />
            <Skeleton width="60px" height="32px" />
          </div>
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}
