'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

/**
 * 安装任务状态Tabs配置
 */
const INSTALL_STATUS_TABS = [
    { key: 'ALL', label: '全部' },
    { key: 'PENDING_DISPATCH', label: '待分配' },
    { key: 'PENDING_VISIT', label: '待上门' },
    { key: 'PENDING_CONFIRM', label: '待确认' },
    { key: 'COMPLETED', label: '已完成' },
] as const;

type InstallStatusTab = typeof INSTALL_STATUS_TABS[number]['key'];

/**
 * 状态颜色映射
 */
const STATUS_COLORS: Record<string, string> = {
    'PENDING_DISPATCH': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'DISPATCHING': 'bg-blue-100 text-blue-800 border-blue-200',
    'PENDING_VISIT': 'bg-purple-100 text-purple-800 border-purple-200',
    'PENDING_CONFIRM': 'bg-orange-100 text-orange-800 border-orange-200',
    'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
    'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * 状态中文映射
 */
const STATUS_LABELS: Record<string, string> = {
    'PENDING_DISPATCH': '待分配',
    'DISPATCHING': '分配中',
    'PENDING_VISIT': '待上门',
    'PENDING_CONFIRM': '待验收',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
};

/**
 * 品类中文映射
 */
const CATEGORY_LABELS: Record<string, string> = {
    'CURTAIN': '窗帘',
    'WALLCLOTH': '墙布',
    'WALLPAPER': '墙纸',
    'OTHER': '其他',
};

interface InstallTask {
    id: string;
    taskNo?: string | null;
    customerName: string | null;
    address: string | null;
    status: string;
    category?: string | null;
    installerName?: string | null;
    scheduledDate: Date | string | null;
    logisticsReadyStatus?: boolean | null;
}

interface InstallTaskTableProps {
    data: InstallTask[];
}

/**
 * 安装任务列表组件
 * 
 * 功能：
 * 1. 状态Tabs切换
 * 2. 安装单号、品类、师傅列显示
 * 3. 物流和预约时间显示
 */
export function InstallTaskTable({ data }: InstallTaskTableProps) {
    const [statusTab, setStatusTab] = useState<InstallStatusTab>('ALL');

    // 根据状态Tab过滤数据
    const filteredData = useMemo(() => {
        if (statusTab === 'ALL') return data;
        return data.filter((task) => task.status === statusTab);
    }, [data, statusTab]);

    // 各状态统计
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: data.length };
        data.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
        });
        return counts;
    }, [data]);

    const handleTabChange = useCallback((tab: InstallStatusTab) => {
        setStatusTab(tab);
    }, []);

    return (
        <div className="space-y-4">
            {/* 状态Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg overflow-x-auto">
                {INSTALL_STATUS_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2',
                            statusTab === tab.key
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                    >
                        {tab.label}
                        {statusCounts[tab.key] !== undefined && (
                            <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded-full',
                                statusTab === tab.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                            )}>
                                {statusCounts[tab.key] || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* 数据表格 */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[130px]">安装单号</TableHead>
                            <TableHead className="w-[100px]">客户</TableHead>
                            <TableHead className="w-[150px]">安装地址</TableHead>
                            <TableHead className="w-[80px]">品类</TableHead>
                            <TableHead className="w-[80px]">状态</TableHead>
                            <TableHead className="w-[80px]">师傅</TableHead>
                            <TableHead className="w-[80px]">物流</TableHead>
                            <TableHead className="w-[100px]">预约日期</TableHead>
                            <TableHead className="w-[100px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    暂无安装任务
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((task) => (
                                <TableRow key={task.id}>
                                    {/* 安装单号 */}
                                    <TableCell className="font-mono text-sm">
                                        <Link
                                            href={`/service/installation/${task.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {task.taskNo || task.id.slice(0, 8)}
                                        </Link>
                                    </TableCell>

                                    {/* 客户 */}
                                    <TableCell className="font-medium">
                                        {task.customerName || '未知客户'}
                                    </TableCell>

                                    {/* 地址 */}
                                    <TableCell className="max-w-[150px] truncate" title={task.address || ''}>
                                        {task.address || '无地址'}
                                    </TableCell>

                                    {/* 品类 */}
                                    <TableCell>
                                        {CATEGORY_LABELS[task.category || ''] || task.category || '-'}
                                    </TableCell>

                                    {/* 状态 */}
                                    <TableCell>
                                        <Badge className={STATUS_COLORS[task.status] || 'bg-gray-100'}>
                                            {STATUS_LABELS[task.status] || task.status}
                                        </Badge>
                                    </TableCell>

                                    {/* 师傅 */}
                                    <TableCell>
                                        {task.installerName || '-'}
                                    </TableCell>

                                    {/* 物流 */}
                                    <TableCell>
                                        {task.logisticsReadyStatus ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">货齐</Badge>
                                        ) : (
                                            <Badge variant="secondary">备货中</Badge>
                                        )}
                                    </TableCell>

                                    {/* 预约日期 */}
                                    <TableCell>
                                        {task.scheduledDate
                                            ? new Date(task.scheduledDate).toLocaleDateString()
                                            : '未预约'}
                                    </TableCell>

                                    {/* 操作 */}
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/service/installation/${task.id}`}>详情</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 统计信息 */}
            <div className="text-sm text-muted-foreground text-right">
                共 {filteredData.length} 条记录
            </div>
        </div>
    );
}
