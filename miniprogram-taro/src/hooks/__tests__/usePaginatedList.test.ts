import { renderHook, act } from '@testing-library/react'
import { usePaginatedList } from '../usePaginatedList'
import { api } from '@/services/api'

// 打桩 api.get
jest.mock('@/services/api', () => ({
    api: {
        get: jest.fn()
    }
}))

// 打桩 Taro 生命周期 hooks
jest.mock('@tarojs/taro', () => ({
    useDidShow: jest.fn(),
    usePullDownRefresh: jest.fn(),
    useReachBottom: jest.fn(),
    stopPullDownRefresh: jest.fn()
}))

const mockApiGet = api.get as jest.Mock

describe('usePaginatedList', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('1. 初始状态应为空列表、非加载、有更多', () => {
        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test' })
        )
        expect(result.current.list).toEqual([])
        expect(result.current.loading).toBe(false)
        expect(result.current.hasMore).toBe(true)
        expect(result.current.keyword).toBe('')
    })

    it('2. refresh() 应调用 API 并设置列表数据', async () => {
        mockApiGet.mockResolvedValueOnce({
            success: true,
            data: {
                items: [{ id: 1 }, { id: 2 }],
                pagination: { total: 5 }
            }
        })

        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test' })
        )

        await act(async () => {
            await result.current.refresh()
        })

        expect(mockApiGet).toHaveBeenCalledWith('/test', {
            data: { page: 1, pageSize: 20, keyword: '' }
        })
        expect(result.current.list).toEqual([{ id: 1 }, { id: 2 }])
        // total 5 > current 2 => hasMore = true
        expect(result.current.hasMore).toBe(true)
    })

    it('3. loadMore() 应追加数据到现有列表', async () => {
        // 第一页
        mockApiGet.mockResolvedValueOnce({
            success: true,
            data: {
                items: [{ id: 1 }, { id: 2 }],
                pagination: { total: 3 }
            }
        })

        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test', pageSize: 2 })
        )

        await act(async () => {
            await result.current.refresh()
        })
        expect(result.current.list).toEqual([{ id: 1 }, { id: 2 }])
        expect(result.current.hasMore).toBe(true) // total 3 > current 2

        // 第二页（追加）
        mockApiGet.mockResolvedValueOnce({
            success: true,
            data: {
                items: [{ id: 3 }],
                pagination: { total: 3 }
            }
        })

        await act(async () => {
            await result.current.loadMore()
        })

        expect(mockApiGet).toHaveBeenNthCalledWith(2, '/test', {
            data: { page: 2, pageSize: 2, keyword: '' }
        })
        expect(result.current.list).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
        // total 3 == current 3 => hasMore = false
        expect(result.current.hasMore).toBe(false)
    })

    it('4. 数据不足一页时 hasMore 应为 false', async () => {
        mockApiGet.mockResolvedValueOnce({
            success: true,
            data: {
                items: [{ id: 1 }],
                pagination: { total: 1 }
            }
        })

        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test' })
        )

        await act(async () => {
            await result.current.refresh()
        })

        expect(result.current.hasMore).toBe(false)
    })

    it('5. 加载中时不应重复请求', async () => {
        // 使用一个永远不 resolve 的 Promise 来模拟"正在加载"状态
        mockApiGet.mockReturnValueOnce(new Promise(() => { }))

        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test' })
        )

        // 触发第一次加载(不 await，因为它永远不会 resolve)
        act(() => {
            result.current.refresh()
        })

        // 此时 loading 为 true —— 再次调用应被跳过
        await act(async () => {
            await result.current.loadMore()
        })

        // api.get 仅被调用了 1 次（第二次被 loading 锁拦截）
        expect(mockApiGet).toHaveBeenCalledTimes(1)
    })

    it('6. setKeyword 后 refresh 应携带关键字参数', async () => {
        mockApiGet.mockResolvedValue({
            success: true,
            data: {
                items: [],
                pagination: { total: 0 }
            }
        })

        const { result } = renderHook(() =>
            usePaginatedList({ apiPath: '/test' })
        )

        act(() => {
            result.current.setKeyword('测试关键字')
        })

        expect(result.current.keyword).toBe('测试关键字')

        await act(async () => {
            await result.current.refresh()
        })

        expect(mockApiGet).toHaveBeenCalledWith('/test', {
            data: { page: 1, pageSize: 20, keyword: '测试关键字' }
        })
    })
})
