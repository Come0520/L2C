'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperTextarea, PaperSelect } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'
import { leadService } from '@/services/leads.client'

interface CreateLeadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function CreateLeadDialog({ open, onOpenChange, onSuccess }: CreateLeadDialogProps) {
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
                name: formData.customerName,
                phone: formData.phone,
                projectAddress: formData.projectAddress,
                source: formData.source || 'Manual Entry',
                requirements: formData.requirements ? [formData.requirements] : [],
                budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
                budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined
            })
            if (onSuccess) onSuccess()
            onOpenChange(false)
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

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <PaperCardHeader className="flex flex-row items-center justify-between">
                    <PaperCardTitle>新建线索</PaperCardTitle>
                    <button
                        onClick={() => onOpenChange(false)}
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">项目地址</label>
                        <PaperInput
                            value={formData.projectAddress}
                            onChange={(e) => handleChange('projectAddress', e.target.value)}
                            placeholder="请输入项目地址"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">来源渠道</label>
                            <PaperSelect
                                value={formData.source}
                                onChange={(e) => handleChange('source', e.target.value)}
                                options={[
                                    { value: 'Manual Entry', label: '手动录入' },
                                    { value: 'Referral', label: '转介绍' },
                                    { value: 'Online Ad', label: '线上广告' },
                                    { value: 'Walk In', label: '自然到店' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">预算范围 (万)</label>
                            <div className="flex items-center gap-2">
                                <PaperInput
                                    value={formData.budgetMin}
                                    onChange={(e) => handleChange('budgetMin', e.target.value)}
                                    placeholder="最小"
                                    type="number"
                                />
                                <span>-</span>
                                <PaperInput
                                    value={formData.budgetMax}
                                    onChange={(e) => handleChange('budgetMax', e.target.value)}
                                    placeholder="最大"
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">客户需求</label>
                        <PaperTextarea
                            value={formData.requirements}
                            onChange={(e) => handleChange('requirements', e.target.value)}
                            placeholder="请输入客户具体需求..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <PaperButton variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </PaperButton>
                        <PaperButton onClick={handleSubmit} disabled={loading}>
                            {loading ? '创建中...' : '创建线索'}
                        </PaperButton>
                    </div>
                </PaperCardContent>
            </div>
        </div>
    )
}
