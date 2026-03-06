'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { getUnreadCountAction } from '@/features/notifications/actions';

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
                console.error('Failed to fetch unread notification count:', error);
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
        >
            <Link href="/notifications">
                <Bell className="text-muted-foreground h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                )}
            </Link>
        </Button>
    );
}
