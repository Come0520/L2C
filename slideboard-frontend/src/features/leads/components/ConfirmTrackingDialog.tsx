'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperSelect } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'

interface ConfirmTrackingDialogProps {
  isOpen: boolean
  onClose: () => void
  lead: {
    id: string
    customerName: string
    phone: string
    requirements: string[]
    budgetMin: number
    budgetMax: number
  }
  onConfirm: (data: {
    leadId: string
    constructionProgress: string
    areaSize?: number
    budgetAmount?: number
    expectedPurchaseDate: string
    expectedCheckInDate: string
  }) => void
}

const constructionProgressOptions = [
  { value: '', label: '请选择施工进度状态' },
  { value: 'just-signed', label: '刚签' },
  { value: 'plumbing', label: '水电' },
  { value: 'masonry', label: '泥木' },
  { value: 'painting', label: '涂料' },
  { value: 'installation', label: '安装' },
  { value: 'stalled', label: '停滞' }
]

export default function ConfirmTrackingDialog({ isOpen, onClose, lead, onConfirm }: ConfirmTrackingDialogProps) {
  const [constructionProgress, setConstructionProgress] = useState('')
  const [areaSize, setAreaSize] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState('')
  const [expectedCheckInDate, setExpectedCheckInDate] = useState('')

  const handleConfirm = () => {
    if (!constructionProgress) {
      toast.error('请选择施工进度状态')
      return
    }

    if (!expectedPurchaseDate) {
      toast.error('请选择预计购买时间')
      return
    }

    if (!expectedCheckInDate) {
      toast.error('请选择预计入住时间')
      return
    }

    // 验证日期逻辑
    const purchaseDate = new Date(expectedPurchaseDate)
    const checkInDate = new Date(expectedCheckInDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (purchaseDate < today) {
      toast.error('预计购买时间不能早于今天')
      return
    }

    if (checkInDate <= purchaseDate) {
      toast.error('预计入住时间必须晚于预计购买时间')
      return
    }

    onConfirm({
      leadId: lead.id,
      constructionProgress,
      areaSize: areaSize ? parseFloat(areaSize) : undefined,
      budgetAmount: budgetAmount ? parseFloat(budgetAmount) : undefined,
      expectedPurchaseDate,
      expectedCheckInDate
    })

    // 重置表单
    setConstructionProgress('')
    setAreaSize('')
    setBudgetAmount('')
    setExpectedPurchaseDate('')
    setExpectedCheckInDate('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <PaperCardHeader className="flex flex-row items-center justify-between">
          <PaperCardTitle>确认并跟踪 - 信息录入</PaperCardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </PaperCardHeader>
        
        <PaperCardContent className="space-y-6">
          {/* 客户基本信息（只读） */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">客户基本信息（只读）</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">姓名：</span>
                <span className="font-medium text-gray-900">{lead.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">电话：</span>
                <span className="font-medium text-gray-900">{lead.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">需求品类：</span>
                <span className="font-medium text-gray-900">{lead.requirements.join(', ')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">预算范围：</span>
                <span className="font-medium text-gray-900">
                  ¥{lead.budgetMin.toLocaleString()} - ¥{lead.budgetMax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 施工进度状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              施工进度状态 <span className="text-red-500">*</span>
            </label>
            <PaperSelect
              value={constructionProgress}
              onChange={(e) => setConstructionProgress(e.target.value)}
              options={constructionProgressOptions}
            />
          </div>

          {/* 面积大小和预算金额 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">面积大小（㎡）</label>
              <PaperInput
                type="number"
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                placeholder="请输入面积大小"
                min={10}
                max={1000}
              />
              <div className="text-xs text-gray-500 mt-1">范围：10-1000㎡</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预算金额（元）</label>
              <PaperInput
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="请输入预算金额"
                step={0.01}
              />
              <div className="text-xs text-gray-500 mt-1">支持两位小数</div>
            </div>
          </div>

          {/* 预计时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预计购买时间 <span className="text-red-500">*</span>
              </label>
              <PaperInput
                type="date"
                value={expectedPurchaseDate}
                onChange={(e) => setExpectedPurchaseDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预计入住时间 <span className="text-red-500">*</span>
              </label>
              <PaperInput
                type="date"
                value={expectedCheckInDate}
                onChange={(e) => setExpectedCheckInDate(e.target.value)}
                min={expectedPurchaseDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* 操作记录 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">操作记录</h4>
            <div className="text-sm text-blue-700">
              操作人：当前用户 | 操作时间：{new Date().toLocaleString('zh-CN')}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <PaperButton variant="outline" onClick={onClose}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleConfirm}>
              确认提交
            </PaperButton>
          </div>
        </PaperCardContent>
      </div>
    </div>
  )
}
