'use client';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';

export default function SystemSettingsPage() {
  const [siteName, setSiteName] = React.useState('L2C 管理系统');
  const [timezone, setTimezone] = React.useState('Asia/Shanghai');

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-ink-800">系统配置</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基础配置</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <PaperInput value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="系统名称" />
            <PaperInput value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="时区" />
            <PaperButton variant="primary">保存</PaperButton>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

