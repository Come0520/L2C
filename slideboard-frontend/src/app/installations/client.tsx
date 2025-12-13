'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PaperModal } from '@/components/ui/paper-modal';
import { InstallationAssignForm } from '@/features/installations/components/form/InstallationAssignForm';
import { InstallationAssignFormData } from '@/features/installations/schemas/installation';
import { InstallationTask } from '@/features/installations/types';
import { installationService } from '@/services/installation.client';

interface InstallationTaskPageClientProps {
  initialTasks: InstallationTask[];
}

export function InstallationTaskPageClient({ initialTasks }: InstallationTaskPageClientProps) {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<InstallationTask[]>(initialTasks);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从URL参数检查是否需要打开分配模态框或完成任务
  useEffect(() => {
    const assignId = searchParams.get('assign');
    const completeId = searchParams.get('complete');
    
    if (assignId) {
      setSelectedTaskId(assignId);
      setAssignModalOpen(true);
    } else {
      setSelectedTaskId(null);
      setAssignModalOpen(false);
    }
    
    if (completeId) {
      handleCompleteTask(completeId);
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      const data = await installationService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch installation tasks:', error);
    }
  };

  const handleAssignSubmit = async (data: InstallationAssignFormData) => {
    if (!selectedTaskId) return;
    try {
      setIsSubmitting(true);
      await installationService.assignTask(selectedTaskId, data);
      setAssignModalOpen(false);
      // 关闭模态框后刷新任务列表
      fetchTasks();
      // 移除URL中的assign参数
      const params = new URLSearchParams(window.location.search);
      params.delete('assign');
      window.history.pushState({}, '', `?${params.toString()}`);
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('分配失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await installationService.completeTask(taskId, {
        completedTime: new Date().toISOString()
      });
      // 刷新任务列表
      fetchTasks();
      // 移除URL中的complete参数
      const params = new URLSearchParams(window.location.search);
      params.delete('complete');
      window.history.pushState({}, '', `?${params.toString()}`);
    } catch (error) {
      console.error('Failed to complete task', error);
      alert('完成任务失败，请重试');
      // 移除URL中的complete参数
      const params = new URLSearchParams(window.location.search);
      params.delete('complete');
      window.history.pushState({}, '', `?${params.toString()}`);
    }
  };

  const handleModalClose = () => {
    setAssignModalOpen(false);
    // 移除URL中的assign参数
    const params = new URLSearchParams(window.location.search);
    params.delete('assign');
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  return (
    <PaperModal
      isOpen={assignModalOpen}
      onClose={handleModalClose}
      title="分配安装任务"
    >
      <InstallationAssignForm
        onSubmit={handleAssignSubmit}
        onCancel={handleModalClose}
        isSubmitting={isSubmitting}
      />
    </PaperModal>
  );
}
