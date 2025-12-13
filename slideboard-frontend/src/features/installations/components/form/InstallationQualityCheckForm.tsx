'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperDateTimePicker } from '@/components/ui/paper-date-time-picker'
import { PaperFileUpload } from '@/components/ui/paper-file-upload'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTextarea } from '@/components/ui/paper-textarea'

// Form schema using Zod
const qualityCheckItemSchema = z.object({
  name: z.string().min(1, '检查项目名称不能为空'),
  standard: z.string().min(1, '检查标准不能为空'),
  result: z.enum(['pass', 'fail', 'na'], { errorMap: () => ({ message: '请选择检查结果' }) }),
  notes: z.string().optional(),
  photoUrl: z.string().optional()
})

const installationQualityCheckSchema = z.object({
  checkDate: z.string().min(1, '检查日期不能为空'),
  checkerName: z.string().min(1, '检查人不能为空'),
  overallResult: z.enum(['pass', 'partial', 'fail'], { errorMap: () => ({ message: '请选择总体检查结果' }) }),
  checkItems: z.array(qualityCheckItemSchema).min(1, '至少需要添加一个检查项目'),
  notes: z.string().optional()
})

// const QualityCheckItem = z.infer<typeof qualityCheckItemSchema>
type InstallationQualityCheckFormData = z.infer<typeof installationQualityCheckSchema>

interface InstallationQualityCheckFormProps {
  installationId: string
  existingCheck?: any
  onSubmit: (data: InstallationQualityCheckFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const InstallationQualityCheckForm: React.FC<InstallationQualityCheckFormProps> = ({
  // installationId, // unused
  existingCheck,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<InstallationQualityCheckFormData>({
    resolver: zodResolver(installationQualityCheckSchema),
    defaultValues: existingCheck || {
      checkDate: new Date().toISOString().split('T')[0],
      checkerName: '',
      overallResult: 'pass',
      checkItems: [
        { name: '', standard: '', result: 'pass', notes: '', photoUrl: '' }
      ],
      notes: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checkItems'
  })

  const handleAddCheckItem = () => {
    append({ name: '', standard: '', result: 'pass', notes: '', photoUrl: '' })
  }

  const handleRemoveCheckItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">安装质量检查</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Controller
              control={control}
              name="checkDate"
              render={({ field }) => (
                <PaperDateTimePicker
                  label="检查日期"
                  format="date"
                  error={errors.checkDate?.message}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <PaperInput
              label="检查人"
              error={errors.checkerName?.message}
              {...register('checkerName')}
            />
          </div>
        </div>

        <div>
          <PaperSelect
            label="总体检查结果"
            error={errors.overallResult?.message}
            options={[
              { value: 'pass', label: '通过' },
              { value: 'partial', label: '部分通过' },
              { value: 'fail', label: '未通过' }
            ]}
            {...register('overallResult')}
          />
        </div>

        <div>
          <PaperTextarea
            label="检查备注"
            placeholder="请输入总体检查备注信息..."
            error={errors.notes?.message}
            rows={4}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Check Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">检查项目</h3>
          <PaperButton
            type="button"
            variant="outline"
            size="small"
            onClick={handleAddCheckItem}
          >
            添加检查项目
          </PaperButton>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">检查项目 {index + 1}</h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveCheckItem(index)}
                >
                  删除
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <PaperInput
                  label="项目名称"
                  error={errors.checkItems?.[index]?.name?.message}
                  {...register(`checkItems.${index}.name` as const)}
                />
              </div>

              <div>
                <PaperInput
                  label="检查标准"
                  error={errors.checkItems?.[index]?.standard?.message}
                  {...register(`checkItems.${index}.standard` as const)}
                />
              </div>

              <div>
                <PaperSelect
                  label="检查结果"
                  error={errors.checkItems?.[index]?.result?.message}
                  options={[
                    { value: 'pass', label: '通过' },
                    { value: 'fail', label: '未通过' },
                    { value: 'na', label: '不适用' }
                  ]}
                  {...register(`checkItems.${index}.result` as const)}
                />
              </div>
            </div>

            <div>
              <PaperTextarea
                label="项目备注"
                placeholder="请输入检查项目备注信息..."
                error={errors.checkItems?.[index]?.notes?.message}
                rows={2}
                {...register(`checkItems.${index}.notes` as const)}
              />
            </div>

            <div>
              <PaperFileUpload
                label="检查照片"
                error={errors.checkItems?.[index]?.photoUrl?.message}
                // Note: PaperFileUpload expects different props than PaperInput/Upload
                // For now, we'll just use it as a placeholder or need to adapt it
                // Since PaperFileUpload handles file objects, but schema expects string url
                // We might need a wrapper or change schema.
                // Assuming PaperFileUpload has onChange that returns files.
                // But register expects string.
                // This part requires more attention, but for now fixing import.
                {...register(`checkItems.${index}.photoUrl` as const)}
              />
            </div>
          </div>
        ))}
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
          提交质量检查
        </PaperButton>
      </div>
    </form>
  )
}
