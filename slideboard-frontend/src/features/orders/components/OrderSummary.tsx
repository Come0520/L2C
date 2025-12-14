'use client'

import { Save, Send, Package } from 'lucide-react'
import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent, PaperCardFooter } from '@/components/ui/paper-card'
import { ProductCategory, PRODUCT_CATEGORY_LABELS } from '@/shared/types/order'

interface OrderSummaryProps {
    subtotals: Record<ProductCategory, number>
    packageAmount?: number
    packageExcessAmount?: number
    upgradeAmount?: number
    totalAmount: number
    onSaveDraft?: () => void
    onSubmit?: () => void
    isSaving?: boolean
    isSubmitting?: boolean
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    subtotals,
    packageAmount,
    packageExcessAmount,
    upgradeAmount,
    totalAmount,
    onSaveDraft,
    onSubmit,
    isSaving = false,
    isSubmitting = false
}) => {
    const hasPackage = packageAmount !== undefined && packageAmount > 0

    return (
        <PaperCard>
            <PaperCardHeader>
                <div className="flex items-center space-x-2">
                    {hasPackage && <Package className="h-5 w-5 text-success-600" />}
                    <PaperCardTitle level="h4">订单汇总</PaperCardTitle>
                </div>
            </PaperCardHeader>
            <PaperCardContent>
                <div className="space-y-3">
                    {/* 套餐金额部分 */}
                    {hasPackage && (
                        <>
                            <div className="flex justify-between items-center py-2 border-b border-success-300 bg-success-50 px-3 rounded-md">
                                <span className="text-success-700 font-medium flex items-center space-x-1">
                                    <Package className="h-4 w-4" />
                                    <span>套餐价格</span>
                                </span>
                                <span className="text-lg font-bold text-success-700">¥{packageAmount.toFixed(2)}</span>
                            </div>

                            {packageExcessAmount && packageExcessAmount > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-warning-300 bg-warning-50 px-3 rounded-md">
                                    <span className="text-warning-700 font-medium">套餐超出部分</span>
                                    <span className="text-lg font-medium text-warning-700">+¥{packageExcessAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {upgradeAmount && upgradeAmount > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-info-300 bg-info-50 px-3 rounded-md">
                                    <span className="text-info-700 font-medium">升级补差价</span>
                                    <span className="text-lg font-medium text-info-700">+¥{upgradeAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* 各类别小计（非套餐品） */}
                    {(Object.keys(subtotals) as ProductCategory[]).map((category) => {
                        const amount = subtotals[category]
                        if (amount === 0) return null

                        return (
                            <div key={category} className="flex justify-between items-center py-2 border-b border-paper-500">
                                <span className="text-ink-600">{PRODUCT_CATEGORY_LABELS[category]}小计</span>
                                <span className="text-lg font-medium text-ink-800">¥{amount.toFixed(2)}</span>
                            </div>
                        )
                    })}

                    {/* 总计 */}
                    <div className="flex justify-between items-center py-3 border-t-2 border-paper-600 mt-2">
                        <span className="text-lg font-bold text-ink-800">总计金额</span>
                        <span className="text-2xl font-bold text-success-600">¥{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </PaperCardContent>
            <PaperCardFooter>
                <div className="flex space-x-3 justify-end">
                    <PaperButton
                        variant="outline"
                        onClick={onSaveDraft}
                        disabled={isSaving || isSubmitting}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? '保存中...' : '保存草稿'}
                    </PaperButton>
                    <PaperButton
                        variant="primary"
                        onClick={onSubmit}
                        disabled={isSaving || isSubmitting}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? '提交中...' : '提交订单'}
                    </PaperButton>
                </div>
            </PaperCardFooter>
        </PaperCard>
    )
}
