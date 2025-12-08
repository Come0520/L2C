'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_CONFIG } from '@/constants/measurement-status'
import MeasurementDataEditor from '@/features/orders/components/measurement-data-editor'
import { useMeasurement } from '@/hooks/useMeasurements'
import { useMeasurementTemplates } from '@/hooks/useMeasurementTemplates'
import { UpdateMeasurementRequest } from '@/types/measurement'

export default function EditMeasurementPage() {
  const params = useParams()
  const router = useRouter()
  const measurementId = params.id as string

  // 表单数据
  const [formData, setFormData] = useState<UpdateMeasurementRequest>({
    status: 'measuring_pending_assignment',
    surveyorId: '',
    scheduledAt: '',
    measurementData: undefined,
    completedAt: ''
  })

  // 模板选择状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取测量单详情和更新方法
  const { measurement, isLoading: isLoadingMeasurement, updateMeasurement } = useMeasurement(measurementId)
  // 获取测量模板列表
  const { templates, isLoadingTemplates } = useMeasurementTemplates()

  // 当测量单详情加载完成后，更新表单数据
  useEffect(() => {
    if (measurement) {
      setFormData({
        status: measurement.status,
        surveyorId: measurement.surveyorId || '',
        scheduledAt: measurement.scheduledAt || '',
        measurementData: measurement.measurementData || undefined,
        completedAt: measurement.completedAt || ''
      })
    }
  }, [measurement])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 应用模板处理函数
  const handleApplyTemplate = () => {
    if (!selectedTemplateId) {
      setErrors({ template: '请选择一个模板' });
      return;
    }

    const selectedTemplate = templates?.find(template => template.id === selectedTemplateId);
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        measurementData: {
          totalArea: selectedTemplate.totalArea,
          rooms: selectedTemplate.rooms.map(room => ({ id: room.id, name: room.name, area: room.area, items: [] }))
        }
      }));
      setErrors({});
    }
  }

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 可以根据需要添加更多验证规则

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await updateMeasurement(formData)
        // 跳转到测量单详情页面
        router.push(`/orders/measurements/${measurementId}`)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '更新测量单失败'
        setErrors({ submit: message })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (isLoadingMeasurement) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10">加载中...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!measurement) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10 text-red-500">测量单不存在</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">编辑测量单</h1>
            <p className="text-ink-500 mt-1">修改测量单的详细信息</p>
          </div>
          <PaperButton variant="outline" onClick={() => router.push(`/orders/measurements/${measurementId}`)}>
            返回详情
          </PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量单信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 状态选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleSelectChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(MEASUREMENT_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {MEASUREMENT_STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 测量师选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">测量师</label>
                <select
                  value={formData.surveyorId}
                  onChange={(e) => handleSelectChange('surveyorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* 这里应该从API获取测量师列表，暂时使用模拟数据 */}
                  <option value="">暂不分配</option>
                  <option value="1">测量师张三</option>
                  <option value="2">测量师李四</option>
                  <option value="3">测量师王五</option>
                </select>
              </div>

              {/* 计划测量时间 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">计划测量时间</label>
                <PaperInput
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  placeholder="选择计划测量时间"
                />
              </div>

              {/* 实际完成时间 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">实际完成时间</label>
                <PaperInput
                  type="datetime-local"
                  name="completedAt"
                  value={formData.completedAt}
                  onChange={handleInputChange}
                  placeholder="选择实际完成时间"
                />
              </div>

              {/* 模板选择 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-ink-700">使用测量模板</label>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择模板</option>
                    {isLoadingTemplates ? (
                      <option value="">加载中...</option>
                    ) : (
                      templates?.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.rooms.length} 个房间)
                        </option>
                      ))
                    )}
                  </select>
                  <PaperButton
                    variant="secondary"
                    onClick={handleApplyTemplate}
                    disabled={isLoadingTemplates || !selectedTemplateId}
                  >
                    应用模板
                  </PaperButton>
                </div>
                {errors.template && (
                  <p className="text-red-500 text-sm mt-1">{errors.template}</p>
                )}
              </div>

              {/* 测量数据 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">测量数据</label>
                <MeasurementDataEditor
                  value={formData.measurementData}
                  onChange={(value) => setFormData(prev => ({ ...prev, measurementData: value }))}
                  error={errors.measurementData}
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-2">
                <PaperButton variant="outline" type="button" onClick={() => router.push(`/orders/measurements/${measurementId}`)}>
                  取消
                </PaperButton>
                <PaperButton
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '保存中...' : '保存修改'}
                </PaperButton>
              </div>

              {/* 提交错误信息 */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errors.submit}
                </div>
              )}
            </form>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
