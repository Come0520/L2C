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
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';

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
        <div className="text-destructive bg-destructive/10 m-4 flex flex-col items-center justify-center rounded-lg p-6">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="text-sm font-medium">加载通知组件时发生错误</p>
          <p className="mt-1 text-xs opacity-70">{this.state.error?.message}</p>
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

  const prevFilterRef = React.useRef('ALL');

  // 监听分类筛选变化，进行服务端查寻
  useEffect(() => {
    if (filter !== prevFilterRef.current) {
      prevFilterRef.current = filter;
      const loadFiltered = async () => {
        setIsLoading(true);
        try {
          const res = await getNotificationsAction({
            page: 1,
            limit: 20,
            onlyUnread: false,
            type: filter,
          });
          if (res?.data?.data) {
            setList(res.data.data);
            setPage(1);
            setHasMore(res.data.data.length < res.data.meta.total);
          }
        } catch {
          toast.error('加载通知失败');
        } finally {
          setIsLoading(false);
        }
      };
      loadFiltered();
    }
  }, [filter]);

  // D5 UI/UX 优化：增加客户端轮询机制，每 30 秒检查一次最新消息
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await getNotificationsAction({
          page: 1,
          limit: 10,
          onlyUnread: false,
          type: filter,
        });
        if (res?.data?.data) {
          const latestItems = res.data.data;
          setList((prev) => {
            const prevIds = new Set(prev.map((i) => i.id));
            const newArrivals = latestItems.filter((i) => !prevIds.has(i.id));
            return [...newArrivals, ...prev];
          });
        }
      } catch (err) {
        console.error('Failed to poll new notifications', err);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [filter]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await getNotificationsAction({
        page: page + 1,
        limit: 20,
        onlyUnread: false,
        type: filter,
      });
      if (res?.data?.data) {
        const newItems = res.data.data;
        const metaTotal = res.data.meta.total;

        setList((prev) => [...prev, ...newItems]);
        setPage((p) => p + 1);

        if (newItems.length < 20 || list.length + newItems.length >= metaTotal) {
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
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const res = await markAsReadAction({ ids: [id] });
    if (!res?.data?.success) {
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      toast.error('标记已读失败');
    }
  };

  const handleMarkAllRead = async () => {
    if (!window.confirm('确定要将当前分类下的所有新通知标记为已读吗？')) {
      return;
    }

    const res = await markAllAsReadAction({ type: filter });
    if (res?.data?.success) {
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('全部已读');
    } else {
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 增强：分类筛选与全部已读操作区 */}
      <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
        <AceternityTabs
          tabs={FILTER_TYPES.map(type => ({
            value: type.value,
            title: (
              <span className="flex items-center gap-1.5">
                {type.label}
                {filter === type.value && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary h-4 border-none px-1 py-0 text-[10px] font-medium"
                  >
                    {list.length}
                  </Badge>
                )}
              </span>
            )
          }))}
          activeTab={filter}
          onTabChange={(value) => setFilter(value)}
          containerClassName="w-auto"
          tabClassName="px-4 py-2"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          className="text-muted-foreground hover:text-primary h-8 self-end"
        >
          <MailOpen className="mr-2 h-3.5 w-3.5" />
          <span className="text-xs">全部标记为已读</span>
        </Button>
      </div>

      <ScrollArea className="h-[650px] px-2">
        <NotificationErrorBoundary>
          <div className="space-y-3 pb-4">
            {!list.length ? (
              <div className="text-muted-foreground animate-in fade-in zoom-in flex flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50/30 p-12 duration-300">
                <Bell className="text-primary/20 mb-3 h-12 w-12" />
                <p className="text-sm">该分类下暂无通知</p>
              </div>
            ) : (
              list.map((n, index) => (
                <div
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={cn(
                    'group animate-in slide-in-from-bottom-2 fade-in relative flex gap-4 rounded-lg border p-4 transition-all duration-300',
                    n.isRead
                      ? 'bg-slate-50/50 opacity-75 grayscale-[0.3]'
                      : 'bg-card border-l-primary hover:border-primary border-l-4 shadow-sm hover:shadow-md'
                  )}
                >
                  {/* 未读呼吸灯 */}
                  {!n.isRead && (
                    <span className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="bg-primary/40 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                      <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
                    </span>
                  )}

                  <div
                    className={cn(
                      'mt-1 h-fit shrink-0 rounded-full p-2 transition-colors',
                      n.type === 'ALERT'
                        ? 'border border-red-100 bg-red-50 text-red-600'
                        : n.type === 'APPROVAL'
                          ? 'border border-amber-100 bg-amber-50 text-amber-600'
                          : 'border border-blue-100 bg-blue-50 text-blue-600'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4
                        className={cn(
                          'text-sm font-semibold transition-colors',
                          !n.isRead && 'text-primary'
                        )}
                      >
                        {n.title}
                      </h4>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {n.content}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-muted-foreground/70 text-[11px] font-medium">
                        {n.createdAt &&
                          (() => {
                            try {
                              const date = new Date(n.createdAt);
                              return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
                            } catch {
                              return '刚刚';
                            }
                          })()}
                      </span>

                      {n.channel !== 'IN_APP' && (
                        <Badge
                          variant="outline"
                          className="h-4.5 px-1.5 text-[9px] font-normal opacity-70"
                        >
                          {n.channel}
                        </Badge>
                      )}

                      <div className="flex-1" />

                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> 标为已读
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
                  className="text-muted-foreground w-full transition-colors hover:bg-slate-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载中...
                    </>
                  ) : (
                    '查看更早的通知'
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
