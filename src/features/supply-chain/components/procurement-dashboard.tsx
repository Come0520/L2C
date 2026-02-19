'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Package from 'lucide-react/dist/esm/icons/package';
import Truck from 'lucide-react/dist/esm/icons/truck';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { getProcurementDashboardMetrics } from '../actions/po-actions';
import { Loader2 } from 'lucide-react';

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

export function ProcurementDashboard({ draftPos }: ProcurementDashboardProps) {
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
        if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;
        return <div className="text-2xl font-bold">{value ?? '--'}</div>;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.pending)}
                    <p className="text-xs text-muted-foreground">待处理采购单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.inTransit)}
                    <p className="text-xs text-muted-foreground">运输中订单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.delayed)}
                    <p className="text-xs text-muted-foreground">已延期订单</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {renderValue(metrics?.completed)}
                    <p className="text-xs text-muted-foreground">已完成订单</p>
                </CardContent>
            </Card>
        </div>
    );
}

