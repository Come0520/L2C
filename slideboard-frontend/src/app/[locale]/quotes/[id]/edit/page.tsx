'use client'

import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'
import { quoteService, Quote } from '@/services/quotes.client'

interface QuoteItem {
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    description: string
}

export default function EditQuotePage() {
    const router = useRouter()
    const params = useParams()
    const quoteId = params.id as string

    const [quote, setQuote] = useState<Quote | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState<QuoteItem[]>([])

    useEffect(() => {
        if (quoteId) {
            loadQuote(quoteId)
        }
    }, [quoteId])

    const loadQuote = async (id: string) => {
        try {
            setLoading(true)
            const data = await quoteService.getQuote(id)
            setQuote(data as unknown as Quote)
            
            // Load items from current version
            if (data.currentVersion && data.currentVersion.items) {
                setItems(data.currentVersion.items.map((item: any) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    description: item.description || ''
                })))
            } else {
                setItems([{ productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, description: '' }])
            }
        } catch (_) {
            // Handle error appropriately
        } finally {
            setLoading(false)
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

    const handleSave = async () => {
        if (!quote || !quote.currentVersion) return
        setSaving(true)
        try {
            // Update current version
            await quoteService.updateVersion(quote.currentVersion.id, {
                totalAmount: calculateTotal(),
                items: items.map(item => ({
                    ...item,
                    category: 'standard', // Default category
                    space: 'default' // Default space
                }))
            })

            router.push(`/leads`) // Or back to quote detail
        } catch (_) {
            toast.error('保存报价单失败')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-6 text-center">加载中...</div>
    if (!quote) return <div className="p-6 text-center">报价单不存在</div>

    return (
        <DashboardLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">编辑报价单 - {quote.projectName}</h1>
                    <PaperButton variant="outline" onClick={() => router.back()}>取消</PaperButton>
                </div>

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>报价明细 (版本 {quote.currentVersion?.version})</PaperCardTitle>
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
                    <PaperButton variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存修改'}
                    </PaperButton>
                </div>
            </div>
        </DashboardLayout>
    )
}
