'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Search from 'lucide-react/dist/esm/icons/search';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Filter from 'lucide-react/dist/esm/icons/filter';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

import { OrderTable } from './order-table';
import { getOrders } from '../actions/orders';
import { toast } from 'sonner';

/**
 * 订单列表组件
 * 
 * 功能：
 * 1. 服务端分页（默认每页 20 条）
 * 2. React Query 客户端缓存
 * 3. 平滑分页切换 (keepPreviousData)
 */
export function OrderList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const pageSize = 20;

    // 使用 React Query 进行数据获取和缓存
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['orders', page, pageSize, search],
        queryFn: async () => {
            const result = await getOrders(page, pageSize);
            if (!result || !Array.isArray(result.data)) {
                throw new Error('获取订单列表失败');
            }
            return result;
        },
        placeholderData: keepPreviousData, // 切换页面时保持旧数据显示
        staleTime: 30 * 1000, // 30秒内数据视为新鲜
    });

    const orders = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const goToPage = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    }, [totalPages]);

    const handleRefresh = useCallback(() => {
        refetch();
        toast.success('已刷新');
    }, [refetch]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 glass-layout-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center flex-1 min-w-[300px] gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索客户、订单号..."
                            className="pl-9 bg-muted/20 border-none focus-visible:ring-1"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isFetching}>
                        <RotateCcw className={isFetching ? "animate-spin h-4 w-4" : "h-4 w-4"} />
                    </Button>
                </div>

                {/* 分页信息 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>共 {total} 条</span>
                    {isFetching && !isLoading && <span className="text-blue-500">更新中...</span>}
                </div>
            </div>

            {isLoading ? (
                <div className="h-[400px] flex items-center justify-center glass-empty-state rounded-lg border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                        <RotateCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">加载中...</p>
                    </div>
                </div>
            ) : (
                <OrderTable data={orders} />
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
                                    variant={pageNum === page ? "default" : "ghost"}
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
    );
}
