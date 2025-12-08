'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperTextarea, PaperSelect } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'
import { leadService } from '@/services/leads.client'

interface CreateLeadDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function CreateLeadDialog({ isOpen, onClose, onSuccess }: CreateLeadDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        projectAddress: '',
        source: '',
        requirements: '',
        budgetMin: '',
        budgetMax: ''
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        if (!formData.customerName || !formData.phone) {
            toast.error('请填写客户姓名和电话')
            return
        }

        setLoading(true)
        try {
            await leadService.createLead({
                customerName: formData.customerName,
                phone: formData.phone,
                projectAddress: formData.projectAddress,
                source: formData.source || 'Manual Entry',
                requirements: formData.requirements ? [formData.requirements] : [],
                budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
                budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined
            })
            onSuccess()
            onClose()
            // Reset form
            setFormData({
                customerName: '',
                phone: '',
                projectAddress: '',
                source: '',
                requirements: '',
                budgetMin: '',
                budgetMax: ''
            })
        } catch (_) {
            toast.error('创建失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <PaperCardHeader className="flex flex-row items-center justify-between">
                    <PaperCardTitle>新建线索</PaperCardTitle>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </PaperCardHeader>

                <PaperCardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
                            <PaperInput
                                value={formData.customerName}
                                onChange={(e) => handleChange('customerName', e.target.value)}
                                placeholder="请输入客户姓名"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                            <PaperInput
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="请输入联系电话"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">项目地址</label>
                            <PaperInput
                                value={formData.projectAddress}
                                onChange={(e) => handleChange('projectAddress', e.target.value)}
                                placeholder="请输入项目地址"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">来源渠道</label>
                            <PaperSelect
                                value={formData.source}
                                onChange={(e) => handleChange('source', e.target.value)}
                                options={[
                                    { label: '自然进店', value: 'Walk-in' },
                                    { label: '老客户推荐', value: 'Referral' },
                                    { label: '线上咨询', value: 'Online' },
                                    { label: '电话咨询', value: 'Phone' },
                                    { label: '其他', value: 'Other' }
                                ]}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">需求描述</label>
                            <PaperTextarea
                                value={formData.requirements}
                                onChange={(e) => handleChange('requirements', e.target.value)}
                                placeholder="请输入客户需求..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">预算下限</label>
                            <PaperInput
                                type="number"
                                value={formData.budgetMin}
                                onChange={(e) => handleChange('budgetMin', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">预算上限</label>
                            <PaperInput
                                type="number"
                                value={formData.budgetMax}
                                onChange={(e) => handleChange('budgetMax', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <PaperButton variant="outline" onClick={onClose}>
                            取消
                        </PaperButton>
                        <PaperButton variant="primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </PaperButton>
                    </div>
                </PaperCardContent>
            </div>
        </div>
    )
}
