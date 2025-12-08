'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { useInstallation } from '@/hooks/useInstallations'

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

export default function InstallationDetailPage() {
  const params = useParams()
  const installationId = params.id as string

  // 使用React Query获取安装单详情
  const { installation, isLoading, error, updateStatus } = useInstallation(installationId)

  // 状态更新模态框
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  // const [statusRemark, setStatusRemark] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // 初始化状态
  useEffect(() => {
    if (installation) {
      setNewStatus(installation.status)
    }
  }, [installation])

  // 处理状态更新
  const handleUpdateStatus = async () => {
    if (!newStatus) return

    setIsUpdating(true)
    try {
      await updateStatus(newStatus)
      setShowStatusModal(false)
      // setStatusRemark('')
    } catch (_err) {
      // 这里可以添加错误提示
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10">加载中...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !installation) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-10 text-red-500">
            {error ? '加载失败，请重试' : '安装单不存在'}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">安装单详情</h1>
            <p className="text-ink-500 mt-1">查看安装单的详细信息</p>
          </div>
          <div className="flex space-x-2">
            <Link href={`/orders/installations/${installation.id}/edit`}>
              <PaperButton variant="outline">编辑</PaperButton>
            </Link>
            {/* 状态更新按钮 */}
            <PaperButton variant="primary" onClick={() => setShowStatusModal(true)}>
              更新状态
            </PaperButton>
          </div>
        </div>

        {/* 安装单基本信息 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基本信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">安装单号</span>
                  <span className="text-ink-800">{installation.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">销售单号</span>
                  <span className="text-ink-800">{installation.salesOrderNo || '-'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">客户姓名</span>
                  <span className="text-ink-800">{installation.customerName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">项目地址</span>
                  <span className="text-ink-800">{installation.projectAddress || '-'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">状态</span>
                  <span className={`px-2 py-1 rounded text-sm ${statusStyleMap[installation.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusTextMap[installation.status] || installation.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">安装师</span>
                  <span className="text-ink-800">{installation.installerName || '-'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">计划安装时间</span>
                  <span className="text-ink-800">
                    {installation.scheduledAt ? new Date(installation.scheduledAt).toLocaleString('zh-CN') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">实际安装时间</span>
                  <span className="text-ink-800">
                    {installation.completedAt ? new Date(installation.completedAt).toLocaleString('zh-CN') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">创建人</span>
                  <span className="text-ink-800">{installation.createdBy}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ink-600 font-medium">创建时间</span>
                  <span className="text-ink-800">{new Date(installation.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* 安装数据 */}
        {installation.installationData && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>安装数据</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm text-ink-700">
                  {JSON.stringify(installation.installationData, null, 2)}
                </pre>
              </div>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* 安装报告（暂不展示具体链接字段） */}

        {/* 安装照片 */}
        {installation.installationPhotos && installation.installationPhotos.length > 0 && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>安装照片</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {installation.installationPhotos.map((photoUrl: string, index: number) => (
                  <div key={index} className="border rounded-md overflow-hidden">
                    <Image
                      src={photoUrl}
                      alt={`安装照片 ${index + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* 状态更新模态框 */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-ink-800 mb-4">更新安装单状态</h2>

                <div className="space-y-4">
                  {/* 状态选择 */}
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">新状态</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">待分配</option>
                      <option value="assigning">分配中</option>
                      <option value="waiting">待安装</option>
                      <option value="installing">安装中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>

                  {/* 状态备注 - 暂时隐藏，因为后端暂不支持 */}
                  {/* <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">备注</label>
                    <PaperInput
                      type="textarea"
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      placeholder="请输入状态变更备注"
                      className="min-h-[100px]"
                    />
                  </div> */}

                  {/* 操作按钮 */}
                  <div className="flex justify-end space-x-2">
                    <PaperButton variant="outline" onClick={() => setShowStatusModal(false)}>
                      取消
                    </PaperButton>
                    <PaperButton
                      variant="primary"
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                    >
                      {isUpdating ? '更新中...' : '确认更新'}
                    </PaperButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
