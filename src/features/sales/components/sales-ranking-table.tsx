'use client';

/**
 * 销售排名表组件
 * 展示团队成员当月目标完成排名
 */

import { cn } from '@/shared/lib/utils';
import type { SalesRankingItem } from '../actions/analytics';

// ========== 类型定义 ==========

export interface SalesRankingTableProps {
    /** 排名数据列表 */
    data: SalesRankingItem[];
    /** 当前用户 ID（用于高亮自己的行） */
    currentUserId?: string;
    /** 是否加载中 */
    isLoading?: boolean;
    /** 表格标题，默认"销售排名" */
    title?: string;
    /** 额外样式 */
    className?: string;
}

// ========== 内部辅助函数 ==========

/** 格式化金额 */
function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toLocaleString('zh-CN');
}

/** 获取排名徽标颜色 */
function getRankBadgeStyle(rank: number): string {
    switch (rank) {
        case 1: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 2: return 'bg-gray-100 text-gray-600 border-gray-300';
        case 3: return 'bg-orange-100 text-orange-700 border-orange-300';
        default: return 'bg-white text-gray-400 border-gray-200';
    }
}

/** 获取排名图标（前3名使用奖杯/奖牌） */
function getRankIcon(rank: number): string {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `${rank}`;
    }
}

/** 获取完成率进度条颜色 */
function getCompletionColor(rate: number): string {
    if (rate >= 100) return 'bg-emerald-500';
    if (rate >= 80) return 'bg-blue-500';
    if (rate >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
}

// ========== 空状态组件 ==========

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl">📊</span>
            <p className="mt-2 text-sm">暂无排名数据</p>
            <p className="text-xs">请先为团队成员设定本月目标</p>
        </div>
    );
}

// ========== 骨架屏组件 ==========

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="h-2 w-full rounded bg-gray-100" />
            </div>
            <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
    );
}

// ========== 主组件 ==========

/**
 * 销售排名表
 *
 * 用法示例：
 * ```tsx
 * <SalesRankingTable
 *   data={rankingData}
 *   currentUserId={session.user.id}
 *   title="2月销售排名"
 * />
 * ```
 */
export function SalesRankingTable({
    data,
    currentUserId,
    isLoading = false,
    title = '销售排名',
    className,
}: SalesRankingTableProps) {
    return (
        <div className={cn('rounded-xl border bg-white shadow-sm overflow-hidden', className)}>
            {/* 表头 */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                <span className="text-xs text-gray-400">共 {isLoading ? '--' : data.length} 人</span>
            </div>

            {/* 内容区 */}
            {isLoading ? (
                <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="divide-y">
                    {data.map((item) => {
                        const isCurrentUser = item.userId === currentUserId;
                        return (
                            <div
                                key={item.userId}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 transition-colors',
                                    isCurrentUser
                                        ? 'bg-blue-50'
                                        : 'hover:bg-gray-50'
                                )}
                            >
                                {/* 排名标识 */}
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold',
                                        getRankBadgeStyle(item.rank)
                                    )}
                                    aria-label={`第${item.rank}名`}
                                >
                                    {item.rank <= 3 ? (
                                        <span>{getRankIcon(item.rank)}</span>
                                    ) : (
                                        <span className="text-xs">{item.rank}</span>
                                    )}
                                </div>

                                {/* 头像 */}
                                {item.userAvatar ? (
                                    <img
                                        src={item.userAvatar}
                                        alt={item.userName}
                                        className="h-8 w-8 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-indigo-600 text-white text-xs font-bold">
                                        {item.userName.charAt(0)}
                                    </div>
                                )}

                                {/* 用户信息和进度条 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <span className={cn(
                                                'text-sm font-medium truncate',
                                                isCurrentUser ? 'text-blue-700' : 'text-gray-800'
                                            )}>
                                                {item.userName}
                                            </span>
                                            {isCurrentUser && (
                                                <span className="text-xs text-blue-500 bg-blue-100 px-1 rounded">我</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                                            ¥{formatAmount(item.achievedAmount)}
                                            <span className="text-gray-300 mx-1">/</span>
                                            ¥{formatAmount(item.targetAmount)}
                                        </span>
                                    </div>
                                    {/* 进度条 */}
                                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                getCompletionColor(item.completionRate)
                                            )}
                                            style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                                            role="progressbar"
                                            aria-valuenow={item.completionRate}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        />
                                    </div>
                                </div>

                                {/* 完成率 */}
                                <div className="text-right shrink-0 w-12">
                                    <span className={cn(
                                        'text-sm font-semibold',
                                        item.completionRate >= 100 ? 'text-emerald-600' :
                                            item.completionRate >= 80 ? 'text-blue-600' :
                                                item.completionRate >= 50 ? 'text-yellow-600' :
                                                    'text-red-500'
                                    )}>
                                        {item.completionRate}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
