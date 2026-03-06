/**
 * capsule 展厅分享设置页测试（TDD）
 *
 * 测试对象：分享内容获取 + visitorUserId 身份锁定 + SHARE_LOCKED 提示
 *
 * useLoad mock 模式参考：acceptance/__tests__/index.test.tsx
 * — 捕获 callback 后在 renderAndLoad 中手动触发
 */
import { render, screen, act, waitFor } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'

// ─── Mock 依赖 ──────────────────────────────────────
const mockUseAuthStore = jest.fn()
jest.mock('@/stores/auth', () => ({
    useAuthStore: (...args: any[]) => mockUseAuthStore(...args),
}))

const mockApiPost = jest.fn()
const mockApiGet = jest.fn()
jest.mock('@/services/api', () => ({
    api: {
        post: (...args: any[]) => mockApiPost(...args),
        get: (...args: any[]) => mockApiGet(...args),
    },
}))

import CapsulePage from '../index'

// ─── 捕获 useLoad 回调 ───────────────────────────────
let capturedUseLoadCallback: ((params: any) => void) | null = null

// ─── 测试常量 ────────────────────────────────────────
const MOCK_USER = {
    id: 'visitor-001',
    name: '客户小王',
    tenantId: 'tenant-001',
    role: 'customer',
    avatarUrl: 'https://example.com/avatar.jpg',
    tenantName: '测试企业',
}

describe('CapsulePage — visitorUserId 传参 + 锁定提示', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        // 默认已登录用户
        mockUseAuthStore.mockImplementation((selector: any) => {
            if (typeof selector === 'function') {
                return selector({ userInfo: MOCK_USER })
            }
            return { userInfo: MOCK_USER }
        })

            // 捕获 useLoad callback（标准模式）
            ; (useLoad as jest.Mock).mockImplementation((cb: any) => {
                capturedUseLoadCallback = cb
            })

        // Mock Taro UI 方法
        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.showToast = jest.fn()
        Taro.showModal = jest.fn()
        Taro.navigateBack = jest.fn()
        Taro.setClipboardData = jest.fn()
    })

    /** 渲染并手动触发 useLoad */
    const renderAndLoad = async (params: Record<string, string> = { shareId: 'share-001', mode: 'view' }) => {
        const utils = render(<CapsulePage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await (capturedUseLoadCallback as Function)(params)
            })
        }
        return utils
    }

    // ─────────────────────────────────────────────────────
    it('T1: 客户端打开分享时应带上 visitorUserId 调用 getShareContent', async () => {
        mockApiPost.mockResolvedValueOnce({
            success: true,
            data: {
                expired: false,
                items: [{ id: 'item-001', title: '测试商品', coverUrl: 'https://example.com/img.jpg' }],
                allowCustomerShare: false,
            },
        })

        await renderAndLoad({ shareId: 'share-001', mode: 'view' })

        expect(mockApiPost).toHaveBeenCalledWith(
            '/showroom/share/content',
            expect.objectContaining({
                data: expect.objectContaining({
                    shareId: 'share-001',
                    visitorUserId: 'visitor-001',
                }),
            })
        )
    })

    it('T2: SHARE_LOCKED 错误应展示"访问受限"弹窗', async () => {
        mockApiPost.mockResolvedValueOnce({
            success: false,
            error: '该链接仅限指定客户访问',
            data: null,
        })

        await renderAndLoad({ shareId: 'share-001', mode: 'view' })

        expect(Taro.showModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '访问受限',
                showCancel: false,
            })
        )
    })

    it('T3: 正常获取内容后应渲染分享标题', async () => {
        mockApiPost.mockResolvedValueOnce({
            success: true,
            data: {
                expired: false,
                items: [{ id: 'item-001', title: '春晓雅筑现代极简全屋整装', coverUrl: 'https://example.com/img.jpg' }],
                allowCustomerShare: false,
            },
        })

        await renderAndLoad({ shareId: 'share-001', mode: 'view' })

        await waitFor(() => {
            expect(screen.getAllByText('春晓雅筑现代极简全屋整装').length).toBeGreaterThan(0)
        })
    })

    it('T4: 分享已过期应展示"链接已过期"弹窗', async () => {
        mockApiPost.mockResolvedValueOnce({
            success: true,
            data: {
                expired: true,
                items: [],
                allowCustomerShare: false,
            },
        })

        await renderAndLoad({ shareId: 'share-001', mode: 'view' })

        expect(Taro.showModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '链接已过期',
                showCancel: false,
            })
        )
    })
})
