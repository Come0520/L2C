'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { useCreateMeasurement } from '@/hooks/useMeasurements'
import { CreateMeasurementRequest } from '@/types/measurement'

export default function CreateMeasurementPage() {
  const router = useRouter()

  // 表单数据
  const [formData, setFormData] = useState<CreateMeasurementRequest>({
    quoteVersionId: '',
    scheduledAt: '',
    surveyorId: ''
  })

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 创建测量单的mutation
  const createMeasurementMutation = useCreateMeasurement()

  // Wrapper to handle success/error for the form
  const handleCreate = (data: CreateMeasurementRequest) => {
    createMeasurementMutation.mutate(data, {
      onSuccess: () => {
        router.push('/orders/measurements')
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : '创建测量单失败'
        setErrors({ submit: message })
      }
    })
  }

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

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.quoteVersionId) {
      newErrors.quoteVersionId = '请选择报价单版本'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      handleCreate(formData)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">创建测量单</h1>
            <p className="text-ink-500 mt-1">填写测量单信息，创建新的测量单</p>
          </div>
          <PaperButton variant="outline" onClick={() => router.push('/orders/measurements')}>
            返回列表
          </PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量单信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 报价单版本选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">报价单版本</label>
                <select
                  value={formData.quoteVersionId}
                  onChange={(e) => handleSelectChange('quoteVersionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择报价单版本</option>
                  {/* 这里应该从API获取报价单版本列表，暂时使用模拟数据 */}
                  <option value="1">报价单版本1</option>
                  <option value="2">报价单版本2</option>
                  <option value="3">报价单版本3</option>
                </select>
                {errors.quoteVersionId && (
                  <p className="text-red-500 text-sm mt-1">{errors.quoteVersionId}</p>
                )}
              </div>

              {/* 测量师选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">测量师</label>
                <select
                  value={formData.surveyorId}
                  onChange={(e) => handleSelectChange('surveyorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">暂不分配</option>
                  {/* 这里应该从API获取测量师列表，暂时使用模拟数据 */}
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

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-2">
                <PaperButton variant="outline" type="button" onClick={() => router.push('/orders/measurements')}>
                  取消
                </PaperButton>
                <PaperButton
                  variant="primary"
                  type="submit"
                  disabled={createMeasurementMutation.isPending}
                >
                  {createMeasurementMutation.isPending ? '创建中...' : '创建测量单'}
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
