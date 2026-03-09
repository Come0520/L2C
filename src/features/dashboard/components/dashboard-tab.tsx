'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { useSession } from 'next-auth/react';
import { DashboardEditor } from './dashboard-editor';

/**
 * 仪表盘 Tab 内容组件
 * 使用可配置的 DashboardEditor 展示用户自定义的 KPI 卡片
 * 性能优化：直接从 session 获取角色，消除冗余的 /api/me 请求
 */
export function DashboardTab() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'USER';

  return (
    <div className="space-y-6">
      {/* 可配置仪表盘 */}
      <DashboardEditor userRole={userRole || 'USER'} />

      {/* 销售趋势图表（固定位置） */}
      <Card className="glass-liquid border-white/10">
        <CardHeader>
          <CardTitle className="text-base font-medium">销售趋势</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground text-center">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="text-sm">图表开发中...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
