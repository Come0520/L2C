'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';

interface LeadsLayoutProps {
  children: React.ReactNode;
}

export default function LeadsLayout({ children }: LeadsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 p-6">
      {/* 标题区域 */}
      <div>
        <h1 className="text-3xl font-bold text-ink-800">线索管理</h1>
        <p className="text-ink-500 mt-1">支持列表与看板视图、详情抽屉与转化分析</p>
      </div>

      {/* 导航Tabs */}
      <PaperCard>
        <PaperCardContent>
          <PaperNav vertical={false}>
            <PaperNavItem href="/leads" active={pathname === '/leads'}>
              列表视图
            </PaperNavItem>
            <PaperNavItem href="/leads/kanban" active={pathname === '/leads/kanban'}>
              看板视图
            </PaperNavItem>
            <PaperNavItem href="/leads/analytics" active={pathname === '/leads/analytics'}>
              转化分析
            </PaperNavItem>
          </PaperNav>
        </PaperCardContent>
      </PaperCard>

      {/* 内容区域 */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
