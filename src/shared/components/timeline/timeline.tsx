/**
 * 通用时间线组�?
 * 支持自定义图标、颜色映射，可展开收起
 */

'use client';

import { useState } from 'react';
import { Circle, ChevronDown, ChevronUp } from 'lucide-react';


import { cn, formatDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

// 时间线事件类�?
export interface TimelineEvent {
    /** 事件唯一标识 */
    id: string;
    /** 事件类型，用于图标和颜色映射 */
    type: string;
    /** 事件内容描述 */
    content: string;
    /** 事件时间 */
    timestamp?: Date | string | null;
    /** 操作人名�?*/
    actor?: string | null;
    /** 附加结果信息 */
    result?: string | null;
    /** 详情（可选，JSON 格式展示�?*/
    details?: Record<string, unknown> | null;
}

export interface TimelineProps {
    /** 时间线事件列�?*/
    events: TimelineEvent[];
    /** 图标映射：事件类�?-> 图标组件 */
    iconMap?: Record<string, React.ElementType>;
    /** 颜色映射：事件类�?-> CSS 类名（如 'bg-blue-500'�?*/
    colorMap?: Record<string, string>;
    /** 标签映射：事件类�?-> 显示标签 */
    labelMap?: Record<string, string>;
    /** 是否支持展开收起 */
    expandable?: boolean;
    /** 默认展示数量（仅�?expandable �?true 时有效），默�?1 */
    defaultExpandCount?: number;
    /** 空状态提示文�?*/
    emptyText?: string;
    /** 自定义类�?*/
    className?: string;
    /** 是否显示详情 */
    showDetails?: boolean;
    /** 日期格式化方式，默认使用 formatDate */
    formatTimestamp?: (timestamp: Date | string) => string;
}

/**
 * 通用时间线组�?
 * 可用于展示：线索跟进记录、订单状态变更、物流轨迹等
 */
export function Timeline({
    events,
    iconMap = {},
    colorMap = {},
    labelMap = {},
    expandable = false,
    defaultExpandCount = 1,
    emptyText = '暂无记录',
    className,
    showDetails = false,
    formatTimestamp,
}: TimelineProps) {
    const [expanded, setExpanded] = useState(false);

    // 可见事件
    const visibleEvents = expandable && !expanded
        ? events.slice(0, defaultExpandCount)
        : events;

    // 获取图标组件
    const getIcon = (type: string) => {
        // 确保 type 是字符串
        const eventType = String(type || 'DEFAULT');
        const IconComponent = iconMap[eventType] || iconMap.DEFAULT;
        if (IconComponent) {
            return <IconComponent className="h-4 w-4" />;
        }
        // 最终兜底方�?
        return <Circle className="h-4 w-4 text-gray-400" />;
    };

    // 获取颜色类名
    const getColorClass = (type: string) => {
        // 确保 type 是字符串
        const eventType = String(type || 'DEFAULT');
        return colorMap[eventType] || colorMap.DEFAULT || 'bg-gray-400';
    };

    // 获取标签
    const getLabel = (type: string, content: string) => {
        return labelMap[type] || content;
    };

    // 格式化时�?
    const formatTime = (timestamp: Date | string | null | undefined) => {
        if (!timestamp) return '-';
        try {
            if (formatTimestamp) return formatTimestamp(timestamp);
            return formatDate(timestamp);
        } catch (error) {
            // 如果格式化失败，返回原始值或占位�?
            console.error('Failed to format timestamp:', error);
            return String(timestamp);
        }
    };

    if (events.length === 0) {
        return (
            <div className={cn("text-center py-6 text-gray-400 text-sm", className)}>
                {emptyText}
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <div className="relative space-y-4 pl-2">
                {visibleEvents.map((event, index) => {
                    const isFirst = index === 0;
                    const isLast = index === visibleEvents.length - 1;
                    const colorClass = getColorClass(event.type);

                    return (
                        <div key={event.id} className="relative flex gap-3">
                            {/* 连接�?*/}
                            {!isLast && (
                                <div className="absolute left-[0.45rem] top-6 h-full w-px bg-gray-200" />
                            )}

                            {/* 图标节点 */}
                            <div className={cn(
                                "relative z-10 flex h-4 w-4 items-center justify-center rounded-full mt-0.5",
                                colorClass.startsWith('bg-')
                                    ? `${colorClass} text-white`
                                    : 'bg-white ring-2 ring-gray-100'
                            )}>
                                {colorClass.startsWith('bg-') ? (
                                    getIcon(event.type)
                                ) : (
                                    <div className={colorClass}>
                                        {getIcon(event.type)}
                                    </div>
                                )}
                            </div>

                            {/* 内容区域 */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "font-medium text-sm",
                                        isFirst ? "text-gray-900" : "text-gray-700"
                                    )}>
                                        {labelMap[event.type] ? getLabel(event.type, event.content) : event.content}
                                    </span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>

                                {event.actor && (
                                    <div className="text-xs text-gray-500">
                                        操作�? {event.actor}
                                    </div>
                                )}

                                {/* 如果有标签映射，则显示原始内�?*/}
                                {labelMap[event.type] && (
                                    <p className="text-sm text-gray-600">
                                        {event.content}
                                    </p>
                                )}

                                {event.result && (
                                    <p className="text-xs text-gray-400 italic">
                                        结果: {event.result}
                                    </p>
                                )}

                                {showDetails && event.details && Object.keys(event.details).length > 0 && (
                                    <div className="mt-1 text-xs text-gray-400 truncate">
                                        {JSON.stringify(event.details).slice(0, 60)}...
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 展开/收起按钮 */}
            {expandable && events.length > defaultExpandCount && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs text-gray-500"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            收起 ({events.length - defaultExpandCount} �?
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            展开更多 ({events.length - defaultExpandCount} �?
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}

