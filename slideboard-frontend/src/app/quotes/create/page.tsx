'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'
import { leadService } from '@/services/leads.client'
import { quoteService } from '@/services/quotes.client'
import { LeadItem } from '@/types/lead'

interface QuoteItem {
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    description: string
}

export default function CreateQuotePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const leadId = searchParams.get('leadId')
    const fromVersion = searchParams.get('fromVersion')

    const [lead, setLead] = useState<LeadItem | null>(null)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<QuoteItem[]>([
        { productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, description: '' }
    ])

    useEffect(() => {
        if (leadId) {
            loadLead(leadId)
            if (fromVersion) {
                loadFromVersion(leadId, Number(fromVersion))
            }
        }
    }, [leadId, fromVersion])

    const loadFromVersion = async (leadId: string, versionNum: number) => {
        try {
            const quotes = await quoteService.getQuotesByLead(leadId)
            // Try to find a version matching the number in any quote, prefer latest quote
            for (const quote of quotes) {
                const version = quote.versions.find((v: any) => v.version === versionNum)
                if (version) {
                    // Found it
                     setItems(version.items.map((item: any) => ({
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        description: item.description || ''
                    })))
                    return
                }
            }
        } catch (_) {
        }
    }

    const loadLead = async (id: string) => {
        try {
            const leadData = await leadService.getLeadById(id)
            setLead(leadData)
        } catch {
            toast.error('加载线索失败')
        }
    }

    const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...items]
        const updatedItem = { ...newItems[index], [field]: value } as QuoteItem
        
        // Recalculate total price if quantity or unitPrice changed
        if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
        }

        newItems[index] = updatedItem
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, { productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, description: '' }])
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0)
    }

    const handleSubmit = async () => {
        if (!leadId) return
        setLoading(true)
        try {
            // 1. Create Quote (Budget Quote)
            await quoteService.createBudgetQuote(leadId, {
                projectName: `${lead?.customerName || '客户'}的报价单`,
                projectAddress: lead?.projectAddress || '',
                salesPerson: lead?.currentOwner?.name || 'Unknown',
                status: 'draft',
                items: items.map(item => ({
                    ...item,
                    category: 'standard', // Default category
                    space: 'default' // Default space
                }))
            })

            router.push(`/leads`) // Go back to leads or quote detail
        } catch {
            // Handle error appropriately
            toast.error('创建报价单失败')
        } finally {
            setLoading(false)
        }
    }

    if (!leadId) return <div>Missing Lead ID</div>

    return (
        <DashboardLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">创建报价单</h1>
                    <PaperButton variant="outline" onClick={() => router.back()}>取消</PaperButton>
                </div>

                {lead && (
                    <PaperCard>
                        <PaperCardHeader>
                            <PaperCardTitle>客户信息</PaperCardTitle>
                        </PaperCardHeader>
                        <PaperCardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">客户姓名</label>
                                    <div className="font-medium">{lead.customerName}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">联系电话</label>
                                    <div className="font-medium">{lead.phone}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">项目地址</label>
                                    <div className="font-medium">{lead.projectAddress}</div>
                                </div>
                            </div>
                        </PaperCardContent>
                    </PaperCard>
                )}

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>报价明细</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-end border-b pb-4">
                                    <div className="flex-1">
                                        <label className="text-sm mb-1 block">产品名称</label>
                                        <PaperInput
                                            value={item.productName}
                                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                            placeholder="输入产品名称"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-sm mb-1 block">数量</label>
                                        <PaperInput
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm mb-1 block">单价</label>
                                        <PaperInput
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                            prefix="¥"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm mb-1 block">总价</label>
                                        <div className="h-10 flex items-center font-medium">
                                            ¥{item.totalPrice.toLocaleString()}
                                        </div>
                                    </div>
                                    <PaperButton variant="ghost" onClick={() => removeItem(index)} className="text-red-500">
                                        删除
                                    </PaperButton>
                                </div>
                            ))}

                            <PaperButton variant="outline" onClick={addItem} className="w-full">
                                + 添加报价项
                            </PaperButton>

                            <div className="flex justify-end pt-4 text-lg font-bold">
                                总计: ¥{calculateTotal().toLocaleString()}
                            </div>
                        </div>
                    </PaperCardContent>
                </PaperCard>

                <div className="flex justify-end gap-4">
                    <PaperButton variant="primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? '提交中...' : '生成报价单'}
                    </PaperButton>
                </div>
            </div>
        </DashboardLayout>
    )
}
