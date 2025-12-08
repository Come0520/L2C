'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_CONFIG } from '@/constants/measurement-status'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useRealtimeMeasurements } from '@/hooks/useRealtimeMeasurement'
import { Measurement } from '@/types/measurement'

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
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
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

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">测量单管理</h1>
            <p className="text-ink-500 mt-1">管理测量单的全生命周期</p>
          </div>
          <PaperButton variant="primary">新建测量单</PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量单列表</PaperCardTitle>
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
                {Object.values(MEASUREMENT_STATUS).map((status) => (
                  <option key={status} value={status}>{MEASUREMENT_STATUS_CONFIG[status].label}</option>
                ))}
              </select>

              <PaperInput
                placeholder="客户姓名"
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
              />

              <PaperInput
                placeholder="测量单号"
                value={filters.measurementNo}
                onChange={(e) => setFilters({ ...filters, measurementNo: e.target.value })}
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
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-ink-600">测量单号</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">客户姓名</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">项目地址</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">测量师</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">计划测量时间</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建人</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建时间</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-ink-500">加载中...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-red-500">加载失败，请重试</td>
                    </tr>
                  ) : measurements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-ink-500">暂无测量单数据</td>
                    </tr>
                  ) : (
                    measurements.map((measurement: Measurement) => (
                      <tr key={measurement.id} className="border-b hover:bg-paper-100">
                        <td className="py-3 px-4">{measurement.id.substring(0, 8)}</td>
                        <td className="py-3 px-4">{measurement.customerName}</td>
                        <td className="py-3 px-4">{measurement.projectAddress || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusConfig(measurement.status).bgColor} ${getStatusConfig(measurement.status).color}`}>
                            {getStatusConfig(measurement.status).label}
                          </span>
                        </td>
                        <td className="py-3 px-4">{measurement.surveyorName || '-'}</td>
                        <td className="py-3 px-4">{measurement.scheduledAt ? new Date(measurement.scheduledAt).toLocaleString('zh-CN') : '-'}</td>
                        <td className="py-3 px-4">{measurement.createdBy}</td>
                        <td className="py-3 px-4">{new Date(measurement.createdAt).toLocaleString('zh-CN')}</td>
                        <td className="py-3 px-4">
                          <Link href={`/orders/measurements/${measurement.id}`} className="text-blue-600 hover:underline mr-2">详情</Link>
                          <button className="text-gray-600 hover:underline">编辑</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            {total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-ink-600">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="flex space-x-2">
                  <PaperButton
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    上一页
                  </PaperButton>
                  <PaperButton
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                  >
                    下一页
                  </PaperButton>
                </div>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
