'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PaperModal } from '@/components/ui/paper-modal';
import { MeasurementAssignForm } from '@/features/measurement/components/measurement-assign-form';
import { MeasurementDetail } from '@/features/measurement/components/measurement-detail';
import { MeasurementAssignFormData } from '@/features/measurement/schemas/measurement-schema';
import { MeasurementTask } from '@/features/measurement/types';
import { measurementService } from '@/services/measurement.client';

export function MeasurementTaskDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [task, setTask] = useState<MeasurementTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await measurementService.getTaskById(id);
      setTask(data);
    } catch (error) {
      console.error('Failed to fetch task detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (data: MeasurementAssignFormData) => {
    try {
      setIsSubmitting(true);
      await measurementService.assignTask(id, data);
      setAssignModalOpen(false);
      fetchTask();
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('分配失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // In a real app, this would open a completion modal or form
    if (confirm('确认完成测量任务？')) {
      try {
        await measurementService.completeTask(id, {
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
      <MeasurementDetail
        task={task}
        onBack={() => router.back()}
        onAssign={() => setAssignModalOpen(true)}
        onComplete={handleComplete}
      />

      <PaperModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="分配测量任务"
      >
        <MeasurementAssignForm
          onSubmit={handleAssignSubmit}
          onCancel={() => setAssignModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </PaperModal>
    </div>
  );
}
