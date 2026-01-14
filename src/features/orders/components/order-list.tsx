'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { OrderTable } from './order-table';
import { getOrders } from '../actions/orders';
import { toast } from 'sonner';

export function OrderList() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const orders = await getOrders();
            if (Array.isArray(orders)) {
                setData(orders);
            } else if (orders.success && orders.data) {
                setData(orders.data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('获取订单列表失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center flex-1 min-w-[300px] gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索客户、订单号..."
                            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchOrders}>
                        <RotateCcw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                        <RotateCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">加载中...</p>
                    </div>
                </div>
            ) : (
                <OrderTable data={data} />
            )}
        </div>
    );
}
