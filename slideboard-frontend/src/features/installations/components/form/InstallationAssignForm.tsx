'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input';

import { installationAssignSchema, InstallationAssignFormData } from '../../schemas/installation';

interface InstallationAssignFormProps {
  onSubmit: (data: InstallationAssignFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Mock users list
const INSTALLATION_USERS = [
  { value: 'USER004', label: '赵师傅' },
  { value: 'USER005', label: '陈师傅' },
  { value: 'USER006', label: '孙师傅' },
];

export function InstallationAssignForm({ onSubmit, onCancel, isSubmitting }: InstallationAssignFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InstallationAssignFormData>({
    resolver: zodResolver(installationAssignSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-600 mb-1">安装工</label>
        <select
          className="w-full border border-theme-border rounded-md p-2 bg-theme-bg-secondary"
          {...register('assignedTo')}
        >
          <option value="">请选择安装工</option>
          {INSTALLATION_USERS.map(user => (
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
