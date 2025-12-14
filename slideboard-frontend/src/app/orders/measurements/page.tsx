'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { ExportMenu } from '@/components/ui/export-menu'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { VanishInput } from '@/components/ui/vanish-input'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_CONFIG } from '@/constants/measurement-status'
import { useExport } from '@/hooks/useExport'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useRealtimeMeasurements } from '@/hooks/useRealtimeMeasurement'
import { Measurement } from '@/shared/types/measurement'
import { formatDateTime } from '@/utils/date'

// 获取状态显示配置
const isMeasurementStatus = (s: string): s is typeof MEASUREMENT_STATUS[keyof typeof MEASUREMENT_STATUS] => {
  return (Object.values(MEASUREMENT_STATUS) as readonly string[]).includes(s)
}

const getStatusConfig = (status: string) => {
  if (isMeasurementStatus(status)) {
    return MEASUREMENT_STATUS_CONFIG[status]
  }
  return {
    label: status,
    color: '#9E9E9E',
    bgColor: 'bg-theme-bg-tertiary',
    borderColor: 'border-theme-border'
  }
}

export default function MeasurementsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  // 筛选条件
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    measurementNo: ''
  })

  // 使用React Query获取测量单列表
  const { data: initialMeasurements, total, isLoading, error } = useMeasurements(page, pageSize, filters)

  // 使用实时测量单列表钩子获取实时更新
  const { measurements } = useRealtimeMeasurements(initialMeasurements)

  const totalPages = Math.ceil(total / pageSize)

  // 重置筛选条件
  const handleResetFilters = () => {
    setFilters({
      status: '',
      customerName: '',
      measurementNo: ''
    })
    setPage(1)
  }

  // 应用筛选条件
  const handleApplyFilters = () => {
    setPage(1)
  }

  // 导出功能
  const { handleExport } = useExport<Measurement>({
    filename: '测量单列表',
    columns: [
      { header: '测量单号', dataKey: 'measurementNo' },
      { header: '客户姓名', dataKey: 'customerName' },
      { header: '联系电话', dataKey: 'customerPhone' },
      { header: '项目地址', dataKey: 'projectAddress' },
      { header: '状态', dataKey: 'status' },
      { header: '测量师傅', dataKey: 'surveyorName' },
      { header: '预约时间', dataKey: 'scheduledTime' },
    ]
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-text-primary">测量单管理</h1>
          <p className="text-theme-text-secondary mt-1">管理测量单的全生命周期</p>
        </div>
        <PaperButton variant="primary">新建测量单</PaperButton>
      </div>

      <PaperCard>
        <PaperCardHeader>
          <div className="flex justify-between items-center">
            <PaperCardTitle>测量单列表</PaperCardTitle>
            <ExportMenu onExport={(format) => handleExport(measurements, format)} />
          </div>
        </PaperCardHeader>
        <PaperCardContent>
          {/* 筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-bg-secondary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              {Object.values(MEASUREMENT_STATUS).map((status) => (
                <option key={status} value={status}>{MEASUREMENT_STATUS_CONFIG[status].label}</option>
              ))}
            </select>

            <VanishInput
              placeholders={["搜索客户姓名...", "输入客户名...", "查找客户..."]}
              value={filters.customerName}
              onChange={(value) => setFilters({ ...filters, customerName: value })}
            />

            <VanishInput
              placeholders={["搜索测量单号...", "输入单号...", "查找单号..."]}
              value={filters.measurementNo}
              onChange={(value) => setFilters({ ...filters, measurementNo: value })}
            />

            <div className="flex space-x-2">
              <PaperButton variant="outline" onClick={handleResetFilters}>
                重置
              </PaperButton>
              <PaperButton variant="primary" onClick={handleApplyFilters}>
                筛选
              </PaperButton>
            </div>
          </div>

          <div className="overflow-x-auto">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableCell>测量单号</PaperTableCell>
                  <PaperTableCell>客户姓名</PaperTableCell>
                  <PaperTableCell>项目地址</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>测量师</PaperTableCell>
                  <PaperTableCell>计划测量时间</PaperTableCell>
                  <PaperTableCell>创建人</PaperTableCell>
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
                ) : measurements.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={9} className="py-10 text-center text-ink-500">暂无测量单数据</PaperTableCell>
                  </PaperTableRow>
                ) : (
                  measurements.map((measurement: Measurement) => (
                    <PaperTableRow key={measurement.id} className="hover:bg-theme-bg-tertiary transition-colors">
                      <PaperTableCell>{measurement.id.substring(0, 8)}</PaperTableCell>
                      <PaperTableCell>{measurement.customerName}</PaperTableCell>
                      <PaperTableCell>{measurement.projectAddress || '-'}</PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-sm ${getStatusConfig(measurement.status).bgColor} ${getStatusConfig(measurement.status).color}`}>
                          {getStatusConfig(measurement.status).label}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>{measurement.surveyorName || '-'}</PaperTableCell>
                      <PaperTableCell>{measurement.scheduledAt ? formatDateTime(measurement.scheduledAt) : '-'}</PaperTableCell>
                      <PaperTableCell>{measurement.createdBy}</PaperTableCell>
                      <PaperTableCell>{formatDateTime(measurement.createdAt)}</PaperTableCell>
                      <PaperTableCell>
                        <Link href={`/orders/measurements/${measurement.id}`} className="text-primary-600 hover:underline mr-2">详情</Link>
                        <button className="text-theme-text-secondary hover:underline">编辑</button>
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
