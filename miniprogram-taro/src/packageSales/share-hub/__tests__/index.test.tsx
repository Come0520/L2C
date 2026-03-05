/**
 * share-hub 分享拓客测试
 *
 * 测试策略：RED 阶段 — 验证分享按钮调用 shareAppMessage 并携带
 * 包含 salesId 和 tenantId 的追踪链接。
 *
 * 注意：Taro.shareAppMessage 是微信扩展 API，不在 TaroStatic 类型中，
 * 测试中统一使用 (Taro as any).shareAppMessage 访问。
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro from '@tarojs/taro'
import ShareHubPage from '../index'

// Mock auth store
jest.mock('@/stores/auth', () => ({
    useAuthStore: jest.fn(),
}))

import { useAuthStore } from '@/stores/auth'

/** 取得 shareAppMessage mock 实例（绕过 TS 类型限制） */
const getShareMock = () => (Taro as any).shareAppMessage as jest.Mock

describe('ShareHubPage — 分享拓客', () => {
    beforeEach(() => {
        jest.clearAllMocks()

            // 默认：用户已登录，携带销售员和租户信息
            ; (useAuthStore as jest.Mock).mockImplementation((selector: any) =>
                selector({
                    userInfo: {
                        id: 'sales-001',
                        name: '张销售',
                        tenantId: 'tenant-001',
                        tenantName: '丽家装饰',
                        role: 'sales',
                    },
                })
            )

            // showActionSheet 默认触发 tapIndex = 0（发送给朋友）
            ; (Taro.showActionSheet as jest.Mock).mockImplementation(({ success }) => {
                success({ tapIndex: 0 })
            })
    })

    it('T1: 点击"分享拓客"后，应调用 Taro.showActionSheet', async () => {
        render(<ShareHubPage />)

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(Taro.showActionSheet).toHaveBeenCalledWith(
            expect.objectContaining({
                itemList: expect.arrayContaining(['发送给朋友 (追踪线索)']),
            })
        )
    })

    it('T2: 选择"发送给朋友"后，应调用 shareAppMessage', async () => {
        render(<ShareHubPage />)

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(getShareMock()).toHaveBeenCalled()
    })

    it('T3: shareAppMessage 的 path 应包含 salesId 和 tenantId', async () => {
        render(<ShareHubPage />)

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(getShareMock()).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringContaining('salesId=sales-001'),
            })
        )
        expect(getShareMock()).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringContaining('tenantId=tenant-001'),
            })
        )
    })

    it('T4: 选择"生成专属海报"后，不应调用 shareAppMessage', async () => {
        // 模拟：tapIndex = 1（生成海报）
        ; (Taro.showActionSheet as jest.Mock).mockImplementation(({ success }) => {
            success({ tapIndex: 1 })
        })

        render(<ShareHubPage />)

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(getShareMock()).not.toHaveBeenCalled()
    })
})
