'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { PaperButton } from '@/components/ui/paper-button'
import { INSTALLATION_STATUS_CONFIG } from '@/constants/installation-order-status'

// Form schema using Zod
const installationStatusUpdateSchema = z.object({
  status: z.string().min(1, '安装状态不能为空'),
  notes: z.string().optional()
})

type InstallationStatusUpdateFormData = z.infer<typeof installationStatusUpdateSchema>

interface InstallationStatusUpdateFormProps {
  currentStatus: string
  onSubmit: (data: InstallationStatusUpdateFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const InstallationStatusUpdateForm: React.FC<InstallationStatusUpdateFormProps> = ({ 
  currentStatus, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InstallationStatusUpdateFormData>({
    resolver: zodResolver(installationStatusUpdateSchema),
    defaultValues: {
      status: currentStatus
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">更新安装状态</h3>
        
        <div>
          <PaperSelect
            label="安装状态"
            error={errors.status?.message}
            options={Object.entries(INSTALLATION_STATUS_CONFIG).map(([value, config]) => ({ 
              value, 
              label: config.label 
            }))}
            {...register('status')}
          />
        </div>
        
        <div>
          <PaperTextarea
            label="状态变更备注"
            placeholder="请输入状态变更的原因或备注信息..."
            error={errors.notes?.message}
            rows={4}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <PaperButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </PaperButton>
        <PaperButton
          type="submit"
          variant="primary"
          loading={loading}
        >
          更新状态
        </PaperButton>
      </div>
    </form>
  )
}
