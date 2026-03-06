/**
 * useViewTimer — 客户页面停留时长计时器
 *
 * @description 在组件挂载时开始计时，每秒 +1。
 * 提供 pause()（暂停）和 getElapsed()（读取当前秒数）。
 *
 * @example
 * ```tsx
 * const { elapsed, pause, getElapsed } = useViewTimer()
 *
 * // 离开页面时上报
 * useDidHide(() => {
 *   const duration = getElapsed()
 *   report(shareId, duration)
 * })
 * ```
 */
import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseViewTimerReturn {
    /** 已经过的秒数（整数） */
    elapsed: number
    /** 暂停计时器 */
    pause: () => void
    /** 恢复计时器 */
    resume: () => void
    /** 获取当前累计秒数（无需 React state） */
    getElapsed: () => number
}

export function useViewTimer(): UseViewTimerReturn {
    const [elapsed, setElapsed] = useState(0)
    const elapsedRef = useRef(0)
    const pausedRef = useRef(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const start = useCallback(() => {
        if (intervalRef.current) return
        intervalRef.current = setInterval(() => {
            if (!pausedRef.current) {
                elapsedRef.current += 1
                setElapsed(elapsedRef.current)
            }
        }, 1000)
    }, [])

    const pause = useCallback(() => {
        pausedRef.current = true
    }, [])

    const resume = useCallback(() => {
        pausedRef.current = false
    }, [])

    const getElapsed = useCallback(() => {
        return elapsedRef.current
    }, [])

    useEffect(() => {
        start()
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [start])

    return { elapsed, pause, resume, getElapsed }
}
