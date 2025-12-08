'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { installationTeamService } from '@/services/installation-team.client'

export default function SystemAuthPage() {
  const [status, setStatus] = useState<{ matchedByUid: boolean; matchedByEmail: boolean; userId: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const data = await installationTeamService.getInstallerBindingStatus();
      setStatus(data);
    })();
  }, []);

  const onBind = async () => {
    await installationTeamService.bindCurrentUser();
    const data = await installationTeamService.getInstallerBindingStatus();
    setStatus(data);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-ink-800">用户认证</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>当前会话</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-ink-700">状态：</span>
                <PaperBadge variant="success">已登录</PaperBadge>
              </div>
              <p className="text-ink-600">统一由 Supabase Auth 管理。</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-ink-700">绑定状态：</span>
                  <PaperBadge variant={status?.matchedByUid ? 'success' : 'warning'}>
                    {status?.matchedByUid ? '已绑定' : '未绑定'}
                  </PaperBadge>
                </div>
                <button className="px-4 py-2 bg-ink-800 text-white rounded" onClick={onBind}>一键绑定当前用户</button>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}
