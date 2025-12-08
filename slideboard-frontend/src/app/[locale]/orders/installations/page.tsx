'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { useInstallations } from '@/hooks/useInstallations'
import { InstallationListItem } from '@/types/installation'

// 状态文本映射
const statusTextMap: Record<string, string> = {
  'pending': '待分配',
  'assigning': '分配中',
  'waiting': '待安装',
  'installing': '安装中',
  'completed': '已完成',
  'cancelled': '已取消'
}

// 状态样式映射
const statusStyleMap: Record<string, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'assigning': 'bg-blue-100 text-blue-800',
  'waiting': 'bg-purple-100 text-purple-800',
  'installing': 'bg-indigo-100 text-indigo-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
}

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

  // 应用筛选条件
  const handleApplyFilters = () => {
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">安装单管理</h1>
            <p className="text-ink-500 mt-1">管理安装单的全生命周期</p>
          </div>
          <PaperButton variant="primary">新建安装单</PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>安装单列表</PaperCardTitle>
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
                {Object.entries(statusTextMap).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
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
                    <th className="text-left py-3 px-4 font-medium text-ink-600">安装单号</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">销售单号</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">客户姓名</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">项目地址</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">安装师</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">计划安装时间</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建人</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建时间</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-ink-500">加载中...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-red-500">加载失败，请重试</td>
                    </tr>
                  ) : installations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-ink-500">暂无安装单数据</td>
                    </tr>
                  ) : (
                    installations.map((installation: InstallationListItem) => (
                      <tr key={installation.id} className="border-b hover:bg-paper-100">
                        <td className="py-3 px-4">{installation.id.substring(0, 8)}</td>
                        <td className="py-3 px-4">{installation.salesOrderNo || '-'}</td>
                        <td className="py-3 px-4">{installation.customerName}</td>
                        <td className="py-3 px-4">{installation.projectAddress || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${statusStyleMap[installation.status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusTextMap[installation.status] || installation.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{installation.installerName || '-'}</td>
                        <td className="py-3 px-4">{installation.scheduledAt ? new Date(installation.scheduledAt).toLocaleString('zh-CN') : '-'}</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">{new Date(installation.createdAt).toLocaleString('zh-CN')}</td>
                        <td className="py-3 px-4">
                          <Link href={`/orders/installations/${installation.id}`} className="text-blue-600 hover:underline mr-2">详情</Link>
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
