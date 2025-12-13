'use client'

import React from 'react'

import { PaperProgress } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'

interface TeamMetricItem {
  id: string
  name: string
  deals: number
  revenue: number
  conversionRate: number
  followUps: number
  onTimeRate: number
}

export default function AssessmentPage() {
  const teamMetrics: TeamMetricItem[] = [
    { id: 'm1', name: '一店-张三', deals: 28, revenue: 820000, conversionRate: 22.4, followUps: 86, onTimeRate: 95.6 },
    { id: 'm2', name: '二店-李四', deals: 24, revenue: 740000, conversionRate: 20.1, followUps: 72, onTimeRate: 92.1 },
    { id: 'm3', name: '线上-王五', deals: 19, revenue: 580000, conversionRate: 18.3, followUps: 65, onTimeRate: 90.4 },
  ]

  const totalRevenue = teamMetrics.reduce((sum, t) => sum + t.revenue, 0)
  const avgConversion = Math.round((teamMetrics.reduce((sum, t) => sum + t.conversionRate, 0) / teamMetrics.length) * 10) / 10
  const avgOnTime = Math.round((teamMetrics.reduce((sum, t) => sum + t.onTimeRate, 0) / teamMetrics.length) * 10) / 10

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">考核视图</h1>
            <p className="text-ink-500 mt-1">支持门店与成员排行、目标达成与关键指标跟踪</p>
          </div>
          <PaperButton variant="primary">导出报表</PaperButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">总营收</p>
              <p className="text-2xl font-bold text-ink-800">¥{totalRevenue.toLocaleString()}</p>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">平均转化率</p>
              <p className="text-2xl font-bold text-ink-800">{avgConversion}%</p>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">履约及时率</p>
              <p className="text-2xl font-bold text-ink-800">{avgOnTime}%</p>
            </PaperCardContent>
          </PaperCard>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>门店/成员排行</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>名称</PaperTableCell>
                <PaperTableCell>成交数</PaperTableCell>
                <PaperTableCell>营收</PaperTableCell>
                <PaperTableCell>转化率</PaperTableCell>
                <PaperTableCell>跟进次数</PaperTableCell>
                <PaperTableCell>履约及时率</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {teamMetrics.map((t) => (
                  <PaperTableRow key={t.id}>
                    <PaperTableCell className="font-medium text-ink-800">{t.name}</PaperTableCell>
                    <PaperTableCell>{t.deals}</PaperTableCell>
                    <PaperTableCell>¥{t.revenue.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        <PaperProgress value={t.conversionRate} max={100} />
                        <span>{t.conversionRate}%</span>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>{t.followUps}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        <PaperProgress value={t.onTimeRate} max={100} color="info" />
                        <span>{t.onTimeRate}%</span>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="small" variant="outline">查看</PaperButton>
                        <PaperButton size="small" variant="outline">分析</PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>
      </div>
  )
}
