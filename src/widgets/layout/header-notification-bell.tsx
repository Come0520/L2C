'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { getUnreadCountAction } from '@/features/notifications/actions';
import { logger } from '@/shared/lib/logger';

export function HeaderNotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const res = await getUnreadCountAction();
        if (mounted && res?.data?.data?.count !== undefined) {
          setUnreadCount(res.data.data.count);
        }
      } catch (error) {
        logger.error('Failed to fetch unread notification count:', error);
      }
    };

    // Initial fetch
    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full hover:bg-white/10"
      aria-label={unreadCount > 0 ? `${unreadCount}条未读通知` : '通知'}
    >
      <Link href="/notifications">
        <Bell className="text-muted-foreground h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.6rem] leading-none font-medium text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
