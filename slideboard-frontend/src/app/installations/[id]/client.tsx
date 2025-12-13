'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PaperModal } from '@/components/ui/paper-modal';
import { InstallationDetail } from '@/features/installations/components/detail/InstallationDetail';
import { InstallationAssignForm } from '@/features/installations/components/form/InstallationAssignForm';
import { InstallationAssignFormData } from '@/features/installations/schemas/installation';
import { InstallationTask } from '@/features/installations/types';
import { installationService } from '@/services/installation.client';

export function InstallationTaskDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [task, setTask] = useState<InstallationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await installationService.getTaskById(id);
      setTask(data);
    } catch (error) {
      console.error('Failed to fetch task detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (data: InstallationAssignFormData) => {
    try {
      setIsSubmitting(true);
      await installationService.assignTask(id, data);
      setAssignModalOpen(false);
      fetchTask();
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('分配失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async () => {
      try {
          await installationService.startTask(id);
          fetchTask();
      } catch (error) {
          console.error('Failed to start task', error);
      }
  }

  const handleComplete = async () => {
    // In a real app, this would open a completion modal or form
    if (confirm('确认完成安装任务？')) {
      try {
        await installationService.completeTask(id, {
          completedTime: new Date().toISOString()
        });
        fetchTask();
      } catch (error) {
        console.error('Failed to complete task:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-ink-500">加载中...</div>;
  }

  if (!task) {
    return <div className="p-8 text-center text-ink-500">任务不存在</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <InstallationDetail
        task={task}
        onBack={() => router.back()}
        onAssign={() => setAssignModalOpen(true)}
        onStart={handleStart}
        onComplete={handleComplete}
      />

      <PaperModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="分配安装任务"
      >
        <InstallationAssignForm
          onSubmit={handleAssignSubmit}
          onCancel={() => setAssignModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </PaperModal>
    </div>
  );
}
