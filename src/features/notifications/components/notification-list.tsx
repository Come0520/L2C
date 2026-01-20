'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Check, MailOpen, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { markAsReadAction, markAllAsReadAction, getNotificationsAction } from '../actions';
import { toast } from 'sonner';
import { Notification } from '../types';

interface NotificationListProps {
    initialNotifications: Notification[];
    total: number;
}

export function NotificationList({ initialNotifications, total }: NotificationListProps) {
    const [list, setList] = useState<Notification[]>(initialNotifications);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialNotifications.length < total);

    const loadMore = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const res = await getNotificationsAction({ page: page + 1, limit: 20, onlyUnread: false });
            if (res?.data?.data) {
                const newItems = res.data.data;
                setList(prev => [...prev, ...newItems]);
                setPage(p => p + 1);
                if (list.length + newItems.length >= res.data.meta.total) {
                    setHasMore(false);
                }
            }
        } catch {
            toast.error('加载通知失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        const res = await markAsReadAction({ ids: [id] });
        if (res?.data?.success) {
            setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };

    const handleMarkAllRead = async () => {
        const res = await markAllAsReadAction({});
        if (res?.data?.success) {
            setList(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('全部已读');
        }
    };

    if (!list?.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground h-[400px]">
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p>暂无新通知</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end px-2">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-muted-foreground hover:text-primary">
                    <MailOpen className="w-4 h-4 mr-2" />
                    全部已读
                </Button>
            </div>
            <ScrollArea className="h-[600px] px-2">
                <div className="space-y-3 pb-4">
                    {list.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                "relative flex gap-4 p-4 rounded-lg border transition-all hover:bg-muted/50",
                                n.isRead ? "glass-step-inactive opacity-60" : "bg-card shadow-sm border-l-4 border-l-primary"
                            )}
                        >
                            {/* Unread Dot */}
                            {!n.isRead && (
                                <span className="absolute top-4 right-4 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                </span>
                            )}

                            <div className={cn(
                                "mt-1 p-2 rounded-full h-fit shrink-0",
                                n.type === 'ALERT' ? "glass-alert-error" :
                                    n.type === 'APPROVAL' ? "glass-alert-warning" :
                                        "glass-alert-info"
                            )}>
                                <Bell className="w-4 h-4" />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between w-[90%]">
                                    <h4 className={cn("text-sm font-semibold", !n.isRead && "text-primary")}>
                                        {n.title}
                                    </h4>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {n.content}
                                </p>
                                <div className="flex items-center gap-4 pt-2">
                                    <span className="text-xs text-muted-foreground">
                                        {n.createdAt && formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: zhCN })}
                                    </span>
                                    {n.channel !== 'IN_APP' && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1">
                                            {n.channel}
                                        </Badge>
                                    )}
                                    <div className="flex-1" />
                                    {!n.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs px-2"
                                            onClick={() => handleMarkAsRead(n.id)}
                                        >
                                            <Check className="w-3 h-3 mr-1" /> 标为已读
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="p-2 flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMore}
                                disabled={isLoading}
                                className="w-full text-muted-foreground"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 加载中...</>
                                ) : (
                                    "加载更多"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
