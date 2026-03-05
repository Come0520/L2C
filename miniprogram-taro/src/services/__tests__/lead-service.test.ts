/**
 * S-01 lead-service 单元测试
 *
 * @description TDD RED阶段：测试销售端线索操作服务的完整行为。
 * 验证跟进记录提交（含下次跟进日期）、线索状态操作等。
 */
import { leadService } from '../lead-service'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'

// Mock Taro 的请求
jest.mock('@tarojs/taro')

describe('leadService — 销售端线索服务', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // 设置已登录状态
        useAuthStore.setState({
            token: 'test-sales-token',
            isLoggedIn: true,
            currentRole: 'sales',
            userInfo: { id: 's1', name: '销售甲', role: 'sales' },
        })
    })

    // =========================================================
    // 跟进记录 — addFollowUp
    // =========================================================

    test('addFollowUp 应向正确端点发送跟进内容', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { id: 'fu-001' } },
        })

        await leadService.addFollowUp('lead-001', {
            content: '客户对方案感兴趣，约下周二上门量尺',
            type: 'PHONE',
        })

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining('/leads/lead-001/followup'),
                data: expect.objectContaining({
                    content: '客户对方案感兴趣，约下周二上门量尺',
                    type: 'PHONE',
                }),
            })
        )
    })

    test('addFollowUp 应将 nextFollowUpDate 正确传递', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { id: 'fu-002' } },
        })

        const nextDate = '2026-03-12'
        await leadService.addFollowUp('lead-001', {
            content: '下次见面讨论报价',
            type: 'VISIT',
            nextFollowUpDate: nextDate,
        })

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    nextFollowUpDate: '2026-03-12',
                }),
            })
        )
    })

    test('addFollowUp 不传 nextFollowUpDate 时不应产生错误', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { id: 'fu-003' } },
        })

        // 不传 nextFollowUpDate — 应正常工作
        const result = await leadService.addFollowUp('lead-001', {
            content: '仅电话跟进',
            type: 'PHONE',
        })

        expect(result).toBeDefined()
    })

    // =========================================================
    // 线索操作 — release / claim / void
    // =========================================================

    test('releaseLead 应向 /leads/:id/release 发送 POST 请求', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { success: true } },
        })

        await leadService.releaseLead('lead-002')

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining('/leads/lead-002/release'),
            })
        )
    })

    test('claimLead 应向 /leads/:id/claim 发送 POST 请求', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { success: true } },
        })

        await leadService.claimLead('lead-003')

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining('/leads/lead-003/claim'),
            })
        )
    })

    test('voidLead 应传递 reason 参数', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { success: true } },
        })

        const reason = '客户明确拒绝，无意向'
        await leadService.voidLead('lead-004', reason)

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining('/leads/lead-004/void'),
                data: { reason },
            })
        )
    })

    // =========================================================
    // 详情查询 — getLeadDetail
    // =========================================================

    test('getLeadDetail 应返回线索对象', async () => {
        const mockLead = {
            id: 'lead-001',
            name: '张三',
            phone: '13800000001',
            status: 'FOLLOW_UP',
            intentionLevel: 'HIGH',
        }

            ; (Taro.request as jest.Mock).mockResolvedValue({
                statusCode: 200,
                data: { data: mockLead },
            })

        const result = await leadService.getLeadDetail('lead-001')

        expect(result).toEqual(mockLead)
        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: expect.stringContaining('/leads/lead-001'),
            })
        )
    })

    test('getLeadFollowUps 应返回跟进记录数组', async () => {
        const mockFollowUps = [
            { id: 'f1', content: '初次电话联系', type: 'PHONE', createdAt: '2026-03-01' },
            { id: 'f2', content: '上门量尺完成', type: 'VISIT', createdAt: '2026-03-03' },
        ]

            ; (Taro.request as jest.Mock).mockResolvedValue({
                statusCode: 200,
                data: { data: mockFollowUps },
            })

        const result = await leadService.getLeadFollowUps('lead-001')

        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(2)
        expect(result[0].type).toBe('PHONE')
    })
})
