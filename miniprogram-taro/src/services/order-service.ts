import { api } from './api'
import type { PaginationResponse, Order } from '@/types/business'

export const orderService = {
    /**
     * 获取订单列表
     * GET /api/miniprogram/orders
     */
    getOrderList(params: {
        page: number
        limit: number
        status?: string
    }): Promise<PaginationResponse<any>> {
        return api.get('/orders', { data: params }).then(res => res.data)
    },

    /**
     * 获取单个订单详情
     * GET /api/miniprogram/orders/:id
     */
    getOrderDetail(id: string): Promise<Order> {
        return api.get(`/orders/${id}`).then(res => res.data)
    },

    /**
   * 依据报价单直接创建订单
   * POST /api/miniprogram/orders
   */
    createOrder(quoteId: string): Promise<any> {
        return api.post('/orders', { data: { quoteId } }).then(res => res.data)
    },

    /**
     * 提交售后工单
     * POST /api/miniprogram/service/tickets
     */
    createServiceTicket(reqData: {
        orderId: string
        type: string
        description: string
        photos?: string[]
    }): Promise<{ ticketNo: string }> {
        return api.post('/service/tickets', { data: reqData }).then(res => res.data)
    }
}
