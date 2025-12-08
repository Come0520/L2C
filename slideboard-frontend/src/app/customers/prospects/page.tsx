'use client'

import React from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperSelect } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'

interface ProspectItem {
  id: string
  name: string
  priority: 'A' | 'B' | 'C'
  source: 'referral' | 'channel' | 'event' | 'alliance'
  stage: 'initial' | 'discovery' | 'proposal' | 'negotiation' | 'pilot' | 'launch'
  coverage: number
  intentScore: number
  nextAction: string
}

const priorityOptions = [
  { value: '', label: '全部' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const sourceOptions = [
  { value: '', label: '全部' },
  { value: 'referral', label: '转介绍' },
  { value: 'channel', label: '渠道' },
  { value: 'event', label: '活动' },
  { value: 'alliance', label: '联盟' },
]

const stageOptions = [
  { value: '', label: '全部' },
  { value: 'initial', label: '初识' },
  { value: 'discovery', label: '需求' },
  { value: 'proposal', label: '方案' },
  { value: 'negotiation', label: '谈判' },
  { value: 'pilot', label: '试点' },
  { value: 'launch', label: '上线' },
]

export default function ProspectsPage() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [priority, setPriority] = React.useState('')
  const [source, setSource] = React.useState('')
  const [stage, setStage] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const prospects: ProspectItem[] = [
    { id: 'c1', name: '星河装企', priority: 'A', source: 'channel', stage: 'proposal', coverage: 75, intentScore: 86, nextAction: '方案评审会议 01-17' },
    { id: 'c2', name: '远航装饰', priority: 'B', source: 'event', stage: 'negotiation', coverage: 60, intentScore: 72, nextAction: '条款决议与审批 01-19' },
    { id: 'c3', name: '恒通装企', priority: 'C', source: 'referral', stage: 'initial', coverage: 30, intentScore: 40, nextAction: '首次拜访安排 01-20' },
  ]

  const filtered = prospects.filter((p) => {
    const matchSearch = p.name.includes(searchTerm)
    const matchPriority = priority ? p.priority === priority : true
    const matchSource = source ? p.source === source : true
    const matchStage = stage ? p.stage === stage : true
    return matchSearch && matchPriority && matchSource && matchStage
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageData = filtered.slice(startIndex, startIndex + itemsPerPage)

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">潜在合作装企</h1>
          <p className="text-ink-500 mt-1">跟踪视图，支持名单分层、触达计划与试点推进</p>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>筛选</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <PaperInput label="搜索" placeholder="装企名称" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <PaperSelect label="优先级" options={priorityOptions} value={priority} onChange={(e) => setPriority(e.target.value)} />
              <PaperSelect label="来源" options={sourceOptions} value={source} onChange={(e) => setSource(e.target.value)} />
              <PaperSelect label="阶段状态" options={stageOptions} value={stage} onChange={(e) => setStage(e.target.value)} />
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <PaperCardTitle>名单池</PaperCardTitle>
              <div className="flex space-x-2">
                <PaperButton variant="outline">导入</PaperButton>
                <PaperButton variant="outline">导出</PaperButton>
                <PaperButton variant="primary">新建记录</PaperButton>
              </div>
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>装企</PaperTableCell>
                <PaperTableCell>优先级</PaperTableCell>
                <PaperTableCell>来源</PaperTableCell>
                <PaperTableCell>阶段</PaperTableCell>
                <PaperTableCell>关键人覆盖</PaperTableCell>
                <PaperTableCell>意向评分</PaperTableCell>
                <PaperTableCell>下一步</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {pageData.map((p) => (
                  <PaperTableRow key={p.id}>
                    <PaperTableCell className="font-medium text-ink-800">{p.name}</PaperTableCell>
                    <PaperTableCell><PaperBadge variant="outline">{p.priority}</PaperBadge></PaperTableCell>
                    <PaperTableCell>{p.source}</PaperTableCell>
                    <PaperTableCell>{p.stage}</PaperTableCell>
                    <PaperTableCell>{p.coverage}%</PaperTableCell>
                    <PaperTableCell>{p.intentScore}</PaperTableCell>
                    <PaperTableCell>{p.nextAction}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="sm" variant="ghost">查看</PaperButton>
                        <PaperButton size="sm" variant="outline">推进</PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
            <PaperTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
