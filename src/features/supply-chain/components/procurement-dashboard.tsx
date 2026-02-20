'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Package from 'lucide-react/dist/esm/icons/package';
import Truck from 'lucide-react/dist/esm/icons/truck';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { getProcurementDashboardMetrics } from '../actions/po-actions';
import { Skeleton } from '@/shared/ui/skeleton';

interface DashboardMetrics {
    pending: number;
    inTransit: number;
    delayed: number;
    completed: number;
}

import { PurchaseOrder } from '../types';

interface ProcurementDashboardProps {
    draftPos?: PurchaseOrder[];
}

export function ProcurementDashboard({ draftPos: _draftPos }: ProcurementDashboardProps) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const result = await getProcurementDashboardMetrics();
                if (result.success && result.data) {
                    setMetrics(result.data);
                }
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    const renderValue = (value: number | undefined) => {
        if (loading) return <Skeleton className="h-8 w-16" />;
        return <div className="text-2xl font-bold">{value ?? '--'}</div>;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">待处理</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.pending)}
                    <p className="text-xs text-muted-foreground">待确认/待处理采购单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">运输中</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.inTransit)}
                    <p className="text-xs text-muted-foreground">物流已发出订单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已延期</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.delayed)}
                    <p className="text-xs text-muted-foreground">延期未送达订单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已完成</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.completed)}
                    <p className="text-xs text-muted-foreground">已归档完结订单</p>
                </CardContent>
            </Card>
        </div>
    );
}

