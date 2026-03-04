import { api } from './api'
import type { Lead, PaginationResponse } from '@/types/business'

export const leadService = {
    /**
     * 获取线索列表（带分页）
     * GET /api/miniprogram/leads
     */
    getLeadList(params: {
        page: number
        pageSize: number
        search?: string
        salesId?: 'ME' | 'UNASSIGNED' | string
        status?: string
        intentionLevel?: string
    }): Promise<PaginationResponse<Lead>> {
        return api.get('/leads', { data: params }).then(res => res.data)
    },

    /**
     * 获取单条线索详情
     * GET /api/miniprogram/leads/:id
     */
    getLeadDetail(id: string): Promise<Lead> {
        return api.get(`/leads/${id}`).then(res => res.data)
    },

    /**
     * 获取指定线索的跟进记录
     * GET /api/miniprogram/leads/:id/followup
     */
    getLeadFollowUps(id: string): Promise<any[]> {
        return api.get(`/leads/${id}/followup`).then(res => res.data)
    },

    /**
     * 新增跟进记录
     * POST /api/miniprogram/leads/:id/followup
     */
    addFollowUp(id: string, params: {
        content: string
        type: string
        nextFollowUpDate?: string
    }): Promise<any> {
        return api.post(`/leads/${id}/followup`, { data: params }).then(res => res.data)
    },

    /**
     * 认领线索
     * POST /api/miniprogram/leads/:id/claim
     */
    claimLead(id: string): Promise<any> {
        return api.post(`/leads/${id}/claim`).then(res => res.data)
    },

    /**
     * 释放线索到公海池
     * POST /api/miniprogram/leads/:id/release
     */
    releaseLead(id: string): Promise<any> {
        return api.post(`/leads/${id}/release`).then(res => res.data)
    },

    /**
     * 作废线索
     * POST /api/miniprogram/leads/:id/void
     */
    voidLead(id: string, reason: string): Promise<any> {
        return api.post(`/leads/${id}/void`, { data: { reason } }).then(res => res.data)
    },

    /**
     * 线索转客户 (后端对应的 API)
     * POST /api/miniprogram/leads/:id/convert
     */
    convertLead(id: string): Promise<any> {
        return api.post(`/leads/${id}/convert`).then(res => res.data)
    }
}
