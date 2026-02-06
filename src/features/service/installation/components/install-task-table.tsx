'use client';

import React from 'react';
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
import Link from 'next/link';

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
 * 纯展示组件，状态筛选由页面级 Tabs 控制
 */
export function InstallTaskTable({ data }: InstallTaskTableProps) {
    return (
        <div className="space-y-4">
            {/* 数据表格 */}
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
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                暂无安装任务
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((task) => (
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

            {/* 统计信息 */}
            <div className="text-sm text-muted-foreground text-right">
                共 {data.length} 条记录
            </div>
        </div>
    );
}

