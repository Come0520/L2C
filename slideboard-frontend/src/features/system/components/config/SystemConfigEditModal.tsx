import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import PaperCard from '@/components/ui/paper-card';
import { SystemConfig } from '@/services/config.client';
import { systemConfigSchema, SystemConfigFormValues } from '@/features/system/schemas/config';

interface SystemConfigEditModalProps {
  config: SystemConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: SystemConfigFormValues) => Promise<void>;
  isSaving?: boolean;
}

export function SystemConfigEditModal({
  config,
  open,
  onClose,
  onSave,
  isSaving = false,
}: SystemConfigEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemConfigFormValues>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      key: '',
      value: '',
      description: '',
      category: '',
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        key: config.key,
        value: config.value,
        description: config.description || '',
        category: config.category,
      });
    } else {
      reset({
        key: '',
        value: '',
        description: '',
        category: '',
      });
    }
  }, [config, reset]);

  if (!open) return null;

  const onSubmit = async (data: SystemConfigFormValues) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <PaperCard className="w-full max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <PaperCard.Header>
            <PaperCard.Title>{config ? '编辑配置' : '新增配置'}</PaperCard.Title>
          </PaperCard.Header>
          <PaperCard.Content>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-paper-ink-secondary mb-1">
                  配置项 (Key)
                </label>
                <input
                  {...register('key')}
                  disabled={!!config} // Key is usually immutable for existing configs
                  className="w-full px-3 py-2 border border-paper-border rounded-md focus:outline-none focus:ring-2 focus:ring-paper-primary disabled:bg-paper-bg-light disabled:text-paper-ink-light"
                />
                {errors.key && (
                  <p className="text-paper-error text-xs mt-1">{errors.key.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-ink-secondary mb-1">
                  配置值 (Value)
                </label>
                <textarea
                  {...register('value')}
                  rows={3}
                  className="w-full px-3 py-2 border border-paper-border rounded-md focus:outline-none focus:ring-2 focus:ring-paper-primary"
                />
                {errors.value && (
                  <p className="text-paper-error text-xs mt-1">{errors.value.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-ink-secondary mb-1">
                  描述
                </label>
                <input
                  {...register('description')}
                  className="w-full px-3 py-2 border border-paper-border rounded-md focus:outline-none focus:ring-2 focus:ring-paper-primary"
                />
                {errors.description && (
                  <p className="text-paper-error text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-ink-secondary mb-1">
                  分类
                </label>
                <input
                  {...register('category')}
                  className="w-full px-3 py-2 border border-paper-border rounded-md focus:outline-none focus:ring-2 focus:ring-paper-primary"
                />
                {errors.category && (
                  <p className="text-paper-error text-xs mt-1">{errors.category.message}</p>
                )}
              </div>
            </div>
          </PaperCard.Content>
          <PaperCard.Footer>
            <div className="flex justify-end space-x-3">
              <PaperButton variant="outline" type="button" onClick={onClose}>
                取消
              </PaperButton>
              <PaperButton type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </PaperButton>
            </div>
          </PaperCard.Footer>
        </form>
      </PaperCard>
    </div>
  );
}
