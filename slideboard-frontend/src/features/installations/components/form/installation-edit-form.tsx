'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaperDateTimePicker } from '@/components/ui/paper-date-time-picker'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperCheckbox } from '@/components/ui/paper-checkbox'
import { PaperButton } from '@/components/ui/paper-button'
import { installationTypeMap, INSTALLATION_STATUS_CONFIG } from '@/constants/installation-order-status'
import { Installation } from '@/types/installation'

// Form schema using Zod (similar to create schema but with some fields optional)
const installationEditSchema = z.object({
  salesOrderNo: z.string().min(1, '销售单号不能为空'),
  customerName: z.string().min(1, '客户名称不能为空'),
  customerPhone: z.string().min(1, '客户电话不能为空'),
  projectAddress: z.string().min(1, '项目地址不能为空'),
  installationType: z.string().min(1, '安装类型不能为空'),
  status: z.string().min(1, '安装状态不能为空'),
  scheduledAt: z.string().min(1, '安装日期不能为空'),
  appointmentTimeSlot: z.string().min(1, '预约时段不能为空'),
  estimatedDuration: z.number().min(1, '预计时长不能为空').max(480, '预计时长不能超过8小时'),
  installationContact: z.string().min(1, '现场联系人不能为空'),
  installationPhone: z.string().min(1, '联系人电话不能为空'),
  specialInstructions: z.string().optional(),
  powerSupply: z.boolean(),
  waterSupply: z.boolean(),
  ventilation: z.boolean(),
  lighting: z.boolean(),
  otherEnvironmentRequirements: z.string().optional(),
  requiredTools: z.array(z.string()).optional(),
  requiredMaterials: z.array(z.string()).optional(),
  installationFee: z.number().min(0, '安装费用不能为负数'),
  additionalFee: z.number().min(0, '额外费用不能为负数'),
  materialFee: z.number().min(0, '材料费用不能为负数'),
  feeNotes: z.string().optional()
})

type InstallationEditFormData = z.infer<typeof installationEditSchema>

interface InstallationEditFormProps {
  installation: Installation
  onSubmit: (data: InstallationEditFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const InstallationEditForm: React.FC<InstallationEditFormProps> = ({ installation, onSubmit, onCancel, loading = false }) => {
  // Transform installation data to form data format
  const initialFormData = {
    salesOrderNo: installation.salesOrderNo,
    customerName: installation.customerName,
    customerPhone: installation.customerPhone,
    projectAddress: installation.projectAddress,
    installationType: installation.installationType,
    status: installation.status,
    scheduledAt: installation.scheduledAt,
    appointmentTimeSlot: installation.appointmentTimeSlot,
    estimatedDuration: installation.estimatedDuration,
    installationContact: installation.installationContact,
    installationPhone: installation.installationPhone,
    specialInstructions: installation.specialInstructions,
    powerSupply: installation.environmentRequirements.powerSupply,
    waterSupply: installation.environmentRequirements.waterSupply,
    ventilation: installation.environmentRequirements.ventilation,
    lighting: installation.environmentRequirements.lighting,
    otherEnvironmentRequirements: installation.environmentRequirements.other,
    requiredTools: installation.requiredTools || [],
    requiredMaterials: installation.requiredMaterials || [],
    installationFee: installation.installationFee,
    additionalFee: installation.additionalFee,
    materialFee: installation.materialFee,
    feeNotes: installation.feeNotes
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<InstallationEditFormData>({
    resolver: zodResolver(installationEditSchema),
    defaultValues: initialFormData
  })

  const [newTool, setNewTool] = React.useState('')
  const [newMaterial, setNewMaterial] = React.useState('')
  const requiredTools = watch('requiredTools') || []
  const requiredMaterials = watch('requiredMaterials') || []

  const handleAddTool = () => {
    if (newTool.trim()) {
      setValue('requiredTools', [...requiredTools, newTool.trim()])
      setNewTool('')
    }
  }

  const handleRemoveTool = (index: number) => {
    setValue('requiredTools', requiredTools.filter((_, i) => i !== index))
  }

  const handleAddMaterial = () => {
    if (newMaterial.trim()) {
      setValue('requiredMaterials', [...requiredMaterials, newMaterial.trim()])
      setNewMaterial('')
    }
  }

  const handleRemoveMaterial = (index: number) => {
    setValue('requiredMaterials', requiredMaterials.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <PaperInput
            label="销售单号"
            error={errors.salesOrderNo?.message}
            {...register('salesOrderNo')}
          />
          <PaperInput
            label="客户名称"
            error={errors.customerName?.message}
            {...register('customerName')}
          />
          <PaperInput
            label="客户电话"
            type="tel"
            error={errors.customerPhone?.message}
            {...register('customerPhone')}
          />
          <PaperInput
            label="项目地址"
            error={errors.projectAddress?.message}
            {...register('projectAddress')}
          />
          <PaperSelect
            label="安装类型"
            error={errors.installationType?.message}
            options={Object.entries(installationTypeMap).map(([value, label]) => ({ value, label }))}
            {...register('installationType')}
          />
          <PaperSelect
            label="安装状态"
            error={errors.status?.message}
            options={Object.entries(INSTALLATION_STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
            {...register('status')}
          />
          <Controller
            control={control}
            name="scheduledAt"
            render={({ field }) => (
              <PaperDateTimePicker
                label="安装日期"
                format="date"
                error={errors.scheduledAt?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="appointmentTimeSlot"
            render={({ field }) => (
              <PaperDateTimePicker
                label="预约时段"
                format="time"
                error={errors.appointmentTimeSlot?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <PaperInput
            label="预计时长（分钟）"
            type="number"
            error={errors.estimatedDuration?.message}
            {...register('estimatedDuration', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">现场联系信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <PaperInput
            label="现场联系人"
            error={errors.installationContact?.message}
            {...register('installationContact')}
          />
          <PaperInput
            label="联系人电话"
            type="tel"
            error={errors.installationPhone?.message}
            {...register('installationPhone')}
          />
        </div>
      </div>

      {/* Environment Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">环境要求</h3>
        <div className="grid grid-cols-2 gap-4">
          <PaperCheckbox
            label="电源供应"
            {...register('powerSupply')}
          />
          <PaperCheckbox
            label="水源供应"
            {...register('waterSupply')}
          />
          <PaperCheckbox
            label="通风条件"
            {...register('ventilation')}
          />
          <PaperCheckbox
            label="照明条件"
            {...register('lighting')}
          />
        </div>
        <PaperInput
          label="其他环境要求"
          error={errors.otherEnvironmentRequirements?.message}
          {...register('otherEnvironmentRequirements')}
        />
      </div>

      {/* Required Tools */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">所需工具</h3>
        <div className="flex gap-2">
          <PaperInput
            label="添加工具"
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTool()}
          />
          <PaperButton
            type="button"
            onClick={handleAddTool}
            className="mt-1"
          >
            添加
          </PaperButton>
        </div>
        {requiredTools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requiredTools.map((tool, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{tool}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Required Materials */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">所需材料</h3>
        <div className="flex gap-2">
          <PaperInput
            label="添加材料"
            value={newMaterial}
            onChange={(e) => setNewMaterial(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddMaterial()}
          />
          <PaperButton
            type="button"
            onClick={handleAddMaterial}
            className="mt-1"
          >
            添加
          </PaperButton>
        </div>
        {requiredMaterials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requiredMaterials.map((material, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>{material}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">费用信息</h3>
        <div className="grid grid-cols-3 gap-4">
          <PaperInput
            label="安装费用"
            type="number"
            error={errors.installationFee?.message}
            {...register('installationFee', { valueAsNumber: true })}
          />
          <PaperInput
            label="额外费用"
            type="number"
            error={errors.additionalFee?.message}
            {...register('additionalFee', { valueAsNumber: true })}
          />
          <PaperInput
            label="材料费用"
            type="number"
            error={errors.materialFee?.message}
            {...register('materialFee', { valueAsNumber: true })}
          />
        </div>
        <PaperInput
          label="费用备注"
          error={errors.feeNotes?.message}
          {...register('feeNotes')}
        />
      </div>

      {/* Special Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">特殊说明</h3>
        <PaperTextarea
          label="特殊说明"
          rows={4}
          error={errors.specialInstructions?.message}
          {...register('specialInstructions')}
        />
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
          保存修改
        </PaperButton>
      </div>
    </form>
  )
}
