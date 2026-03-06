/**
 * useShareReport — 展厅分享浏览统计上报
 *
 * @description 提供 report(shareId, duration) 方法，
 * 向 POST /showroom/share/view-stats 提交客户停留数据。
 * duration ≤ 0 时跳过上报，失败时静默处理。
 *
 * @example
 * ```tsx
 * const { report } = useShareReport()
 * const { getElapsed } = useViewTimer()
 *
 * useDidHide(async () => {
 *   await report(shareId, getElapsed())
 * })
 * ```
 */
import { useCallback } from 'react'
import { api } from '@/services/api'
import { Logger } from '@/utils/logger'

export interface UseShareReportReturn {
    /** 上报浏览统计 */
    report: (shareId: string, duration: number) => Promise<void>
}

export function useShareReport(): UseShareReportReturn {
    const report = useCallback(async (shareId: string, duration: number) => {
        // duration ≤ 0 时不上报（无意义数据）
        if (!shareId || duration <= 0) return

        try {
            await api.post('/showroom/share/view-stats', {
                data: {
                    shareId,
                    duration,
                },
            })
        } catch (err: any) {
            // 静默处理，不影响用户体验
            Logger.warn('useShareReport', '停留时间上报失败', err instanceof Error ? err : new Error(String(err)))
        }
    }, [])

    return { report }
}
