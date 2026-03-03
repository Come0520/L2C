import { useState, useRef, useCallback } from 'react'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { api } from '@/services/api'

interface UsePaginatedListOptions {
    /** API 路径（不含 BASE_URL） */
    apiPath: string
    /** 每页数量，默认 20 */
    pageSize?: number
    /** 额外请求参数 */
    extraParams?: Record<string, any>
    /** 是否在 useDidShow 时自动刷新，默认 true */
    autoRefresh?: boolean
}

interface UsePaginatedListReturn<T> {
    /** 列表数据 */
    list: T[]
    /** 是否正在加载 */
    loading: boolean
    /** 是否还有更多数据 */
    hasMore: boolean
    /** 搜索关键字 */
    keyword: string
    /** 设置搜索关键字 */
    setKeyword: (k: string) => void
    /** 刷新列表（重置分页） */
    refresh: () => Promise<void>
    /** 加载更多 */
    loadMore: () => Promise<void>
}

export function usePaginatedList<T>({
    apiPath,
    pageSize = 20,
    extraParams = {},
    autoRefresh = false
}: UsePaginatedListOptions): UsePaginatedListReturn<T> {
    const [list, setList] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [keyword, setKeyword] = useState('')
    const pageRef = useRef(1)

    const fetchList = useCallback(
        async (reset = false, searchKeyword = keyword) => {
            if (loading) return
            const currentPage = reset ? 1 : pageRef.current
            setLoading(true)
            try {
                const res = await api.get(apiPath, {
                    data: {
                        page: currentPage,
                        pageSize,
                        keyword: searchKeyword,
                        ...extraParams
                    }
                })
                if (res.success) {
                    const items = res.data?.items || res.data || []
                    const total = res.data?.pagination?.total || 0

                    const newList = reset ? items : [...list, ...items]
                    setList(newList)
                    pageRef.current = currentPage + 1

                    // 如果返回了 pagination.total，则严格比较
                    // 否则仅依据当前返回的 items 数量是否达到 pageSize 来简单判断
                    if (res.data?.pagination?.total !== undefined) {
                        setHasMore(newList.length < total)
                    } else {
                        setHasMore(items.length >= pageSize)
                    }
                }
            } finally {
                setLoading(false)
            }
        },
        [apiPath, pageSize, keyword, extraParams, list, loading]
    )

    const refresh = useCallback(async () => {
        await fetchList(true, keyword)
    }, [fetchList, keyword])

    const loadMore = useCallback(async () => {
        if (hasMore && !loading) {
            await fetchList()
        }
    }, [hasMore, loading, fetchList])

    useDidShow(() => {
        if (autoRefresh) {
            refresh()
        }
    })

    usePullDownRefresh(() => {
        refresh().then(() => {
            Taro.stopPullDownRefresh()
        })
    })

    useReachBottom(() => {
        loadMore()
    })

    return {
        list,
        loading,
        hasMore,
        keyword,
        setKeyword,
        refresh,
        loadMore
    }
}
