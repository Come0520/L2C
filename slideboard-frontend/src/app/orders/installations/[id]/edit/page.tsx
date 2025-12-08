'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { useInstallation } from '@/hooks/useInstallations'
import { UpdateInstallationRequest } from '@/types/installation'

export default function EditInstallationPage() {
  const params = useParams()
  const router = useRouter()
  const installationId = params.id as string

  // 表单数据
  const [formData, setFormData] = useState<UpdateInstallationRequest>({
    status: 'pending',
    installerId: '',
    scheduledAt: '',
    installationData: undefined,
    completedAt: ''
  })

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取安装单详情和更新方法
  const { installation, isLoading: isLoadingInstallation, updateInstallation } = useInstallation(installationId)

  // 当安装单详情加载完成后，更新表单数据
  useEffect(() => {
    if (installation) {
      setFormData({
        status: installation.status,
        installerId: installation.installerId || '',
        scheduledAt: installation.scheduledAt || '',
        installationData: installation.installationData || undefined,
        completedAt: installation.completedAt || ''
      })
    }
  }, [installation])

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

    // 可以根据需要添加更多验证规则

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await updateInstallation(formData)
        // 跳转到安装单详情页面
        router.push(`/orders/installations/${installationId}`)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '更新安装单失败'
        setErrors({ submit: message })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (isLoadingInstallation) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10">加载中...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!installation) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10 text-red-500">安装单不存在</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">编辑安装单</h1>
            <p className="text-ink-500 mt-1">修改安装单的详细信息</p>
          </div>
          <PaperButton variant="outline" onClick={() => router.push(`/orders/installations/${installationId}`)}>
            返回详情
          </PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>安装单信息</PaperCardTitle>
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
                  <option value="pending">待分配</option>
                  <option value="assigning">分配中</option>
                  <option value="waiting">待安装</option>
                  <option value="installing">安装中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              {/* 安装师选择 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">安装师</label>
                <select
                  value={formData.installerId}
                  onChange={(e) => handleSelectChange('installerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* 这里应该从API获取安装师列表，暂时使用模拟数据 */}
                  <option value="">暂不分配</option>
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

              {/* 安装数据 */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">安装数据（JSON格式）</label>
                <PaperInput
                  type="textarea"
                  name="installationData"
                  value={formData.installationData ? JSON.stringify(formData.installationData, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const value = e.target.value
                      const parsedData = value ? JSON.parse(value) : null
                      setFormData(prev => ({ ...prev, installationData: parsedData }))
                      // 清除错误
                      if (errors.installationData) {
                        setErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.installationData
                          return newErrors
                        })
                      }
                    } catch (_error) {
                      setErrors(prev => ({ ...prev, installationData: '无效的JSON格式' }))
                    }
                  }}
                  placeholder="输入安装数据（JSON格式）"
                  className="min-h-[150px]"
                />
                {errors.installationData && (
                  <p className="text-red-500 text-sm mt-1">{errors.installationData}</p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-2">
                <PaperButton variant="outline" type="button" onClick={() => router.push(`/orders/installations/${installationId}`)}>
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
