'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Check, MailOpen, Bell, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { markAsReadAction, markAllAsReadAction, getNotificationsAction } from '../actions';
import { toast } from 'sonner';
import { Notification } from '../types';

/**
 * 局部错误边界组件
 * 防止单条通知数据异常导致整个列表崩溃
 */
class NotificationErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Notification rendering error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-6 text-destructive bg-destructive/10 rounded-lg m-4">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-sm font-medium">加载通知组件时发生错误</p>
                    <p className="text-xs opacity-70 mt-1">{this.state.error?.message}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        重试
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}


interface NotificationListProps {
    initialNotifications: Notification[];
    total: number;
}

import { useRouter } from 'next/navigation';

export function NotificationList({ initialNotifications, total }: NotificationListProps) {
    const [list, setList] = useState<Notification[]>(initialNotifications);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialNotifications.length < total);
    const [filter, setFilter] = useState<string>('ALL');
    const router = useRouter();

    const FILTER_TYPES = [
        { label: '全部', value: 'ALL' },
        { label: '系统', value: 'SYSTEM' },
        { label: '审批', value: 'APPROVAL' },
        { label: '告警', value: 'ALERT' },
        { label: '通知', value: 'INFO' },
    ];

    // 过滤后的列表
    const filteredList = list.filter(n => {
        if (filter === 'ALL') return true;
        return n.type === filter;
    });

    // D5 UI/UX 优化：增加客户端轮询机制，每 30 秒检查一次最新消息
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const res = await getNotificationsAction({ page: 1, limit: 10, onlyUnread: false });
                if (res?.data?.data) {
                    const latestItems = res.data.data;
                    setList(prev => {
                        const prevIds = new Set(prev.map(i => i.id));
                        const newArrivals = latestItems.filter(i => !prevIds.has(i.id));
                        return [...newArrivals, ...prev];
                    });
                }
            } catch (err) {
                console.error('Failed to poll new notifications', err);
            }
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    const loadMore = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const res = await getNotificationsAction({ page: page + 1, limit: 20, onlyUnread: false });
            if (res?.data?.data) {
                const newItems = res.data.data;
                const metaTotal = res.data.meta.total;

                setList(prev => [...prev, ...newItems]);
                setPage(p => p + 1);

                if (newItems.length < 20 || (list.length + newItems.length >= metaTotal)) {
                    setHasMore(false);
                }
            }
        } catch {
            toast.error('加载通知失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = (n: Notification) => {
        if (!n.isRead) {
            handleMarkAsRead(n.id);
        }
        if (n.linkUrl) {
            router.push(n.linkUrl);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        const res = await markAsReadAction({ ids: [id] });
        if (!res?.data?.success) {
            setList(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            toast.error('标记已读失败');
        }
    };

    const handleMarkAllRead = async () => {
        const res = await markAllAsReadAction();
        if (res?.data?.success) {
            setList(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('全部已读');
        } else {
            toast.error('操作失败');
        }
    };

    return (
        <div className="space-y-4">
            {/* 增强：分类筛选与全部已读操作区 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex flex-wrap gap-2">
                    {FILTER_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setFilter(type.value)}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded-full transition-all border",
                                filter === type.value
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-muted-foreground border-input hover:border-primary/50"
                            )}
                        >
                            {type.label}
                            {filter === type.value && (
                                <Badge variant="secondary" className="ml-1.5 h-4 px-1 bg-primary-foreground/20 text-white border-none">
                                    {filteredList.length}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 text-muted-foreground hover:text-primary self-end">
                    <MailOpen className="w-3.5 h-3.5 mr-2" />
                    <span className="text-xs">全部标记为已读</span>
                </Button>
            </div>

            <ScrollArea className="h-[650px] px-2">
                <NotificationErrorBoundary>
                    <div className="space-y-3 pb-4">
                        {!filteredList.length ? (
                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-slate-50/30 rounded-xl border border-dashed animate-in fade-in zoom-in duration-300">
                                <Bell className="w-12 h-12 text-primary/20 mb-3" />
                                <p className="text-sm">该分类下暂无通知</p>
                            </div>
                        ) : (
                            filteredList.map((n, index) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleCardClick(n)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className={cn(
                                        "group relative flex gap-4 p-4 rounded-lg border transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in",
                                        n.isRead
                                            ? "bg-slate-50/50 opacity-75 grayscale-[0.3]"
                                            : "bg-card shadow-sm border-l-4 border-l-primary hover:shadow-md hover:border-primary"
                                    )}
                                >
                                    {/* 未读呼吸灯 */}
                                    {!n.isRead && (
                                        <span className="absolute top-4 right-4 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                    )}

                                    <div className={cn(
                                        "mt-1 p-2 rounded-full h-fit shrink-0 transition-colors",
                                        n.type === 'ALERT' ? "bg-red-50 text-red-600 border border-red-100" :
                                            n.type === 'APPROVAL' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                "bg-blue-50 text-blue-600 border border-blue-100"
                                    )}>
                                        <Bell className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={cn("text-sm font-semibold transition-colors", !n.isRead && "text-primary")}>
                                                {n.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>

                                        <div className="flex items-center gap-4 pt-2">
                                            <span className="text-[11px] font-medium text-muted-foreground/70">
                                                {n.createdAt && (() => {
                                                    try {
                                                        const date = new Date(n.createdAt);
                                                        return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
                                                    } catch { return '刚刚'; }
                                                })()}
                                            </span>

                                            {n.channel !== 'IN_APP' && (
                                                <Badge variant="outline" className="text-[9px] h-4.5 px-1.5 font-normal opacity-70">
                                                    {n.channel}
                                                </Badge>
                                            )}

                                            <div className="flex-1" />

                                            {!n.isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[11px] px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(n.id);
                                                    }}
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1" /> 标为已读
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {hasMore && (
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="w-full text-muted-foreground hover:bg-slate-50 transition-colors"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 加载中...</>
                                    ) : (
                                        "查看更早的通知"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </NotificationErrorBoundary>
            </ScrollArea>
        </div>
    );
}
