'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
 * 2. 搜索过滤（预留）
 * 3. 刷新功能
 */
export function OrderList() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    const fetchOrders = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const result = await getOrders(pageNum, pageSize);
            if (result && Array.isArray(result.data)) {
                setData(result.data);
                setTotalPages(result.totalPages);
                setTotal(result.total);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('获取订单列表失败');
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchOrders(page);
    }, [fetchOrders, page]);

    const goToPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 glass-layout-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center flex-1 min-w-[300px] gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索客户、订单号..."
                            className="pl-9 bg-muted/20 border-none focus-visible:ring-1"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => fetchOrders(page)}>
                        <RotateCcw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
                    </Button>
                </div>

                {/* 分页信息 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>共 {total} 条</span>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex items-center justify-center glass-empty-state rounded-lg border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                        <RotateCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">加载中...</p>
                    </div>
                </div>
            ) : (
                <OrderTable data={data} />
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
