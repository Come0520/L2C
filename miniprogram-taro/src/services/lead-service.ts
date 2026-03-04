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
     * GET /api/miniprogram/leads/:id/follow-ups
     */
    getLeadFollowUps(id: string): Promise<any[]> {
        // 后端可能对应的路由是 /leads/:id/follow-ups 或 /leads/:id/followup
        // 根据实施方案和实际接口调用，我们使用实际的 followup 路径
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
        return api.post(`/leads/${id}/follow-ups`, { data: params }).then(res => res.data)
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
    }
}
