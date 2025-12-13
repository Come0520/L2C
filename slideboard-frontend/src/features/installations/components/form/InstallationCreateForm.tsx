'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCheckbox } from '@/components/ui/paper-checkbox'
import { PaperDateTimePicker } from '@/components/ui/paper-date-time-picker'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperSelect } from '@/components/ui/paper-select'
import { installationTypeMap } from '@/constants/installation-order-status'
import { measurementService } from '@/services/measurements.client'
import { salesOrderService } from '@/services/salesOrders.client'

// Form schema using Zod
const installationCreateSchema = z.object({
  salesOrderNo: z.string().min(1, '销售单号不能为空'),
  measurementId: z.string().optional(),
  customerName: z.string().min(1, '客户名称不能为空'),
  customerPhone: z.string().min(1, '客户电话不能为空'),
  projectAddress: z.string().min(1, '项目地址不能为空'),
  installationType: z.string().min(1, '安装类型不能为空'),
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

type InstallationCreateFormData = z.infer<typeof installationCreateSchema>

interface InstallationCreateFormProps {
  onSubmit: (data: InstallationCreateFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const InstallationCreateForm: React.FC<InstallationCreateFormProps> = ({ onSubmit, onCancel, loading = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<InstallationCreateFormData>({
    resolver: zodResolver(installationCreateSchema),
    defaultValues: {
      powerSupply: false,
      waterSupply: false,
      ventilation: false,
      lighting: false,
      estimatedDuration: 120,
      installationFee: 0,
      additionalFee: 0,
      materialFee: 0,
      requiredTools: [],
      requiredMaterials: []
    }
  })

  const [newTool, setNewTool] = React.useState('')
  const [newMaterial, setNewMaterial] = React.useState('')
  const requiredTools = watch('requiredTools') || []
  const requiredMaterials = watch('requiredMaterials') || []
  
  // Sales order integration state
  const [salesOrders, setSalesOrders] = useState<Array<{ value: string; label: string; customerName: string; customerPhone: string; projectAddress: string }>>([])
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(false)
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('')
  
  // Measurement order integration state
  const [measurementOrders, setMeasurementOrders] = useState<Array<{ value: string; label: string }>>([])
  const [measurementOrdersLoading, setMeasurementOrdersLoading] = useState(false)
  const [selectedMeasurementOrder, setSelectedMeasurementOrder] = useState<string>('')
  
  // Fetch sales orders for selection
  useEffect(() => {
    const fetchSalesOrders = async () => {
      setSalesOrdersLoading(true)
      try {
        const result = await salesOrderService.getSalesOrders(1, 100) // Fetch up to 100 orders
        if (result.code === 0 && result.data) {
          const orders = result.data.orders.map((order: any) => ({
            value: order.id,
            label: `${order.sales_no} - ${order.customer_name}`,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            projectAddress: order.project_address
          }))
          setSalesOrders(orders)
        }
      } catch (_) {
      } finally {
        setSalesOrdersLoading(false)
      }
    }
    
    fetchSalesOrders()
  }, [])
  
  // Fetch measurement orders for selected sales order
  useEffect(() => {
    const fetchMeasurementOrders = async () => {
      if (!selectedSalesOrder) {
        setMeasurementOrders([])
        setSelectedMeasurementOrder('')
        setValue('measurementId', '')
        return
      }
      
      setMeasurementOrdersLoading(true)
      try {
        const result = await measurementService.getMeasurements(1, 50, undefined, selectedSalesOrder)
        const measurements = result.measurements.map((measurement: any) => ({
          value: measurement.id,
          label: `测量单 ${measurement.quoteNo || measurement.id}`
        }))
        setMeasurementOrders(measurements)
      } catch (_) {
        setMeasurementOrders([])
      } finally {
        setMeasurementOrdersLoading(false)
      }
    }
    
    fetchMeasurementOrders()
  }, [selectedSalesOrder, setValue])

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

  // Handle sales order selection change
  const handleSalesOrderChange = (value: string) => {
    setSelectedSalesOrder(value)
    const order = salesOrders.find(order => order.value === value)
    if (order) {
      // Auto-fill customer information from selected sales order
      setValue('salesOrderNo', value) // Store sales order ID as salesOrderNo
      setValue('customerName', order.customerName)
      setValue('customerPhone', order.customerPhone)
      setValue('projectAddress', order.projectAddress)
    }
  }

  // Handle measurement order selection change
  const handleMeasurementOrderChange = (value: string) => {
    setSelectedMeasurementOrder(value)
    setValue('measurementId', value) // Store measurement order ID in form
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本信息</h3>
        
        {/* Sales Order and Measurement Integration */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">销售订单与测量系统集成</h4>
          <p className="text-xs text-blue-600 mb-3">从销售订单系统中选择关联的销售单，系统将自动填充客户信息；选择关联的测量单以获取测量数据</p>
          
          <div className="space-y-4">
            <div className="relative">
              <PaperSelect
                label="关联销售单"
                error={errors.salesOrderNo?.message}
                options={salesOrders}
                value={selectedSalesOrder}
                onChange={(e) => {
                  handleSalesOrderChange(e.target.value);
                  register('salesOrderNo').onChange(e);
                }}
              />
              {salesOrdersLoading && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="animate-spin h-5 w-5 text-gray-400"></div>
                </div>
              )}
            </div>
            
            {selectedSalesOrder && (
              <div className="relative">
                <PaperSelect
                  label="关联测量单"
                  error={errors.measurementId?.message}
                  options={measurementOrders}
                  value={selectedMeasurementOrder}
                  onChange={(e) => {
                    handleMeasurementOrderChange(e.target.value);
                    register('measurementId').onChange(e);
                  }}
                />
                {measurementOrdersLoading && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="animate-spin h-5 w-5 text-gray-400"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
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
          <PaperDateTimePicker
            label="安装日期"
            value={watch('scheduledAt') || ''}
            onChange={(value) => setValue('scheduledAt', value)}
            format="date"
          />
          <PaperDateTimePicker
            label="预约时段"
            value={watch('appointmentTimeSlot') || ''}
            onChange={(value) => setValue('appointmentTimeSlot', value)}
            format="time"
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
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
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">特殊说明</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="请输入特殊说明..."
            {...register('specialInstructions')}
          />
          {errors.specialInstructions?.message && (
            <p className="text-sm text-red-500">{errors.specialInstructions?.message}</p>
          )}
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
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5"></div>
              创建中...
            </span>
          ) : (
            '创建安装单'
          )}
        </PaperButton>
      </div>
    </form>
  )
}
