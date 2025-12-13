import { Metadata } from 'next';
import React, { Suspense } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { getMeasurementTasks } from '@/services/measurement.server';
import { MeasurementTaskList } from '@/features/measurement/components/measurement-task-list';
import { MeasurementTaskPageClient } from './client';

export const metadata: Metadata = {
  title: '测量任务',
};

export default async function MeasurementTaskPage() {
  const tasks = await getMeasurementTasks();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">测量任务</h1>
          <p className="text-ink-500 mt-1">管理所有测量任务的分配和进度</p>
        </div>
        <PaperButton>新建测量任务</PaperButton>
      </div>

      <PaperCard>
        <PaperCardContent className="p-0">
          <MeasurementTaskList
            tasks={tasks}
            onAssign={(id) => {
              // 使用 URL 参数打开分配模态框
              const params = new URLSearchParams(window.location.search);
              params.set('assign', id);
              window.history.pushState({}, '', `?${params.toString()}`);
            }}
            onView={(id) => {
              // 导航到测量任务详情页
              window.location.href = `/measurements/${id}`;
            }}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 客户端组件用于处理模态框和交互 */}
      <Suspense fallback={null}>
        <MeasurementTaskPageClient initialTasks={tasks} />
      </Suspense>
    </div>
  );
}
