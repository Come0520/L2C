import { api } from './api'
import type { EarningsSummary } from '@/types/business'

export const engineerService = {
    /**
     * 获取工长结算/收入面板
     * GET /api/miniprogram/engineer/earnings
     */
    getEarnings(): Promise<EarningsSummary> {
        return api.get('/engineer/earnings').then(res => res.data)
    },

    /**
     * 获取当前租户下待接单的抢单池任务列表
     * API: GET /miniprogram/engineer/tasks/biddable
     */
    async getBiddableTasks() {
        return api.get<any[]>('/engineer/tasks/biddable')
    },

    /**
     * 获取某段时间内的工程师排期
     * API: GET /miniprogram/engineer/schedule
     */
    async getSchedule(startDate: string, endDate: string) {
        return api.get<{ tasks: any[] }>('/engineer/schedule', {
            params: { startDate, endDate }
        })
    }
} 
