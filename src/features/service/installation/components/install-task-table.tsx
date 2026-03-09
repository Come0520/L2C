'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import Link from 'next/link';
import { InstallTaskSkeleton } from './install-task-skeleton';
import { ClipboardList, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';

/**
 * 状态颜色映射
 */
const STATUS_COLORS: Record<string, string> = {
  PENDING_DISPATCH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DISPATCHING: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_VISIT: 'bg-purple-100 text-purple-800 border-purple-200',
  PENDING_CONFIRM: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * 状态中文映射
 */
const STATUS_LABELS: Record<string, string> = {
  PENDING_DISPATCH: '待分配',
  DISPATCHING: '分配中',
  PENDING_VISIT: '待上门',
  PENDING_CONFIRM: '待验收',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

/**
 * 品类中文映射
 */
const CATEGORY_LABELS: Record<string, string> = {
  CURTAIN: '窗帘',
  WALLCLOTH: '墙布',
  WALLPAPER: '墙纸',
  OTHER: '其他',
};

/**
 * 安装单行结构定义
 */
interface InstallTask {
  /** 任务 ID */
  id: string;
  /** 安装单号 */
  taskNo?: string | null;
  /** 客户姓名 */
  customerName: string | null;
  /** 安装地址 */
  address: string | null;
  /** 任务状态 */
  status: string;
  /** 任务品类 (窗帘/墙布等) */
  category?: string | null;
  /** 指派师傅姓名 */
  installerName?: string | null;
  /** 预约安装日期 */
  scheduledDate: Date | string | null;
  /** 物流准备状态 */
  logisticsReadyStatus?: boolean | null;
}

/**
 * 安装任务列表属性接口
 */
interface InstallTaskTableProps {
  /** 任务数据列表 */
  data: InstallTask[];
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 分页信息 */
  pagination?: {
    /** 总记录数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页记录数 */
    pageSize: number;
  };
}

/**
 * 安装任务列表表格组件
 *
 * 符合 L5 级设计规范：
 * 1. 支持 Skeleton 骨架屏加载状态
 * 2. 增强的空状态展示（带图标与 CTA 引导）
 * 3. 完整的响应式布局与中文语义化标识
 */
export function InstallTaskTable({ data, isLoading, pagination }: InstallTaskTableProps) {
  // 处理加载状态
  if (isLoading) {
    return <InstallTaskSkeleton />;
  }

  // 计算分页显示范围
  const currentPage = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 20;
  const totalCount = pagination?.total || data.length;
  const startRange = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* 数据表格主体 */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[130px] text-zinc-400">安装单号</TableHead>
              <TableHead className="w-[120px] text-zinc-400">客户</TableHead>
              <TableHead className="text-zinc-400">安装地址</TableHead>
              <TableHead className="w-[100px] text-zinc-400">品类</TableHead>
              <TableHead className="w-[100px] text-zinc-400">状态</TableHead>
              <TableHead className="w-[100px] text-zinc-400">师傅</TableHead>
              <TableHead className="w-[100px] text-zinc-400">物流</TableHead>
              <TableHead className="w-[120px] text-zinc-400">预约日期</TableHead>
              <TableHead className="w-[100px] text-right text-zinc-400">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell colSpan={9} className="h-[400px]">
                  <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center space-y-4 text-zinc-500 duration-500">
                    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                      <ClipboardList className="h-12 w-12 text-blue-400 opacity-50" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-base font-semibold text-zinc-200">暂无安装任务</p>
                      <p className="max-w-[240px] text-sm">
                        当前筛选条件下未发现记录，请重新设置筛选条件或直接创建。
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="rounded-full border-blue-500/50 bg-blue-600/10 px-8 text-blue-400 hover:bg-blue-600/20"
                    >
                      <Link href="/service/installation/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        创建首个安装任务
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((task) => (
                <TableRow
                  key={task.id}
                  className="group border-white/5 transition-colors hover:bg-white/5"
                  // P1 性能优化：应用 L2C 规范中的 content-visibility 提升长列表首屏加载速度
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 50px' }}
                >
                  {/* 安装单号 */}
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/service/installation/${task.id}`}
                      className="font-medium text-blue-400 transition-colors hover:text-blue-300"
                    >
                      {task.taskNo || task.id.slice(0, 8)}
                    </Link>
                  </TableCell>

                  {/* 客户 */}
                  <TableCell className="font-medium text-zinc-200">
                    {task.customerName || '未知客户'}
                  </TableCell>

                  {/* 地址 */}
                  <TableCell
                    className="max-w-[200px] truncate text-zinc-400"
                    title={task.address || ''}
                  >
                    {task.address || '无详细地址'}
                  </TableCell>

                  {/* 品类 */}
                  <TableCell className="font-medium text-zinc-300">
                    {CATEGORY_LABELS[task.category || ''] || task.category || '-'}
                  </TableCell>

                  {/* 状态 */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full border-none px-2.5 py-0.5 font-medium capitalize',
                        STATUS_COLORS[task.status] || 'bg-zinc-800 text-zinc-300'
                      )}
                    >
                      {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </TableCell>

                  {/* 师傅 */}
                  <TableCell className="text-zinc-300">
                    {task.installerName || <span className="text-zinc-600">未分派</span>}
                  </TableCell>

                  {/* 物流 */}
                  <TableCell>
                    {task.logisticsReadyStatus ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      >
                        货齐
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-400"
                      >
                        备货
                      </Badge>
                    )}
                  </TableCell>

                  {/* 预约日期 */}
                  <TableCell className="text-zinc-400">
                    {task.scheduledDate ? (
                      format(new Date(task.scheduledDate), 'yyyy/MM/dd')
                    ) : (
                      <span className="text-zinc-600">待预约</span>
                    )}
                  </TableCell>

                  {/* 操作 */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Link
                        href={`/service/installation/${task.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        详情
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 统计信息与分页引导 */}
      <div className="flex items-center justify-between px-2 py-1 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
          显示 {startRange} - {endRange} 条记录，共{' '}
          <span className="mx-1 font-medium text-zinc-300">{totalCount}</span> 条
        </div>
        <div className="text-xs text-zinc-600 italic">数据实时更新中</div>
      </div>
    </div>
  );
}
