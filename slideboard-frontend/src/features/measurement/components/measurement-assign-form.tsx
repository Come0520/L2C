'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input';
import { PaperSelect } from '@/components/ui/paper-select'; // Assuming this component exists or use native select

import { measurementAssignSchema, MeasurementAssignFormData } from '../schemas/measurement-schema';

interface MeasurementAssignFormProps {
  onSubmit: (data: MeasurementAssignFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Mock users list
const MEASUREMENT_USERS = [
  { value: 'USER001', label: '王师傅' },
  { value: 'USER002', label: '李师傅' },
  { value: 'USER003', label: '张师傅' },
];

export function MeasurementAssignForm({ onSubmit, onCancel, isSubmitting }: MeasurementAssignFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<MeasurementAssignFormData>({
    resolver: zodResolver(measurementAssignSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-600 mb-1">测量员</label>
        <select
          className="w-full border border-theme-border rounded-md p-2 bg-theme-bg-secondary"
          {...register('assignedTo')}
        >
          <option value="">请选择测量员</option>
          {MEASUREMENT_USERS.map(user => (
            <option key={user.value} value={user.value}>{user.label}</option>
          ))}
        </select>
        {errors.assignedTo && <p className="text-sm text-error-600 mt-1">{errors.assignedTo.message}</p>}
      </div>

      <PaperInput
        label="预约时间"
        type="datetime-local"
        error={errors.appointmentTime?.message}
        {...register('appointmentTime')}
      />

      <PaperTextarea
        label="备注"
        placeholder="请输入备注信息"
        error={errors.remarks?.message}
        {...register('remarks')}
      />

      <div className="flex justify-end gap-3 pt-4">
        <PaperButton type="button" variant="outline" onClick={onCancel}>
          取消
        </PaperButton>
        <PaperButton type="submit" variant="primary" loading={isSubmitting}>
          确认分配
        </PaperButton>
      </div>
    </form>
  );
}
