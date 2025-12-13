'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { useCreateInstallation } from '@/hooks/useInstallations'
import { CreateInstallationRequest } from '@/types/installation'

export default function CreateInstallationPage() {
  const router = useRouter()

  // 表单数据
  const [formData, setFormData] = useState<CreateInstallationRequest>({
    salesOrderId: '',
    scheduledAt: '',
    installerId: '',
    appointmentTimeSlot: '',
    estimatedDuration: 0,
    installationContact: '',
    installationPhone: '',
    installationAddress: '',
    environmentRequirements: {
      powerSupply: false,
      waterSupply: false,
      ventilation: false,
      lighting: false,
      other: ''
    },
    requiredTools: [],
    requiredMaterials: []
  })

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 创建安装单的mutation
  const createInstallationMutation = useCreateInstallation()

  // Wrapper to handle success/error for the form
  const handleCreate = (data: CreateInstallationRequest) => {
    createInstallationMutation.mutate(data, {
      onSuccess: () => {
        router.push('/orders/installations')
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : '创建安装单失败'
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

    if (!formData.salesOrderId) {
      newErrors.salesOrderId = '请选择销售单'
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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">创建安装单</h1>
            <p className="text-ink-500 mt-1">填写安装单信息，创建新的安装单</p>
          </div>
          <PaperButton variant="outline" onClick={() => router.push('/orders/installations')}>
            返回列表
          </PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>安装单信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 销售单选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">销售单</label>
                <select
                  value={formData.salesOrderId}
                  onChange={(e) => handleSelectChange('salesOrderId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择销售单</option>
                  {/* 这里应该从API获取销售单列表，暂时使用模拟数据 */}
                  <option value="1">销售单1</option>
                  <option value="2">销售单2</option>
                  <option value="3">销售单3</option>
                </select>
                {errors.salesOrderId && (
                  <p className="text-red-500 text-sm mt-1">{errors.salesOrderId}</p>
                )}
              </div>

              {/* 安装师选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">安装师</label>
                <select
                  value={formData.installerId}
                  onChange={(e) => handleSelectChange('installerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">暂不分配</option>
                  {/* 这里应该从API获取安装师列表，暂时使用模拟数据 */}
                  <option value="1">安装师张三</option>
                  <option value="2">安装师李四</option>
                  <option value="3">安装师王五</option>
                </select>
              </div>

              {/* 计划安装时间 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">计划安装时间</label>
                <PaperInput
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  placeholder="选择计划安装时间"
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-2">
                <PaperButton variant="outline" type="button" onClick={() => router.push('/orders/installations')}>
                  取消
                </PaperButton>
                <PaperButton
                  variant="primary"
                  type="submit"
                  disabled={createInstallationMutation.isPending}
                >
                  {createInstallationMutation.isPending ? '创建中...' : '创建安装单'}
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
  )
}
