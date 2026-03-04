import { api } from './api'
import type { Quote } from '@/types/business'

export const quoteService = {
    /**
     * 获取报价单详情
     * GET /api/miniprogram/quotes/:id
     */
    getQuoteDetail(id: string): Promise<Quote> {
        return api.get(`/quotes/${id}`).then(res => res.data)
    },

    /**
     * 客户确认签字
     * POST /api/miniprogram/quotes/:id/confirm
     */
    confirmQuote(id: string, signatureUrl: string): Promise<any> {
        return api.post(`/quotes/${id}/confirm`, { data: { signatureUrl } }).then(res => res.data)
    }
}
