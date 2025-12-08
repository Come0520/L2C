'use client';

import { PaperCard, PaperCardHeader, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableCell } from '@/components/ui/paper-table';

interface LoadingProps {
  activeTab: 'inventory' | 'inbound' | 'outbound' | 'stats';
}

// 基础骨架元素组件
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div 
    className={`animate-pulse bg-paper-600 rounded ${className}`} 
  />
);

// 骨架行组件
const SkeletonRow = ({ columns = 6 }: { columns?: number }) => (
  <tr className="border-b border-paper-600">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
    ))}
  </tr>
);

export const Loading = ({ activeTab }: LoadingProps) => {
  return (
    <div className="space-y-6">
      {/* 页面标题和门店选择骨架态 */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* 导航标签骨架态 */}
      <PaperCard>
        <PaperCardContent>
          <div className="flex space-x-2">
            {['库存管理', '入库管理', '出库管理', '库存统计'].map((_, index) => (
              <Skeleton key={index} className="h-10 w-28" />
            ))}
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 搜索栏骨架态 */}
      <PaperCard>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            {activeTab === 'inventory' && (
              <Skeleton className="h-10 w-40" />
            )}
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </PaperCard>

      {/* 库存管理表格骨架态 */}
      {activeTab === 'inventory' && (
        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>商品信息</PaperTableCell>
                <PaperTableCell>分类</PaperTableCell>
                <PaperTableCell>价格</PaperTableCell>
                <PaperTableCell>库存</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <SkeletonRow key={index} columns={6} />
                ))}
              </tbody>
            </PaperTable>
            <div className="p-4 border-t border-paper-600">
              <Skeleton className="h-8 w-48" />
            </div>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 入库记录表格骨架态 */}
      {(activeTab === 'inbound' || activeTab === 'outbound') && (
        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>类型</PaperTableCell>
                <PaperTableCell>关联单号</PaperTableCell>
                <PaperTableCell>商品</PaperTableCell>
                <PaperTableCell>数量</PaperTableCell>
                <PaperTableCell>操作人</PaperTableCell>
                <PaperTableCell>时间</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <SkeletonRow key={index} columns={7} />
                ))}
              </tbody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 库存统计骨架态 */}
      {activeTab === 'stats' && (
        <>
          {/* 统计卡片骨架态 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PaperCard key={index}>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <Skeleton className="h-12 w-20 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                </PaperCardContent>
              </PaperCard>
            ))}
          </div>

          {/* 进出库统计骨架态 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <PaperCard key={index}>
                <PaperCardHeader>
                  <Skeleton className="h-6 w-32" />
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <Skeleton className="h-16 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </PaperCardContent>
              </PaperCard>
            ))}
          </div>

          {/* 库存明细表格骨架态 */}
          <PaperCard>
            <PaperCardHeader>
              <Skeleton className="h-6 w-32" />
            </PaperCardHeader>
            <PaperCardContent className="p-0">
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>商品名称</PaperTableCell>
                  <PaperTableCell>SKU</PaperTableCell>
                  <PaperTableCell>分类</PaperTableCell>
                  <PaperTableCell>当前库存</PaperTableCell>
                  <PaperTableCell>库存状态</PaperTableCell>
                </PaperTableHeader>
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <SkeletonRow key={index} columns={5} />
                  ))}
                </tbody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        </>
      )}
    </div>
  );
};