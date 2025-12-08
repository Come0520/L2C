'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperCheckbox } from '@/components/ui/paper-checkbox'
import { PaperInput } from '@/components/ui/paper-input'
import MeasurementDataEditor from '@/features/orders/components/measurement-data-editor'
import { initialMeasurementData } from '@/features/orders/components/measurement-data-editor/utils'
import { useMeasurementTemplates } from '@/hooks/useMeasurementTemplates'
import { MeasurementData } from '@/types/measurement'

/**
 * 创建测量模板页面
 */
export default function CreateMeasurementTemplatePage() {
  const router = useRouter()
  const { createTemplate, isCreatingTemplate } = useMeasurementTemplates()

  // 表单状态
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [measurementData, setMeasurementData] = useState<MeasurementData>(initialMeasurementData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * 验证表单
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '模板名称不能为空'
    }

    if ((measurementData.rooms || []).length === 0) {
      newErrors.rooms = '至少需要添加一个房间'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // 将 rooms 中的 type 转换为 RoomType 类型
      const formattedRooms = (measurementData.rooms || []).map(room => ({
        ...room,
        type: (room as any).type as 'living-room' | 'bedroom' | 'kitchen' | 'bathroom' | 'other'
      }));

      await createTemplate({
        name,
        description,
        totalArea: measurementData.totalArea || 0,
        rooms: formattedRooms,
        isDefault
      })

      // 导航到模板列表页面
      router.push('/orders/measurements/templates')
    } catch (_) {
      // 这里可以添加错误提示
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">创建测量模板</h1>
            <p className="text-ink-500 mt-1">使用可视化编辑器设计测量模板</p>
          </div>
          <PaperButton variant="outline" onClick={() => router.back()}>返回</PaperButton>
        </div>

        {/* 创建表单 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>模板基本信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 模板名称 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-ink-700">
                    模板名称 <span className="text-red-500">*</span>
                  </label>
                  <PaperInput
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入模板名称"
                    error={errors.name}
                  />
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-ink-700">
                    描述
                  </label>
                  <PaperInput
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请输入模板描述"
                  />
                </div>
              </div>

              {/* 测量数据编辑器 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink-700">
                  模板内容设计 <span className="text-red-500">*</span>
                </label>
                {errors.rooms && (
                  <p className="text-sm text-red-500">{errors.rooms}</p>
                )}
                <div className="border rounded-md p-4 bg-white">
                  <MeasurementDataEditor
                    value={measurementData}
                    onChange={setMeasurementData}
                  />
                </div>
              </div>

              {/* 默认模板选项 */}
              <div className="flex items-center space-x-2">
                <PaperCheckbox
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-ink-700 cursor-pointer">
                  设置为默认模板
                </label>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3">
                <PaperButton variant="outline" type="button" onClick={() => router.back()}>
                  取消
                </PaperButton>
                <PaperButton
                  variant="primary"
                  type="submit"
                  disabled={isCreatingTemplate}
                >
                  {isCreatingTemplate ? '创建中...' : '创建模板'}
                </PaperButton>
              </div>
            </form>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
