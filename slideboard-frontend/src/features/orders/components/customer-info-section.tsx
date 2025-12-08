'use client'

import React, { useState } from 'react'

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDateTimePicker } from '@/components/ui/paper-date-time-picker'
import { customerPhoneSchema, expectedDeliveryTimeSchema } from '@/schemas/orderSchema'

interface CustomerInfoSectionProps {
    leadNumber: string
    customerName: string
    customerPhone: string
    projectAddress: string
    designer: string
    salesPerson: string
    createTime: string
    expectedDeliveryTime: string
    onDesignerChange?: (value: string) => void
    onSalesPersonChange?: (value: string) => void
    onExpectedDeliveryTimeChange?: (value: string) => void
    onLeadNumberChange?: (value: string) => void
    onCustomerNameChange?: (value: string) => void
    onCustomerPhoneChange?: (value: string) => void
    onProjectAddressChange?: (value: string) => void
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
    leadNumber,
    customerName,
    customerPhone,
    projectAddress,
    designer,
    salesPerson,
    createTime,
    expectedDeliveryTime,
    onDesignerChange,
    onSalesPersonChange,
    onExpectedDeliveryTimeChange,
    onLeadNumberChange,
    onCustomerNameChange,
    onCustomerPhoneChange,
    onProjectAddressChange
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validatePhone = (phone: string) => {
        try {
            customerPhoneSchema.parse(phone)
            setErrors(prev => ({ ...prev, customerPhone: '' }))
        } catch (err: unknown) {
            const message = typeof err === 'object' && err !== null && 'errors' in err
                ? (err as { errors?: Array<{ message?: string }> }).errors?.[0]?.message || ''
                : ''
            setErrors(prev => ({ ...prev, customerPhone: message }))
        }
    }

    const validateDeliveryTime = (time: string) => {
        try {
            expectedDeliveryTimeSchema.parse(time)
            setErrors(prev => ({ ...prev, expectedDeliveryTime: '' }))
        } catch (err: unknown) {
            const message = typeof err === 'object' && err !== null && 'errors' in err
                ? (err as { errors?: Array<{ message?: string }> }).errors?.[0]?.message || ''
                : ''
            setErrors(prev => ({ ...prev, expectedDeliveryTime: message }))
        }
    }

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle level="h4">客户基础信息</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                {/* 第一行：线索编号、客户姓名、客户电话、项目地址 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">线索编号</label>
                        <input
                            type="text"
                            value={leadNumber}
                            onChange={(e) => onLeadNumberChange?.(e.target.value)}
                            className="paper-input w-full"
                            placeholder="请输入线索编号"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">客户姓名</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => onCustomerNameChange?.(e.target.value)}
                            className="paper-input w-full"
                            placeholder="请输入客户姓名"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">客户电话 <span className="text-error-500">*</span></label>
                        <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => {
                                onCustomerPhoneChange?.(e.target.value)
                                validatePhone(e.target.value)
                            }}
                            onBlur={() => validatePhone(customerPhone)}
                            className={`paper-input w-full ${errors.customerPhone ? 'border-error-500 focus:border-error-500' : ''}`}
                            placeholder="请输入客户电话"
                        />
                        {errors.customerPhone && (
                            <p className="text-xs text-error-500 mt-1">{errors.customerPhone}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">项目地址</label>
                        <input
                            type="text"
                            value={projectAddress}
                            onChange={(e) => onProjectAddressChange?.(e.target.value)}
                            className="paper-input w-full"
                            placeholder="请输入项目地址"
                        />
                    </div>
                </div>

                {/* 第二行：设计师、导购、开单时间、期望发货时间 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">设计师</label>
                        <input
                            type="text"
                            value={designer}
                            onChange={(e) => onDesignerChange?.(e.target.value)}
                            className="paper-input w-full"
                            placeholder="请输入设计师"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">导购</label>
                        <input
                            type="text"
                            value={salesPerson}
                            onChange={(e) => onSalesPersonChange?.(e.target.value)}
                            className="paper-input w-full"
                            placeholder="请输入导购"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-600 mb-1">开单时间</label>
                        <div className="px-3 py-2 bg-paper-300 border border-paper-600 rounded-md text-ink-700">
                            {createTime}
                        </div>
                    </div>
                    <div>
                        <PaperDateTimePicker
                            label="期望发货时间"
                            value={expectedDeliveryTime}
                            onChange={(value) => {
                                onExpectedDeliveryTimeChange?.(value)
                                validateDeliveryTime(value)
                            }}
                            format="date"
                            required
                            className={`${errors.expectedDeliveryTime ? 'border-error-500 focus:border-error-500' : ''}`}
                        />
                        {errors.expectedDeliveryTime && (
                            <p className="text-xs text-error-500 mt-1">{errors.expectedDeliveryTime}</p>
                        )}
                    </div>
                </div>
            </PaperCardContent>
        </PaperCard>
    )
}
