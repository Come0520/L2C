'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent, PaperCardFooter } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'

export default function LeadDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const lead = {
    id,
    name: '李女士-全屋定制',
    source: '渠道转介',
    owner: '二店-李四',
    status: 'draft',
    tags: ['arrived', 'quoted'],
    appointment: '2024-01-17 10:00',
  }

  const quoteVersions = [
    { id: 'Q-001', version: 1, date: '2024-01-10', amount: 128000 },
    { id: 'Q-001', version: 2, date: '2024-01-12', amount: 132500 },
    { id: 'Q-001', version: 3, date: '2024-01-14', amount: 129900 },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">线索详情</h1>
            <p className="text-ink-500 mt-1">标签、来源渠道、归属、跟进记录、预约、报价版本历史、草签、方案与图片</p>
          </div>
          <div className="flex space-x-2">
            <PaperButton variant="outline">关闭</PaperButton>
            <PaperButton variant="primary">激活</PaperButton>
          </div>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基本信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-ink-800 font-medium">{lead.name}</div>
                <div className="text-ink-600">编号 {lead.id}</div>
                <div className="text-ink-600">来源 {lead.source}</div>
                <div className="text-ink-600">归属 {lead.owner}</div>
                <div className="text-ink-600">预约 {lead.appointment}</div>
                <div className="flex space-x-2">
                  <PaperBadge variant="info">已到店</PaperBadge>
                  <PaperBadge variant="success">已报价</PaperBadge>
                </div>
              </div>
              <div className="space-y-2">
                <PaperInput label="跟进备注" placeholder="添加备注" />
                <div className="flex space-x-2">
                  <PaperButton variant="outline">预约测量</PaperButton>
                  <PaperButton variant="outline">创建报价</PaperButton>
                  <PaperButton variant="primary">执行草签</PaperButton>
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>报价版本历史</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>版本</PaperTableCell>
                <PaperTableCell>日期</PaperTableCell>
                <PaperTableCell>金额</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {quoteVersions.map((v) => (
                  <PaperTableRow key={v.version}>
                    <PaperTableCell>V{v.version}</PaperTableCell>
                    <PaperTableCell>{v.date}</PaperTableCell>
                    <PaperTableCell>¥{v.amount.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="sm" variant="ghost">查看</PaperButton>
                        <PaperButton size="sm" variant="outline">版本差异</PaperButton>
                        <PaperButton size="sm" variant="outline">导出</PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>方案与图片</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-paper-300 rounded-md"></div>
              <div className="h-32 bg-paper-300 rounded-md"></div>
              <div className="h-32 bg-paper-300 rounded-md"></div>
              <div className="h-32 bg-paper-300 rounded-md"></div>
            </div>
          </PaperCardContent>
          <PaperCardFooter>
            <div className="flex space-x-2">
              <PaperButton variant="outline">上传图片</PaperButton>
              <PaperButton variant="outline">上传方案</PaperButton>
            </div>
          </PaperCardFooter>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
