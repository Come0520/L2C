'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PaperModal } from '@/components/ui/paper-modal';
import { MeasurementAssignForm } from '@/features/measurement/components/measurement-assign-form';
import { MeasurementAssignFormData } from '@/features/measurement/schemas/measurement-schema';
import { MeasurementTask } from '@/features/measurement/types';
import { measurementService } from '@/services/measurement.client';

interface MeasurementTaskPageClientProps {
  initialTasks: MeasurementTask[];
}

export function MeasurementTaskPageClient({ initialTasks }: MeasurementTaskPageClientProps) {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<MeasurementTask[]>(initialTasks);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从URL参数检查是否需要打开分配模态框
  useEffect(() => {
    const assignId = searchParams.get('assign');
    if (assignId) {
      setSelectedTaskId(assignId);
      setAssignModalOpen(true);
    } else {
      setSelectedTaskId(null);
      setAssignModalOpen(false);
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      const data = await measurementService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch measurement tasks:', error);
    }
  };

  const handleAssignSubmit = async (data: MeasurementAssignFormData) => {
    if (!selectedTaskId) return;
    try {
      setIsSubmitting(true);
      await measurementService.assignTask(selectedTaskId, data);
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
      title="分配测量任务"
    >
      <MeasurementAssignForm
        onSubmit={handleAssignSubmit}
        onCancel={handleModalClose}
        isSubmitting={isSubmitting}
      />
    </PaperModal>
  );
}
