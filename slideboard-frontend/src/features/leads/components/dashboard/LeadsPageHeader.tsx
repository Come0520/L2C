'use client';

import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { ExportMenu, ExportFormat } from '@/components/ui/export-menu';
import { notificationService } from '@/services/notifications';
import type { Notification } from '@/shared/types/notification';

const tabVariants = cva(
  "px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200",
  {
    variants: {
      active: {
        true: "border-primary-500 text-primary-600",
        false: "border-transparent text-theme-text-secondary hover:text-theme-text-primary hover:border-theme-border",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface LeadsPageHeaderProps {
  onNotificationsClick: (notifications: Notification[]) => void;
  onNotificationsOpenChange: (open: boolean) => void;
  onExport?: (format: ExportFormat) => void;
}

export function LeadsPageHeader({ onNotificationsClick, onNotificationsOpenChange, onExport }: LeadsPageHeaderProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleNotificationsClick = async () => {
    try {
      setLoading(true);
      onNotificationsOpenChange(true);
      // In a real optimized app, this data fetching might be moved up or to a query hook
      const list = await notificationService.getNotifications();
      onNotificationsClick(list as Notification[]);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-text-primary">线索管理</h1>
          <p className="text-theme-text-secondary mt-1">支持列表与看板视图、详情抽屉与转化分析</p>
        </div>
        <div className="flex items-center space-x-3">
          {onExport && <ExportMenu onExport={onExport} />}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 border border-theme-border rounded-md text-sm font-medium text-theme-text-primary bg-theme-bg-secondary hover:bg-theme-bg-tertiary disabled:opacity-50 transition-colors"
            onClick={handleNotificationsClick}
            disabled={loading}
          >
            {loading ? '加载中...' : '通知中心'}
          </motion.button>
        </div>
      </div>

      <div className="bg-theme-bg-secondary shadow rounded-lg border border-theme-border">
        <div className="p-6">
          <nav className="flex space-x-4 border-b border-theme-border">
            <Link
              href="/leads"
              className={tabVariants({ active: pathname === '/leads' })}
            >
              列表视图
            </Link>
            <Link
              href="/leads/kanban"
              className={tabVariants({ active: pathname === '/leads/kanban' })}
            >
              看板视图
            </Link>
            <Link
              href="/leads/analytics"
              className={tabVariants({ active: pathname === '/leads/analytics' })}
            >
              转化分析
            </Link>
          </nav>
        </div>
      </div>
    </motion.div>
  );
}

