/**
 * useViewTimer + useShareReport Hooks 测试（TDD）
 *
 * useViewTimer：记录客户在当前页面的停留时长（秒）
 * useShareReport：离开页面时自动调用 POST /showroom/share/view-stats 上报
 */
import { renderHook, act } from '@testing-library/react'

// ─── Mock 依赖 ──────────────────────────────────────
const mockApiPost = jest.fn()
jest.mock('@/services/api', () => ({
    api: {
        post: (...args: any[]) => mockApiPost(...args),
    },
}))

import { useViewTimer } from '../useViewTimer'
import { useShareReport } from '../useShareReport'

// ─── useViewTimer tests ──────────────────────────────
describe('useViewTimer — 停留时间计时器', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('T1: 初始时 elapsed 为 0', () => {
        const { result } = renderHook(() => useViewTimer())
        expect(result.current.elapsed).toBe(0)
    })

    it('T2: 3 秒后 elapsed 应为 3', () => {
        const { result } = renderHook(() => useViewTimer())

        act(() => {
            jest.advanceTimersByTime(3000)
        })

        expect(result.current.elapsed).toBe(3)
    })

    it('T3: pause 后计时器停止增长', () => {
        const { result } = renderHook(() => useViewTimer())

        act(() => {
            jest.advanceTimersByTime(2000)
        })

        act(() => {
            result.current.pause()
        })

        act(() => {
            jest.advanceTimersByTime(3000)
        })

        // 暂停后应仍然是 2 秒（不增长）
        expect(result.current.elapsed).toBe(2)
    })

    it('T4: getElapsed 返回当前累计秒数', () => {
        const { result } = renderHook(() => useViewTimer())

        act(() => {
            jest.advanceTimersByTime(5000)
        })

        expect(result.current.getElapsed()).toBe(5)
    })
})

// ─── useShareReport tests ────────────────────────────
describe('useShareReport — 上报停留时长', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('T5: report(shareId, duration) 应调用 POST /showroom/share/view-stats', async () => {
        mockApiPost.mockResolvedValueOnce({ success: true, data: {} })

        const { result } = renderHook(() => useShareReport())

        await act(async () => {
            await result.current.report('share-001', 120)
        })

        expect(mockApiPost).toHaveBeenCalledWith(
            '/showroom/share/view-stats',
            expect.objectContaining({
                data: expect.objectContaining({
                    shareId: 'share-001',
                    duration: 120,
                }),
            })
        )
    })

    it('T6: duration 为 0 时不发起上报请求', async () => {
        const { result } = renderHook(() => useShareReport())

        await act(async () => {
            await result.current.report('share-001', 0)
        })

        expect(mockApiPost).not.toHaveBeenCalled()
    })

    it('T7: 上报失败时静默处理，不抛出错误', async () => {
        mockApiPost.mockRejectedValueOnce(new Error('网络错误'))

        const { result } = renderHook(() => useShareReport())

        // 不应抛出，安静失败
        await expect(
            act(async () => {
                await result.current.report('share-001', 60)
            })
        ).resolves.not.toThrow()
    })
})
