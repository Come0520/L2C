'use client';
import { logger } from '@/shared/lib/logger';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Package from 'lucide-react/dist/esm/icons/package';
import Truck from 'lucide-react/dist/esm/icons/truck';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { getProcurementDashboardMetrics } from '../actions/po-actions';
import { Skeleton } from '@/shared/ui/skeleton';
import { motion } from 'framer-motion';
import { ProcurementMetrics } from '../types';



/**
 * 仪表盘简易草稿采购单接口
 */
export interface SimpleDraftPO {
    id: string;
    /** 采购单号 */
    poNo: string;
    /** 供应商 ID */
    supplierId: string;
    /** 供应商名称 */
    supplierName: string;
    /** 总成本 (字符串格式) */
    totalCost: string | null;
    /** 关联订单号 */
    orderNo?: string;
    /** 创建时间 */
    createdAt: Date;
}


/**
 * 采购看板组件 (Procurement Dashboard)
 * 
 * @description 核心数据中枢，展示采购单的核心指标 (待处理、运输中、已延期、已完成)。
 * 包含指标入场动画及异步加载状态处理。
 * @param props 包含可选的草稿采购单列表 `draftPos`
 */
interface ProcurementDashboardProps {
    draftPos?: SimpleDraftPO[];
}

export function ProcurementDashboard({ draftPos: _draftPos }: ProcurementDashboardProps) {
    const [metrics, setMetrics] = useState<ProcurementMetrics | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const result = await getProcurementDashboardMetrics();
                if (result.success && result.data) {
                    setMetrics(result.data);
                }
            } catch (error) {
                logger.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    const renderValue = (value: number | undefined) => {
        if (loading) return <Skeleton className="h-8 w-16" />;
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-bold"
            >
                {value ?? 0}
            </motion.div>
        );
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };


    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
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
            </motion.div>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已延期</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {renderValue(metrics?.delayed)}
                        <p className="text-xs text-muted-foreground">延期未送达订单</p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已完成</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {renderValue(metrics?.completed)}
                        <p className="text-xs text-muted-foreground">已归档完结订单</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );

}

