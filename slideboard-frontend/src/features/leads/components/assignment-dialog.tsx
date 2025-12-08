'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperSelect, PaperTextarea } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'

interface AssignmentDialogProps {
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
  onAssign: (data: {
    leadId: string
    assigneeId: string
    method: 'manual' | 'auto'
    reason?: string
  }) => void
}

const mockSalespeople = [
  { id: '1', name: '李销售', region: '朝阳区', currentLoad: 12, specialty: '整体橱柜' },
  { id: '2', name: '王销售', region: '海淀区', currentLoad: 8, specialty: '全屋定制' },
  { id: '3', name: '赵销售', region: '西城区', currentLoad: 15, specialty: '橱柜' },
  { id: '4', name: '张销售', region: '东城区', currentLoad: 10, specialty: '衣柜' }
]

export default function AssignmentDialog({ isOpen, onClose, lead, onAssign }: AssignmentDialogProps) {
  const [assignmentMethod, setAssignmentMethod] = useState<'manual' | 'auto'>('manual')
  const [selectedSalesperson, setSelectedSalesperson] = useState('')
  const [autoAssignCriteria, setAutoAssignCriteria] = useState<'region' | 'load' | 'specialty'>('region')
  const [reason, setReason] = useState('')

  const handleAssign = () => {
    if (assignmentMethod === 'manual' && !selectedSalesperson) {
      toast.error('请选择分配对象')
      return
    }

    onAssign({
      leadId: lead.id,
      assigneeId: assignmentMethod === 'manual' ? selectedSalesperson : '',
      method: assignmentMethod,
      reason: reason.trim()
    })

    // 重置表单
    setSelectedSalesperson('')
    setReason('')
    setAutoAssignCriteria('region')
    onClose()
  }

  const getRecommendedSalespeople = () => {
    switch (autoAssignCriteria) {
      case 'region':
        return mockSalespeople.sort((a, b) => a.region.localeCompare(b.region))
      case 'load':
        return [...mockSalespeople].sort((a, b) => a.currentLoad - b.currentLoad)
      case 'specialty':
        return mockSalespeople.sort((a, b) => {
          const aMatch = a.specialty.includes(lead.requirements[0] || '') ? 0 : 1
          const bMatch = b.specialty.includes(lead.requirements[0] || '') ? 0 : 1
          return aMatch - bMatch
        })
      default:
        return mockSalespeople
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <PaperCardHeader className="flex flex-row items-center justify-between">
          <PaperCardTitle>分配线索</PaperCardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </PaperCardHeader>
        
        <PaperCardContent className="space-y-6">
          {/* 待分配线索信息 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">待分配线索</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">客户姓名：</span>
                <span className="font-medium text-blue-900">{lead.customerName}</span>
              </div>
              <div>
                <span className="text-blue-700">联系电话：</span>
                <span className="font-medium text-blue-900">{lead.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700">需求品类：</span>
                <span className="font-medium text-blue-900">{lead.requirements.join(', ')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700">预算范围：</span>
                <span className="font-medium text-blue-900">
                  ¥{lead.budgetMin.toLocaleString()} - ¥{lead.budgetMax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 分配方式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分配方式</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="manual"
                  checked={assignmentMethod === 'manual'}
                  onChange={(e) => setAssignmentMethod(e.target.value as 'manual' | 'auto')}
                  className="mr-2"
                />
                手动分配
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="auto"
                  checked={assignmentMethod === 'auto'}
                  onChange={(e) => setAssignmentMethod(e.target.value as 'manual' | 'auto')}
                  className="mr-2"
                />
                自动分配
              </label>
            </div>
          </div>

          {/* 手动分配 */}
          {assignmentMethod === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择分配对象</label>
              <PaperSelect
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                options={[
                  { value: '', label: '请选择销售员...' },
                  ...mockSalespeople.map(sp => ({
                    value: sp.id,
                    label: `${sp.name} (${sp.region}) 当前负载：${sp.currentLoad}`
                  }))
                ]}
              />
            </div>
          )}

          {/* 自动分配 */}
          {assignmentMethod === 'auto' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">自动分配规则</label>
                <PaperSelect
                  value={autoAssignCriteria}
                  onChange={(e) => setAutoAssignCriteria(e.target.value as 'region' | 'load' | 'specialty')}
                  options={[
                    { value: 'region', label: '按地域筛选' },
                    { value: 'load', label: '按负载均衡' },
                    { value: 'specialty', label: '按专业匹配' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推荐销售员</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {getRecommendedSalespeople().map((salesperson) => (
                    <label key={salesperson.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="recommendedSalesperson"
                          value={salesperson.id}
                          checked={selectedSalesperson === salesperson.id}
                          onChange={(e) => setSelectedSalesperson(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{salesperson.name}</div>
                          <div className="text-sm text-gray-600">
                            负责{salesperson.region} | 专业{salesperson.specialty} | 当前负载：{salesperson.currentLoad}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {autoAssignCriteria === 'load' && salesperson.currentLoad <= 10 && '推荐'}
                        {autoAssignCriteria === 'region' && salesperson.region === '朝阳区' && '推荐'}
                        {autoAssignCriteria === 'specialty' && lead.requirements.some(req => salesperson.specialty.includes(req)) && '推荐'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 分配说明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分配说明（可选）</label>
            <PaperTextarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入分配说明..."
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <PaperButton variant="outline" onClick={onClose}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleAssign}>
              确认分配
            </PaperButton>
          </div>
        </PaperCardContent>
      </div>
    </div>
  )
}
