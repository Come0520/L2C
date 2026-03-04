import { api } from './api'

export const customerService = {
    /**
     * 客户提交安装验收
     * POST /api/miniprogram/orders/:id/install-accept
     */
    async acceptInstallation(orderId: string, data: { signatureUrl: string; photoUrls: string[] }) {
        return api.post<{ success: boolean; orderId: string }>(`/orders/${orderId}/install-accept`, { data })
    },

    /**
     * 这里预留给之后的 refer-share 获取推广数据
     * GET /api/miniprogram/customers/referrals/stats
     */
    async getReferralStats() {
        return api.get<{
            totalReferrals: number
            convertedCustomers: number
            earnedRewards: number
            points: number
        }>('/customers/referrals/stats').then(res => res.data)
    }
}
