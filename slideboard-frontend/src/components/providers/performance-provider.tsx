'use client'

import React, { ReactNode } from 'react'

import usePerformanceMonitor from '@/hooks/usePerformanceMonitor'

interface PerformanceProviderProps {
  children: ReactNode
}

/**
 * 性能监控提供者组件
 * 用于在整个应用中监控性能指标
 */
export function PerformanceProvider({ children }: PerformanceProviderProps) {
  // 使用性能监控hook
  usePerformanceMonitor({
    reportInterval: 10000, // 每10秒报告一次性能数据
    onMetricsReady: (metrics) => {
      // 这里可以将性能数据发送到服务器
      // 或者在控制台显示性能数据
      console.log('📊 Performance Metrics:', metrics)
    }
  })

  return <>{children}</>
}

export default PerformanceProvider