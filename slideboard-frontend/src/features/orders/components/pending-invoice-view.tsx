'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperFileUpload } from '@/components/ui/paper-file-upload'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { PaperToast } from '@/components/ui/paper-toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// 待开票订单类型定义
interface InvoiceOrder {
  id: string
  reconciliationNo: string // 对账单号
  city: string // 城市
  amount: number // 金额
  status: 'pending_invoice' | 'pending_payment' // 状态：待开票或待回款
}

// 模拟数据
const INITIAL_ORDERS: InvoiceOrder[] = [
  {
    id: '1',
    reconciliationNo: 'R2024010001',
    city: '北京',
    amount: 9700.00,
    status: 'pending_invoice'
  },
  {
    id: '2',
    reconciliationNo: 'R2024010002',
    city: '上海',
    amount: 4500.00,
    status: 'pending_invoice'
  },
  {
    id: '3',
    reconciliationNo: 'R2024010003',
    city: '广州',
    amount: 2800.00,
    status: 'pending_invoice'
  },
  {
    id: '4',
    reconciliationNo: 'R2024010004',
    city: '深圳',
    amount: 6200.00,
    status: 'pending_invoice'
  },
  {
    id: '5',
    reconciliationNo: 'R2024010005',
    city: '杭州',
    amount: 3900.00,
    status: 'pending_invoice'
  }
]

export function PendingInvoiceView() {
  const supabase = createClient()
  const { user } = useAuth()
  const isFinance = (user?.role as string) === 'OTHER_FINANCE'
  const [orders, setOrders] = useState<InvoiceOrder[]>(INITIAL_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<InvoiceOrder | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({})
  const [rejectReason, setRejectReason] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  // 只显示待开票状态的订单
  const pendingInvoiceOrders = orders.filter(order => order.status === 'pending_invoice')

  // 获取所有城市列表
  const cities = Array.from(new Set(pendingInvoiceOrders.map(order => order.city)))

  // 搜索和筛选逻辑
  const filteredOrders = pendingInvoiceOrders.filter(order => {
    const matchesSearch = order.reconciliationNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = selectedCity ? order.city === selectedCity : true

    return matchesSearch && matchesCity
  })

  // 统计数据
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.amount, 0)

  // 按城市分组统计
  const cityStats = filteredOrders.reduce((acc, order) => {
    if (!acc[order.city]) {
      acc[order.city] = 0
    }
    acc[order.city] = (acc[order.city] || 0) + order.amount
    return acc
  }, {} as Record<string, number>)

  // 转换为数组格式，方便渲染
  const cityStatsArray = Object.entries(cityStats).map(([city, amount]) => ({
    city,
    amount
  }))

  // 处理文件上传
  const handleFileUpload = (orderId: string, files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
        setUploadedFiles(prev => ({
          ...prev,
          [orderId]: file
        }))
        setToast({ message: '发票上传成功', type: 'success' })
      } else {
        setToast({ message: '请上传PDF格式的发票文件', type: 'error' })
      }
    }
  }

  // 处理确认开票
  const handleConfirmInvoice = async (orderId: string) => {
    if (!isFinance) {
      setToast({ message: '无权限：仅财务可确认开票', type: 'error' })
      return
    }

    try {
      // 更新订单状态为待回款
      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.PENDING_PAYMENT })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: 'pending_payment' } : order
      ))

      // 清空上传的文件
      setUploadedFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[orderId]
        return newFiles
      })
      setToast({ message: '开票确认成功，已进入待回款状态', type: 'success' })
    } catch (error) {
      logger.error('开票确认失败', { resourceType: 'order', resourceId: orderId, details: { error } })
      setToast({ message: '开票确认失败', type: 'error' })
    }
  }

  // 处理驳回
  const handleReject = (order: InvoiceOrder) => {
    if (!isFinance) {
      setToast({ message: '无权限：仅财务可驳回', type: 'error' })
      return
    }
    setSelectedOrder(order)
    setIsRejectDialogOpen(true)
  }

  // 提交驳回
  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      setToast({ message: '请填写驳回原因', type: 'error' })
      return
    }
    // 这里应该调用API提交驳回
    setToast({ message: '驳回成功', type: 'success' })
    setIsRejectDialogOpen(false)
    setRejectReason('')
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast通知 */}
      {toast && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 统计卡片 */}
      <PaperCard>
        <PaperCardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">待开票统计</h3>
              <div className="text-3xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</div>
              <p className="text-sm text-gray-500 mt-1">共 {filteredOrders.length} 笔对账单需要开票</p>
            </div>

            {cityStatsArray.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">按城市分布</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {cityStatsArray.map(({ city, amount }) => (
                    <div key={city} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">{city}</div>
                      <div className="text-lg font-semibold">¥{amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 待开票订单列表 */}
      <PaperCard>
        <PaperTableToolbar className="flex items-center justify-between bg-white p-3 border-b border-gray-200">
          <div className="flex items-center gap-3 w-full">
            {/* 搜索栏 */}
            <div className="flex-grow max-w-md">
              <input
                type="text"
                placeholder="搜索对账单号"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 城市筛选 */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部城市</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* 订单数量统计 */}
            <div className="text-sm text-ink-500">共 {filteredOrders.length} 条记录</div>
          </div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>对账单号</PaperTableCell>
              <PaperTableCell>城市</PaperTableCell>
              <PaperTableCell>金额</PaperTableCell>
              <PaperTableCell>上传发票</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {filteredOrders.map((order) => (
                <PaperTableRow key={order.id}>
                  <PaperTableCell>{order.reconciliationNo}</PaperTableCell>
                  <PaperTableCell>{order.city}</PaperTableCell>
                  <PaperTableCell>¥{order.amount.toFixed(2)}</PaperTableCell>
                  <PaperTableCell>
                    <PaperFileUpload
                      onUpload={(files) => handleFileUpload(order.id, files)}
                      accept=".pdf"
                      maxSizeMB={10}
                      onValidateError={(errs) => setToast({ message: errs.join('；'), type: 'error' })}
                      className="w-full"
                    />
                    {uploadedFiles[order.id] && (
                      <p className="text-sm text-green-600 mt-1">已上传：{uploadedFiles[order.id]?.name}</p>
                    )}
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex gap-2">
                      <PaperButton
                        size="small"
                        variant="primary"
                        onClick={() => handleConfirmInvoice(order.id)}
                        disabled={!uploadedFiles[order.id] || !isFinance}
                      >
                        确认
                      </PaperButton>
                      <PaperButton
                        size="small"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleReject(order)}
                        disabled={!isFinance}
                      >
                        驳回
                      </PaperButton>
                    </div>
                  </PaperTableCell>
                </PaperTableRow>
              ))}
            </PaperTableBody>
          </PaperTable>
        </PaperCardContent>
      </PaperCard>

      {/* 驳回弹窗 */}
      <PaperDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>驳回对账单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">对账单号：{selectedOrder?.reconciliationNo}</p>
              <p className="text-sm text-gray-600">城市：{selectedOrder?.city}</p>
              <p className="text-sm text-gray-600">金额：¥{selectedOrder?.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因</label>
              <PaperTextarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请详细说明驳回原因"
                rows={4}
              />
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            className="text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
            onClick={handleRejectSubmit}
          >
            确认驳回
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
