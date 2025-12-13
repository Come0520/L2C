import { Metadata } from 'next';
import React, { Suspense } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { getInstallationTasks } from '@/services/installation.server';
import { InstallationTaskList } from '@/features/installations/components/list/InstallationTaskList';
import { InstallationTaskPageClient } from './client';

export const metadata: Metadata = {
  title: '安装任务',
};

export default async function InstallationTaskPage() {
  const tasks = await getInstallationTasks();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">安装任务</h1>
          <p className="text-ink-500 mt-1">管理所有安装任务的分配和进度</p>
        </div>
        <PaperButton>新建安装任务</PaperButton>
      </div>

      <PaperCard>
        <PaperCardContent className="p-0">
          <InstallationTaskList
            tasks={tasks}
            onAssign={(id) => {
              // 使用 URL 参数打开分配模态框
              const params = new URLSearchParams(window.location.search);
              params.set('assign', id);
              window.history.pushState({}, '', `?${params.toString()}`);
            }}
            onView={(id) => {
              // 导航到安装任务详情页
              window.location.href = `/installations/${id}`;
            }}
            onComplete={(id) => {
              // 直接完成任务，无需模态框
              if (confirm('确认完成安装任务？')) {
                // 调用客户端组件中的完成任务函数
                const params = new URLSearchParams(window.location.search);
                params.set('complete', id);
                window.history.pushState({}, '', `?${params.toString()}`);
              }
            }}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 客户端组件用于处理模态框和交互 */}
      <Suspense fallback={null}>
        <InstallationTaskPageClient initialTasks={tasks} />
      </Suspense>
    </div>
  );
}
