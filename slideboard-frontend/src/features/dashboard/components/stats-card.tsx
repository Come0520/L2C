'use client';

import {
  TrendingUp, Users, DollarSign, ShoppingCart, FileText,
  AlertCircle, ArrowUpRight, ArrowDownRight, Layout, Clock
} from 'lucide-react';
import React from 'react';

import { SpotlightCard } from '@/components/ui/spotlight-card';
import { cn } from '@/lib/utils';
import { DashboardStats, IconName } from '@/shared/types/dashboard';

// 1. 集中管理所有颜色变体 (Background & Text)
const THEME_STYLES = {
  success: {
    icon: "text-emerald-500",
    badge: "text-emerald-500 bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  warning: {
    icon: "text-amber-500",
    badge: "text-amber-500 bg-amber-500/10",
    border: "border-amber-500/20"
  },
  error: {
    icon: "text-rose-500",
    badge: "text-rose-500 bg-rose-500/10",
    border: "border-rose-500/20"
  },
  info: {
    icon: "text-blue-500",
    badge: "text-blue-500 bg-blue-500/10",
    border: "border-blue-500/20"
  }
};

const ICON_MAP: Record<IconName, React.ElementType> = {
  'trending-up': TrendingUp,
  'users': Users,
  'dollar-sign': DollarSign,
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'alert-circle': AlertCircle,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  'layout': Layout,
  'clock': Clock
};

interface StatsCardProps {
  stat: DashboardStats;
  className?: string;
}

export const StatsCard = React.memo(({ stat, className }: StatsCardProps) => {
  const IconComponent = ICON_MAP[stat.icon] || FileText;
  const styles = THEME_STYLES[stat.color] || THEME_STYLES.info;
  const isPositive = stat.change > 0;

  return (
    <SpotlightCard className={cn("bg-theme-bg-secondary border-theme-border h-full", className)}>
      <div className="p-6 relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          {/* 图标区域 */}
          <div className={cn("p-2 rounded-lg bg-theme-bg-tertiary transition-colors", styles.icon)}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          {/* 涨跌幅 Badge */}
          <span className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-full",
            isPositive
              ? "text-emerald-500 bg-emerald-500/10"
              : "text-rose-500 bg-rose-500/10"
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {stat.changeText}
          </span>
        </div>
        
        <div>
          <p className="text-sm font-medium text-theme-text-secondary">{stat.title}</p>
          <h3 className="text-3xl font-bold text-theme-text-primary mt-1 tracking-tight">{stat.value}</h3>
        </div>
      </div>
    </SpotlightCard>
  );
});

StatsCard.displayName = 'StatsCard';
