'use client';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    TrendingUp,
    ChevronDown,
    ChevronRight,
    Building2,
    User
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ChannelStats } from '../actions/channel-stats';

/**
 * 渠道排行榜组件属性
 */
interface ChannelRankingProps {
    data: ChannelStats[];
    loading?: boolean;
    currentPeriod?: 'month' | 'quarter' | 'year' | 'all';
}

/**
 * 格式化金额显示
 */
function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `¥${(amount / 10000).toFixed(1)}万`;
    }
    return `¥${amount.toLocaleString()}`;
}

/**
 * 等级颜色映射
 */
const levelColors: Record<string, string> = {
    S: 'bg-yellow-500 text-white',
    A: 'bg-green-500 text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-gray-500 text-white',
};

/**
 * 渠道排行榜
 */
export function ChannelRanking({ data, loading, currentPeriod = 'month' }: ChannelRankingProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const router = useRouter();
    const searchParams = useSearchParams();

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handlePeriodChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', value);
        router.push(`?${params.toString()}`);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">渠道排行榜</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    渠道排行榜
                </CardTitle>
                <Select value={currentPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="周期" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month" className="text-xs">本月</SelectItem>
                        <SelectItem value="quarter" className="text-xs">本季度</SelectItem>
                        <SelectItem value="year" className="text-xs">本年</SelectItem>
                        <SelectItem value="all" className="text-xs">全部</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        暂无渠道数据
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.map((channel, index) => (
                            <ChannelRankingItem
                                key={channel.channelId}
                                channel={channel}
                                rank={index + 1}
                                expandedIds={expandedIds}
                                onToggleExpand={toggleExpand}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * 单个渠道排行项
 */
interface ChannelRankingItemProps {
    channel: ChannelStats;
    rank: number;
    /** 当前展开的渠道 ID 集合（由顶层组件管理） */
    expandedIds: Set<string>;
    /** 展开/折叠回调（由顶层组件管理） */
    onToggleExpand: (id: string) => void;
    isChild?: boolean;
}

function ChannelRankingItem({
    channel,
    rank,
    expandedIds,
    onToggleExpand,
    isChild = false
}: ChannelRankingItemProps) {
    const isExpanded = expandedIds.has(channel.channelId);
    const onToggle = () => onToggleExpand(channel.channelId);
    const hasChildren = channel.children && channel.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    'hover:bg-muted/50 cursor-pointer',
                    isChild && 'ml-8 border-l-2 border-muted'
                )}
                onClick={hasChildren ? onToggle : undefined}
            >
                {/* 排名 */}
                {!isChild && (
                    <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                        {rank}
                    </div>
                )}

                {/* 展开按钮 */}
                {hasChildren && (
                    <button className="p-1 hover:bg-muted rounded">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}

                {!hasChildren && !isChild && <div className="w-6" />}

                {/* 渠道图标 */}
                {channel.hierarchyLevel === 1 ? (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                )}

                {/* 渠道信息 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{channel.channelName}</span>
                        {channel.channelLevel && (
                            <span className={cn(
                                'px-1.5 py-0.5 rounded text-xs font-bold',
                                levelColors[channel.channelLevel] || levelColors.C
                            )}>
                                {channel.channelLevel}
                            </span>
                        )}
                        {channel.isActive ? (
                            <Badge variant="default" className="text-xs">活跃</Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs">沉默</Badge>
                        )}
                    </div>
                </div>

                {/* 统计数据 */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                        <div className="font-semibold text-green-600">
                            {formatAmount(channel.totalDealAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">带单</div>
                    </div>
                    <div className="text-right">
                        <div className="font-medium">{channel.dealCount}单</div>
                        <div className="text-xs text-muted-foreground">成交</div>
                    </div>
                    <div className="text-right">
                        <div className="font-medium">{channel.conversionRate.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">转化</div>
                    </div>
                </div>
            </div>

            {/* 子渠道 */}
            {hasChildren && isExpanded && (
                <div className="space-y-1">
                    {channel.children!.map((child, index) => (
                        <ChannelRankingItem
                            key={child.channelId}
                            channel={child}
                            rank={index + 1}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            isChild
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
