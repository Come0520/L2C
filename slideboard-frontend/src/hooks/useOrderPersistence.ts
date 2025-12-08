import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

import { toast } from '@/components/ui/toast'
import { salesOrderService } from '@/services/salesOrders.client'
import { OrderFormData } from '@/shared/types/order'

/**
 * 订单持久化 Hook
 * 负责草稿保存、加载和订单提交
 */
export function useOrderPersistence(leadId: string, orderId?: string) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    /**
     * 保存草稿到 localStorage
     */
    const saveDraft = useCallback(async (formData: OrderFormData) => {
        setIsSaving(true)
        try {
            localStorage.setItem(`order_draft_${leadId}`, JSON.stringify(formData))
            toast.success('草稿已保存', {
                description: '可随时继续编辑',
                duration: 2000
            })
        } catch {
            toast.error('保存失败', {
                description: '请检查存储空间后重试'
            })
        } finally {
            setIsSaving(false)
        }
    }, [leadId])

    /**
     * 从 localStorage 加载草稿
     */
    const loadDraft = useCallback((): OrderFormData | null => {
        try {
            const draftData = localStorage.getItem(`order_draft_${leadId}`)
            if (draftData) {
                return JSON.parse(draftData)
            }
        } catch {
            toast.error('加载草稿失败', {
                description: '将使用默认数据'
            })
        }
        return null
    }, [leadId])

    /**
     * 提交订单
     */
    const submitOrder = useCallback(async (formData: OrderFormData) => {
        // 验证
        if (!formData.expectedDeliveryTime) {
            toast.error('表单验证失败', {
                description: '请填写期望发货时间'
            })
            return false
        }
        if (formData.totalAmount === 0) {
            toast.error('表单验证失败', {
                description: '订单金额不能为0，请至少添加一个商品'
            })
            return false
        }

        setIsSubmitting(true)
        try {
            // 实际提交到后端
            if (orderId) {
                await salesOrderService.updateSalesOrder(orderId, formData)
                toast.success('订单更新成功', {
                    description: '正在跳转到订单详情...',
                    duration: 2000
                })
            } else {
                await salesOrderService.createSalesOrder(formData)
                toast.success('订单提交成功', {
                    description: '正在跳转到订单详情...',
                    duration: 2000
                })
            }

            // 清除草稿
            localStorage.removeItem(`order_draft_${leadId}`)

            // 跳转到订单状态页
            router.push('/orders/status/draft-sign')
            return true
        } catch (error: any) {
            toast.error(orderId ? '更新失败' : '提交失败', {
                description: error.message || '请检查网络连接后重试',
                action: {
                    label: '重试',
                    onClick: () => submitOrder(formData)
                }
            })
            return false
        } finally {
            setIsSubmitting(false)
        }
    }, [leadId, orderId, router])

    return {
        saveDraft,
        loadDraft,
        submitOrder,
        isSaving,
        isSubmitting
    }
}
