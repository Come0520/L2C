'use client'

import React, { ReactNode } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'

interface StatePageProps {
  title: string
  children: ReactNode
  actions?: Array<{ key: string; label: string; onClick: (key: string) => void }>
}

export function StatePage({
  title,
  children,
  actions = [],
}: StatePageProps) {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">{title}</h1>
            <p className="text-ink-500 mt-1">按状态进行筛选与推进</p>
          </div>
          <div className="flex space-x-2">
            {actions.map((a) => (
              <PaperButton key={a.key} variant="outline" onClick={() => a.onClick(a.key)}>
                {a.label}
              </PaperButton>
            ))}
          </div>
        </div>
        {children}
      </div>
    </DashboardLayout>
  )
}

// 添加默认导出
export default StatePage
