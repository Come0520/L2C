'use client'

import { Clock, CheckCircle } from 'lucide-react'
import React from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'

interface TodoItem {
  id: string
  title: string
  role: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

export default function TodosPage() {
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const todos: TodoItem[] = [
    { id: 't1', title: '报价审批', role: 'LEAD_SALES', dueDate: '2024-01-16', status: 'pending', priority: 'high' },
    { id: 't2', title: '线索分配与复核', role: 'LEAD_SALES', dueDate: '2024-01-17', status: 'in-progress', priority: 'medium' },
    { id: 't3', title: '测量预约安排', role: 'SALES_STORE', dueDate: '2024-01-15', status: 'pending', priority: 'high' },
    { id: 't4', title: '远程报价发送', role: 'SALES_REMOTE', dueDate: '2024-01-18', status: 'in-progress', priority: 'medium' },
    { id: 't5', title: '发票开具与回款确认', role: 'OTHER_FINANCE', dueDate: '2024-01-20', status: 'pending', priority: 'high' },
    { id: 't6', title: '安装派单与进度确认', role: 'SERVICE_DISPATCH', dueDate: '2024-01-15', status: 'completed', priority: 'low' },
  ]
  const totalItems = todos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const getStatusBadge = (status: TodoItem['status']) => {
    if (status === 'completed') return <PaperBadge variant="success">已完成</PaperBadge>
    if (status === 'in-progress') return <PaperBadge variant="warning">进行中</PaperBadge>
    return <PaperBadge variant="info">待处理</PaperBadge>
  }

  const getPriorityBadge = (priority: TodoItem['priority']) => {
    if (priority === 'high') return <PaperBadge variant="error">高</PaperBadge>
    if (priority === 'medium') return <PaperBadge variant="warning">中</PaperBadge>
    return <PaperBadge variant="info">低</PaperBadge>
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">待办清单</h1>
            <p className="text-ink-500 mt-1">按角色聚合的工作项，支持就地处理与跟进</p>
          </div>
          <div className="flex space-x-3">
            <PaperButton variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              今日待办
            </PaperButton>
            <PaperButton variant="primary">
              <CheckCircle className="h-4 w-4 mr-2" />
              新建任务
            </PaperButton>
          </div>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>任务列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>任务</PaperTableCell>
                <PaperTableCell>角色</PaperTableCell>
                <PaperTableCell>优先级</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
                <PaperTableCell>截止</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {todos.map((todo) => (
                  <PaperTableRow key={todo.id}>
                    <PaperTableCell className="text-ink-800 font-medium">{todo.title}</PaperTableCell>
                    <PaperTableCell>{todo.role}</PaperTableCell>
                    <PaperTableCell>{getPriorityBadge(todo.priority)}</PaperTableCell>
                    <PaperTableCell>{getStatusBadge(todo.status)}</PaperTableCell>
                    <PaperTableCell>{todo.dueDate}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="sm" variant="ghost">查看</PaperButton>
                        <PaperButton size="sm" variant="outline">办理</PaperButton>
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
