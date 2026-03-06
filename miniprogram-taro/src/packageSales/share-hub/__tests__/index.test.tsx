/**
 * share-hub 分享拓客测试
 *
 * 测试策略：
 * - T1-T4：分享按钮交互（原有测试保留）
 * - T5-T7：API 对接 — 从真实接口加载我的分享链接列表
 *
 * 注意：Taro.shareAppMessage 是微信扩展 API，不在 TaroStatic 类型中，
 * 测试中统一使用 (Taro as any).shareAppMessage 访问。
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import ShareHubPage from '../index'

// ─── Mock 依赖 ──────────────────────────────────────
const mockUseAuthStore = jest.fn()
jest.mock('@/stores/auth', () => ({
    useAuthStore: (...args: any[]) => mockUseAuthStore(...args),
}))

const mockApiGet = jest.fn()
jest.mock('@/services/api', () => ({
    api: {
        get: (...args: any[]) => mockApiGet(...args),
        post: jest.fn(),
    },
}))

// ─── useLoad 捕获 ────────────────────────────────────
let capturedUseLoadCallback: ((params?: any) => void) | null = null

/** 取得 shareAppMessage mock 实例（绕过 TS 类型限制） */
const getShareMock = () => (Taro as any).shareAppMessage as jest.Mock

// ─── 默认 mock 数据 ──────────────────────────────────
const MOCK_SALES_USER = {
    id: 'sales-001',
    name: '张销售',
    tenantId: 'tenant-001',
    tenantName: '丽家装饰',
    role: 'SALES',
}

const MOCK_SHARE_LINKS = [
    { id: 'link-001', title: '2026 窗帘流行趋势大盘点', totalViews: 1205, totalDuration: 320, createdAt: new Date().toISOString() },
    { id: 'link-002', title: '星河湾 180平极简原木风全案', totalViews: 890, totalDuration: 180, createdAt: new Date().toISOString() },
]

describe('ShareHubPage — 分享拓客', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        // 默认：用户已登录（销售员）
        mockUseAuthStore.mockImplementation((selector: any) => {
            if (typeof selector === 'function') {
                return selector({ userInfo: MOCK_SALES_USER })
            }
            return { userInfo: MOCK_SALES_USER }
        })

            // useLoad 捕获
            ; (useLoad as jest.Mock).mockImplementation((cb: any) => {
                capturedUseLoadCallback = cb
            })

            // showActionSheet 默认触发 tapIndex = 0（发送给朋友）
            ; (Taro.showActionSheet as jest.Mock).mockImplementation(({ success }) => {
                success({ tapIndex: 0 })
            })

        // 默认 API 返回
        mockApiGet.mockResolvedValue({
            success: true,
            data: MOCK_SHARE_LINKS,
        })
    })

    /** 渲染并触发 useLoad */
    const renderAndLoad = async (params: any = {}) => {
        const utils = render(<ShareHubPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await (capturedUseLoadCallback as Function)(params)
            })
        }
        return utils
    }

    // ─── T1-T4：原有分享功能测试 ─────────────────────────
    it('T1: 点击"分享拓客"后，应调用 Taro.showActionSheet', async () => {
        await renderAndLoad()

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
        await renderAndLoad()

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(getShareMock()).toHaveBeenCalled()
    })

    it('T3: shareAppMessage 的 path 应包含 salesId 和 tenantId', async () => {
        await renderAndLoad()

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

        await renderAndLoad()

        const shareBtn = screen.getAllByText('分享拓客')[0]
        await act(async () => {
            fireEvent.click(shareBtn)
        })

        expect(getShareMock()).not.toHaveBeenCalled()
    })

    // ─── T5-T7：API 对接测试（TDD Red → Green）──────────
    it('T5: 页面加载时应调用 /showroom/share/my-links 接口', async () => {
        await renderAndLoad()

        expect(mockApiGet).toHaveBeenCalledWith(
            '/showroom/share/my-links',
            expect.anything()
        )
    })

    it('T6: API 返回的分享链接标题应渲染到列表中', async () => {
        await renderAndLoad()

        await waitFor(() => {
            expect(screen.getByText('2026 窗帘流行趋势大盘点')).toBeTruthy()
            expect(screen.getByText('星河湾 180平极简原木风全案')).toBeTruthy()
        })
    })

    it('T7: 每条分享链接应显示浏览次数', async () => {
        await renderAndLoad()

        await waitFor(() => {
            // 检查浏览量数字是否渲染
            expect(screen.getByText(/1205/)).toBeTruthy()
        })
    })
})
