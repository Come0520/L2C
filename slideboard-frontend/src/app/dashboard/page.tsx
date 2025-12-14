'use client';

import { Layout, TrendingUp } from 'lucide-react';
import React from 'react';

import { MovingBorderCard } from '@/components/ui/moving-border-card';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { StatefulButton } from '@/components/ui/stateful-button';

// 导入提取的组件
import { ActivityList } from '@/features/dashboard/components/ActivityList';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { TaskList } from '@/features/dashboard/components/TaskList';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

export default function DashboardPage() {
  const { stats, recentActivities, pendingTasks, isLoading } = useDashboard();

  // 如果需要，可以在这里处理 isLoading 状态，显示骨架屏
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">总览仪表盘</h1>
            <p className="text-theme-text-secondary mt-1">实时业务洞察与核心指标监控。</p>
          </div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Status - Highlighted */}
          <div className="col-span-1">
            <MovingBorderCard className="h-full" borderColor="var(--color-success-500)">
              <div className="p-6 flex flex-col justify-between h-full relative z-10">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">实时状态</span>
                  </div>
                  <h3 className="text-lg font-semibold text-theme-text-primary">系统运行正常</h3>
                  <p className="text-sm text-theme-text-secondary mt-1">所有关键服务在线。</p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-theme-bg-tertiary rounded-full h-1.5 mb-1">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-theme-text-secondary">
                    <span>SLA</span>
                    <span>99.9%</span>
                  </div>
                </div>
              </div>
            </MovingBorderCard>
          </div>

          {/* Dynamic Stats */}
          {stats.slice(0, 3).map((stat, index) => (
            <div key={index} className="col-span-1">
              <StatsCard stat={stat} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
