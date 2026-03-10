'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import { useServerActionQuery } from '@/shared/hooks/use-server-action-query';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { Button } from '@/shared/ui/button';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

import { OrderTable } from './order-table';
import { OrderAdvancedFilter, type OrderFilters } from './orders-advanced-filter';
import { getOrders } from '../actions/queries';
import { toast } from 'sonner';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { DataTableToolbar } from '@/shared/ui/data-table-toolbar';
import { OrderEmptyState } from './order-empty-state';

/**
 * 订单状态Tabs配置
 */
const ORDER_STATUS_TABS = [
  { value: 'ALL', title: '全部' },
  { value: 'PENDING_PURCHASE', title: '待采购' },
  { value: 'IN_PRODUCTION', title: '生产中' },
  { value: 'PENDING_DELIVERY', title: '待发货' },
  { value: 'PENDING_INSTALL', title: '待安装' },
  { value: 'COMPLETED', title: '已完成' },
  { value: 'CANCELLED', title: '已取消' },
] as const;

type OrderStatusTab = (typeof ORDER_STATUS_TABS)[number]['value'];

/**
 * 订单列表组件
 *
 * 功能：
 * 1. 状态Tabs切换筛选
 * 2. 高级筛选（销售人员/渠道/设计师/带单人/地址）
 * 3. 服务端分页（默认每页 20 条）
 * 4. React Query 客户端缓存
 */
export function OrderList() {
  const searchParams = useSearchParams();
  const statusTab = (searchParams.get('status') || 'ALL') as OrderStatusTab;

  const [page, setPage] = useState(1);
  // 性能优化（P0-1）：searchInput 跟踪原始输入（即时更新 UI）
  // debouncedSearch 后 500ms 才变化，只有它才会触发 React Query 重新查询
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [filters, setFilters] = useState<OrderFilters>({});
  const pageSize = 20;

  // 使用 React Query 进行数据获取和缓存
  const { data, isLoading, isFetching, refetch } = useServerActionQuery(
    // debouncedSearch 入 key，确保防抖后才触发请求
    ['orders', page, pageSize, debouncedSearch, statusTab, filters],
    async () => {
      const result = await getOrders({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusTab,
        salesId: filters.salesId,
        channelId: filters.channelId,
        dateRange: filters.dateRange,
      });
      if (!result?.success) {
        throw new Error(result?.error || '获取订单列表失败');
      }
      return result.data;
    },
    {
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
    }
  );

  const orders = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('已刷新');
  }, [refetch]);

  const handleFiltersChange = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPage(1); // 筛选变更时重置页码
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full flex-col items-start justify-start space-y-4 p-6 perspective-[1000px]">
      {/* Top Section: Tabs */}
      <div className="flex w-full items-center justify-between">
        <div className="flex-1">
          <UrlSyncedTabs
            tabs={ORDER_STATUS_TABS as unknown as { value: string; title: string }[]}
            paramName="status"
            defaultValue="ALL"
            containerClassName="w-full mb-4"
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          {/* Action Buttons if any (e.g. Create Order) - currently empty or future use */}
        </div>
      </div>

      {/* Content Card */}
      <div className="glass-liquid relative flex h-full w-full flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 p-6">
        {/* 搜索和筛选栏 */}
        <DataTableToolbar
          searchProps={{
            value: searchInput,
            onChange: setSearchInput, // 更新 UI 输入状态（无延迟）
            placeholder: '搜索客户、订单号...',
          }}
          onRefresh={handleRefresh}
          loading={isFetching}
        >
          <OrderAdvancedFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            salesOptions={[]}
            channelOptions={[]}
            designerOptions={[]}
            referrerOptions={[]}
          />
        </DataTableToolbar>

        <div className="text-muted-foreground flex items-center justify-end gap-2 px-2 text-sm">
          <span>共 {total} 条</span>
          {isFetching && !isLoading && <span className="text-blue-500">更新中...</span>}
        </div>

        {isLoading ? (
          <div className="glass-empty-state flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="relative flex flex-col items-center justify-center h-full w-full perspective-[1000px]">
              <RotateCcw className="text-muted-foreground h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground text-sm font-medium">加载中...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 w-full overflow-x-auto rounded-md border">
            <OrderEmptyState />
          </div>
        ) : (
          <div className="flex-1 w-full overflow-x-auto rounded-md border">
            <OrderTable data={orders} />
          </div>
        )}

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
