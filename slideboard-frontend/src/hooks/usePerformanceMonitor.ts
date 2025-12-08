'use client'

import { useEffect, useRef } from 'react'

// 性能指标类型
interface PerformanceMetrics {
  ttfb?: number // Time to First Byte
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fmp?: number // First Meaningful Paint
  tti?: number // Time to Interactive
  cls?: number // Cumulative Layout Shift
  fid?: number // First Input Delay
  tbt?: number // Total Blocking Time
}

// 性能监控选项
interface PerformanceMonitorOptions {
  reportInterval?: number
  onMetricsReady?: (metrics: PerformanceMetrics) => void
}

/**
 * 性能监控 Hook
 * 用于跟踪和报告关键性能指标
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const { reportInterval = 5000, onMetricsReady } = options
  const metricsRef = useRef<PerformanceMetrics>({})
  const observerRefs = useRef<{
    lcp?: PerformanceObserver
    cls?: PerformanceObserver
    fid?: PerformanceObserver
    tbt?: PerformanceObserver
  }>({})

  // 报告性能数据
  const reportMetrics = () => {
    if (onMetricsReady) {
      onMetricsReady(metricsRef.current)
    }
    // 也可以将数据发送到服务器
    console.log('Performance Metrics:', metricsRef.current)
  }

  // 监听性能指标
  useEffect(() => {
    // 检查浏览器支持
    if (!('performance' in window)) {
      return
    }

    // 1. 获取TTFB（Time to First Byte）
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metricsRef.current.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
    }

    // 2. 获取FCP（First Contentful Paint）
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcpEntry) {
      metricsRef.current.fcp = fcpEntry.startTime
    }

    // 3. 监听LCP（Largest Contentful Paint）
    observerRefs.current.lcp = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lcpEntry = entries[entries.length - 1]
      if (lcpEntry) {
        metricsRef.current.lcp = lcpEntry.startTime
      }
    })
    observerRefs.current.lcp.observe({ type: 'largest-contentful-paint', buffered: true })

    // 4. 监听CLS（Cumulative Layout Shift）
    let clsValue = 0
    observerRefs.current.cls = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(entry as any).hadRecentInput) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clsValue += (entry as any).value
          metricsRef.current.cls = clsValue
        }
      })
    })
    observerRefs.current.cls.observe({ type: 'layout-shift', buffered: true })

    // 5. 监听FID（First Input Delay）
    observerRefs.current.fid = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      if (entries.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = entries[0] as any
        metricsRef.current.fid = entry.processingStart - entry.startTime
      }
    })
    observerRefs.current.fid.observe({ type: 'first-input', buffered: true })

    // 6. 监听TBT（Total Blocking Time）
    let tbtValue = 0
    observerRefs.current.tbt = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        const blockingTime = entry.duration - 50 // 只计算超过50ms的阻塞时间
        if (blockingTime > 0) {
          tbtValue += blockingTime
          metricsRef.current.tbt = tbtValue
        }
      })
    })
    observerRefs.current.tbt.observe({ type: 'longtask', buffered: true })

    // 定期报告性能数据
    const intervalId = setInterval(reportMetrics, reportInterval)

    // 组件卸载时清理
    return () => {
      clearInterval(intervalId)
      
      // 断开所有性能观察者
      Object.values(observerRefs.current).forEach(observer => {
        if (observer) {
          observer.disconnect()
        }
      })
    }
  }, [reportInterval, onMetricsReady])

  // 返回当前收集的性能指标
  return metricsRef.current
}

export default usePerformanceMonitor