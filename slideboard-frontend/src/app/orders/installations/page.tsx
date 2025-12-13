'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { INSTALLATION_STATUS, INSTALLATION_STATUS_CONFIG } from '@/constants/installation-status'
import { useInstallations } from '@/hooks/useInstallations'
import { InstallationListItem } from '@/shared/types/installation'
import { formatDateTime } from '@/utils/date'
import { ExportMenu } from '@/components/ui/export-menu'
import { useExport } from '@/hooks/useExport'

export default function InstallationsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  // 筛选条件
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    installationNo: ''
  })

  // 使用React Query获取安装单列表
  const { data: installations, total, isLoading, error } = useInstallations(page, pageSize, filters)

  const totalPages = Math.ceil(total / pageSize)

  // 重置筛选条件
  const handleResetFilters = () => {
    setFilters({
      status: '',
      customerName: '',
      installationNo: ''
    })
    setPage(1)
  }

  // 导出功能
  const { handleExport } = useExport<InstallationListItem>({
    filename: '安装单列表',
    columns: [
      { header: '安装单号', dataKey: 'installationNo' },
      { header: '销售单号', dataKey: 'salesNo' },
      { header: '客户姓名', dataKey: 'customerName' },
      { header: '项目地址', dataKey: 'projectAddress' },
      { header: '状态', dataKey: 'status' },
      { header: '安装师傅', dataKey: 'installerName' },
      { header: '预约时间', dataKey: 'scheduledTime' },
    ]
  })

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">安装单管理</h1>
            <p className="text-ink-500 mt-1">管理安装单的全生命周期</p>
          </div>
          <Link href="/orders/installations/create">
            <PaperButton variant="primary">新建安装单</PaperButton>
          </Link>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <div className="flex justify-between items-center">
              <PaperCardTitle>安装单列表</PaperCardTitle>
              <ExportMenu onExport={(format) => handleExport(installations, format)} />
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            {/* 筛选条件 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                {Object.values(INSTALLATION_STATUS).map((status) => (
                  <option key={status} value={status}>{INSTALLATION_STATUS_CONFIG[status].label}</option>
                ))}
              </select>

              <PaperInput
                placeholder="客户姓名"
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
              />

              <PaperInput
                placeholder="安装单号"
                value={filters.installationNo}
                onChange={(e) => setFilters({ ...filters, installationNo: e.target.value })}
              />

              <div className="flex space-x-2">
                <PaperButton variant="outline" onClick={handleResetFilters}>重置</PaperButton>
              </div>
            </div>

            {/* 列表表格 */}
            <div className="overflow-x-auto">
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableRow>
                    <PaperTableCell>安装单号</PaperTableCell>
                    <PaperTableCell>销售单号</PaperTableCell>
                    <PaperTableCell>客户姓名</PaperTableCell>
                    <PaperTableCell>项目地址</PaperTableCell>
                    <PaperTableCell>状态</PaperTableCell>
                    <PaperTableCell>安装师傅</PaperTableCell>
                    <PaperTableCell>预约时间</PaperTableCell>
                    <PaperTableCell>创建时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableRow>
                </PaperTableHeader>
                <PaperTableBody>
                  {isLoading ? (
                    <PaperTableRow>
                      <PaperTableCell colSpan={9} className="py-10 text-center text-ink-500">加载中...</PaperTableCell>
                    </PaperTableRow>
                  ) : error ? (
                    <PaperTableRow>
                      <PaperTableCell colSpan={9} className="py-10 text-center text-red-500">加载失败，请重试</PaperTableCell>
                    </PaperTableRow>
                  ) : installations.length === 0 ? (
                    <PaperTableRow>
                      <PaperTableCell colSpan={9} className="py-10 text-center text-ink-500">暂无安装单数据</PaperTableCell>
                    </PaperTableRow>
                  ) : (
                    installations.map((installation: InstallationListItem) => (
                      <PaperTableRow key={installation.id} className="hover:bg-paper-100">
                        <PaperTableCell>{installation.installationNo}</PaperTableCell>
                        <PaperTableCell>{installation.salesOrderNo}</PaperTableCell>
                        <PaperTableCell>{installation.customerName}</PaperTableCell>
                        <PaperTableCell>{installation.projectAddress || '-'}</PaperTableCell>
                        <PaperTableCell>
                          <span className={`px-2 py-1 rounded text-sm ${INSTALLATION_STATUS_CONFIG[installation.status as keyof typeof INSTALLATION_STATUS_CONFIG]?.bgColor || 'bg-gray-100'} ${INSTALLATION_STATUS_CONFIG[installation.status as keyof typeof INSTALLATION_STATUS_CONFIG]?.color || 'text-gray-800'}`}>
                            {INSTALLATION_STATUS_CONFIG[installation.status as keyof typeof INSTALLATION_STATUS_CONFIG]?.label || installation.status}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>{installation.installerName || installation.installationTeamName || '-'}</PaperTableCell>
                        <PaperTableCell>{formatDateTime(installation.scheduledAt)}</PaperTableCell>
                        <PaperTableCell>{formatDateTime(installation.createdAt)}</PaperTableCell>
                        <PaperTableCell>
                          <Link href={`/orders/installations/${installation.id}`} className="text-blue-600 hover:underline mr-2">详情</Link>
                          <button className="text-gray-600 hover:underline">编辑</button>
                        </PaperTableCell>
                      </PaperTableRow>
                    ))
                  )}
                </PaperTableBody>
              </PaperTable>
            </div>

            {/* 分页控件 */}
            {total > 0 && (
              <div className="mt-4">
                <PaperTablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={total}
                  itemsPerPage={pageSize}
                />
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
  )
}
