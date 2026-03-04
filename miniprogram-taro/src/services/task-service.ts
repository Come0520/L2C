import { api } from './api'
import type { MeasureTask, InstallTask, TasksListResponse } from '@/types/business'

export const taskService = {
    /**
     * 获取任务列表
     * GET /api/miniprogram/tasks
     * @param type 'measure' | 'install' | 'all'
     * @param status 任务状态过滤
     */
    getTaskList(params: {
        type?: 'measure' | 'install' | 'all'
        status?: string
    }): Promise<TasksListResponse> {
        return api.get('/tasks', { data: params }).then(res => res.data)
    },

    /**
     * 获取单条任务详情
     * GET /api/miniprogram/tasks/:id
     */
    getTaskDetail(id: string, type: 'measure' | 'install'): Promise<MeasureTask | InstallTask> {
        return api.get(`/tasks/${id}`, { data: { type } }).then(res => res.data)
    },

    /**
     * 师傅打卡
     * POST /api/miniprogram/tasks/:id/check-in
     */
    checkIn(id: string, location: { latitude: number; longitude: number; address?: string }): Promise<any> {
        return api.post(`/tasks/${id}/check-in`, { data: location }).then(res => res.data)
    },

    /**
     * 提交流量尺数据
     * POST /api/miniprogram/tasks/:id/measure-data
     */
    submitMeasureData(id: string, reqData: any): Promise<any> {
        return api.post(`/tasks/${id}/measure-data`, { data: reqData }).then(res => res.data)
    },

    /**
     * 工单议价/接单/拒单操作
     * API: POST /miniprogram/tasks/:id/negotiate
     */
    async negotiateTask(id: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', params?: { price?: string; reason?: string }) {
        return api.post<{ success: boolean; action: string }>(`/tasks/${id}/negotiate`, {
            data: { action, ...params }
        })
    },

    /**
     * 量尺数据销售端复核/申诉
     * API: POST /miniprogram/tasks/:id/measure-verify
     */
    async verifyMeasureData(id: string, action: 'APPROVE' | 'DISPUTE', disputeReason?: string) {
        return api.post<{ success: boolean; action: string }>(`/tasks/${id}/measure-verify`, {
            data: { action, disputeReason }
        })
    }
}
