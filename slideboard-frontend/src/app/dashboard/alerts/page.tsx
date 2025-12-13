'use client'

import React from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'

interface AlertItem {
  id: string
  category: string
  title: string
  severity: 'high' | 'medium' | 'low'
  status: 'open' | 'ack' | 'resolved'
  occurredAt: string
}

export default function AlertsPage() {
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const alerts: AlertItem[] = [
    { id: 'a1', category: '库存与交期', title: '缺货风险：瓷砖A低于安全库存', severity: 'high', status: 'open', occurredAt: '2024-01-15 09:20' },
    { id: 'a2', category: '应收与现金流', title: '逾期应收超阈：客户Z', severity: 'high', status: 'ack', occurredAt: '2024-01-14 16:10' },
    { id: 'a3', category: '履约与满意度', title: '物流异常签收率上升', severity: 'medium', status: 'open', occurredAt: '2024-01-13 12:00' },
    { id: 'a4', category: '系统与安全', title: '权限异常：高危审计事件', severity: 'high', status: 'resolved', occurredAt: '2024-01-12 18:30' },
    { id: 'a5', category: '利润与成本', title: '利润率低于阈值：订单 ORD-2024-003', severity: 'low', status: 'open', occurredAt: '2024-01-12 10:05' },
  ]
  const totalItems = alerts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const getSeverityBadge = (severity: AlertItem['severity']) => {
    if (severity === 'high') return <PaperBadge variant="error">高</PaperBadge>
    if (severity === 'medium') return <PaperBadge variant="warning">中</PaperBadge>
    return <PaperBadge variant="info">低</PaperBadge>
  }

  const getStatusBadge = (status: AlertItem['status']) => {
    if (status === 'resolved') return <PaperBadge variant="success">已关闭</PaperBadge>
    if (status === 'ack') return <PaperBadge variant="warning">已受理</PaperBadge>
    return <PaperBadge variant="error">未处理</PaperBadge>
  }

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">预警中心</h1>
            <p className="text-ink-500 mt-1">跨业务的风险与异常聚合，支持分级处置与流转</p>
          </div>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>预警列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>类别</PaperTableCell>
                <PaperTableCell>标题</PaperTableCell>
                <PaperTableCell>严重级别</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
                <PaperTableCell>发生时间</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {alerts.map((alert) => (
                  <PaperTableRow key={alert.id}>
                    <PaperTableCell className="text-ink-800 font-medium">{alert.category}</PaperTableCell>
                    <PaperTableCell>{alert.title}</PaperTableCell>
                    <PaperTableCell>{getSeverityBadge(alert.severity)}</PaperTableCell>
                    <PaperTableCell>{getStatusBadge(alert.status)}</PaperTableCell>
                    <PaperTableCell>{alert.occurredAt}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="sm" variant="ghost">查看</PaperButton>
                        <PaperButton size="sm" variant="outline">处置</PaperButton>
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
  )
}
