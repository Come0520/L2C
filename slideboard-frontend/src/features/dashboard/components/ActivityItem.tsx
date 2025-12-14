'use client';

import { ShoppingCart, Users, DollarSign, AlertCircle, FileText } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { RecentActivity } from '@/shared/types/dashboard';

interface ActivityItemProps {
  activity: RecentActivity;
}

const STATUS_COLOR_MAP = {
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-rose-500 bg-rose-500/10",
  info: "text-blue-500 bg-blue-500/10"
};

export const ActivityItem = React.memo(({ activity }: ActivityItemProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <li className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-theme-bg-tertiary transition-colors duration-200 border border-transparent hover:border-theme-border">
      <div className={cn(
        "mt-1 p-2 rounded-md transition-colors",
        STATUS_COLOR_MAP[activity.status],
        "group-hover:bg-theme-bg-secondary"
      )}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-theme-text-primary truncate group-hover:text-theme-text-primary transition-colors">
            {activity.title}
          </p>
          <span className="text-xs text-theme-text-secondary font-mono">{activity.time}</span>
        </div>
        <p className="text-sm text-theme-text-secondary mt-1 line-clamp-2 group-hover:text-theme-text-secondary transition-colors">
          {activity.description}
        </p>
      </div>
    </li>
  );
});

ActivityItem.displayName = 'ActivityItem';
