'use client'

import React, { useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter, PaperDialogDescription } from '@/components/ui/paper-dialog'
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// Mock data types
interface PendingVisitOrder {
  id: string
  salesNo: string
  installNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  installer: string
  installerPhone: string
  apptTime: string
  acceptedAt: string
  remainingTime: number // minutes (countdown)
  installerStatus: 'accepted' | 'contacted' | 'departed' | 'arrived' | 'installing'
  creator: string
  remark?: string
  priority: 'normal' | 'urgent' | 'vip'
}

// Mock data
const MOCK_ORDERS: PendingVisitOrder[] = [
  {
    id: '1',
    salesNo: 'XS2024010020',
    installNo: 'AZ2024010020-A',
    customerName: '赵先生',
    customerPhone: '13811112222',
    address: '北京市朝阳区建国路88号',
    category: '窗帘',
    installer: '安装师A',
    installerPhone: '13900001111',
    apptTime: '2024-01-27 10:00',
    acceptedAt: '2024-01-26 14:30',
    remainingTime: 1110, // 18.5h
    installerStatus: 'contacted',
    creator: '李四 (远程)',
    priority: 'normal',
    remark: '已联系客户确认明天上午10点上门'
  },
  {
    id: '2',
    salesNo: 'XS2024010021',
    installNo: 'AZ2024010021-A',
    customerName: '钱女士',
    customerPhone: '13922223333',
    address: '北京市海淀区中关村大街',
    category: '墙布',
    installer: '安装师B',
    installerPhone: '13900002222',
    apptTime: '2024-01-26 18:00',
    acceptedAt: '2024-01-26 10:00',
    remainingTime: 495, // 8.25h
    installerStatus: 'departed',
    creator: '王五 (驻店)',
    priority: 'urgent',
    remark: '客户比较着急，请尽量准时；已出发前往客户家，预计30分钟到达'
  },
  {
    id: '3',
    salesNo: 'XS2024010022',
    installNo: 'AZ2024010022-A',
    customerName: '孙先生',
    customerPhone: '13733334444',
    address: '北京市丰台区总部基地',
    category: '墙咔',
    installer: '安装师C',
    installerPhone: '13900003333',
    apptTime: '2024-01-26 16:00',
    acceptedAt: '2024-01-26 09:00',
    remainingTime: 225, // 3.75h
    installerStatus: 'arrived',
    creator: '赵六 (远程)',
    priority: 'vip',
    remark: 'VIP客户，注意服务态度；已到达小区门口，正在登记'
  }
]

export function InstallingPendingVisitView() {
  const supabase = createClient()
  const { user } = useAuth()
  const isInstaller = (user?.role as string) === 'SERVICE_INSTALL'
  const [orders, setOrders] = useState<PendingVisitOrder[]>(MOCK_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<PendingVisitOrder | null>(null)
  const [remindDialogOpen, setRemindDialogOpen] = useState(false)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [reassignReason, setReassignReason] = useState('')
  // 备注编辑模态框状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<PendingVisitOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // Helper functions
  const getInstallerStatusBadge = (status: PendingVisitOrder['installerStatus']) => {
    switch (status) {
      case 'accepted':
        return <PaperBadge className="bg-blue-50 text-blue-700 border-blue-200">已接单</PaperBadge>
      case 'contacted':
        return <PaperBadge className="bg-green-50 text-green-700 border-green-200">已联系</PaperBadge>
      case 'departed':
        return <PaperBadge className="bg-purple-50 text-purple-700 border-purple-200">已出发</PaperBadge>
      case 'arrived':
        return <PaperBadge className="bg-orange-50 text-orange-700 border-orange-200">已到达</PaperBadge>
      case 'installing':
        return <PaperBadge className="bg-indigo-50 text-indigo-700 border-indigo-200">安装中</PaperBadge>
      default:
        return null
    }
  }

  const formatRemainingTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `剩余${h}小时${m}分钟`
  }

  const getTimeStatusColor = (minutes: number) => {
    if (minutes > 720) return 'text-green-600' // > 12h
    if (minutes > 360) return 'text-orange-600' // 6-12h
    return 'text-red-600 font-bold' // < 6h
  }

  // Handle remind order
  const handleRemindOrder = (order: PendingVisitOrder) => {
    setSelectedOrder(order)
    setRemindDialogOpen(true)
  }

  const confirmRemindOrder = async () => {
    if (!selectedOrder) return

    try {
      // Update reminder count and timestamp
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (updateError) throw updateError

      toast.success('催单成功！已发送提醒通知')
      setRemindDialogOpen(false)
      setSelectedOrder(null)

      // Refresh orders list
      setOrders(prev => prev.map(o =>
        o.id === selectedOrder.id
          ? { ...o, /* update if needed */ }
          : o
      ))
    } catch (err) {
      logger.error('催单失败', { resourceType: 'order', resourceId: selectedOrder?.id, details: { error: err } })
      toast.error('催单失败，请重试')
    }
  }

  // Handle reassign order
  const handleReassignOrder = (order: PendingVisitOrder) => {
    setSelectedOrder(order)
    setReassignReason('')
    setReassignDialogOpen(true)
  }

  const confirmReassignOrder = async () => {
    if (!selectedOrder || !reassignReason.trim()) return

    try {
      // Update order status to pending assignment and record reason
      const { error } = await supabase
        .from('orders')
        .update({
          status: ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT,
          reassignment_reason: reassignReason,
          reassigned_at: new Date().toISOString(),
          installer_id: null, // Clear current installer assignment
          installer_name: null
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success('重新分配成功！订单已回到待分配状态')
      setReassignDialogOpen(false)
      setSelectedOrder(null)
      setReassignReason('')

      // Remove from current list
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
    } catch (err) {
      logger.error('重新分配失败', { resourceType: 'order', resourceId: selectedOrder?.id, details: { error: err } })
      toast.error('重新分配失败，请重试')
    }
  }

  const markInstallCompleted = async (order: PendingVisitOrder) => {
    if (!isInstaller) {
      toast.error('无权限：仅安装师可标记安装完成')
      return
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.INSTALLING_PENDING_CONFIRMATION })
        .eq('id', order.id)

      if (error) throw error

      setOrders(prev => prev.filter(o => o.id !== order.id))
      toast.success('已标记安装完成，订单进入待确认')
    } catch (err) {
      logger.error('更新订单状态失败', { resourceType: 'order', resourceId: order.id, details: { error: err } })
      toast.error('更新状态失败')
    }
  }
  // 打开备注编辑模态框
  const openRemarkModal = (order: PendingVisitOrder) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark || '')
    setIsRemarkModalOpen(true)
  }

  // 保存备注
  const saveRemark = () => {
    if (!selectedOrderForRemark) return

    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === selectedOrderForRemark.id) {
        return { ...order, remark: remarkValue }
      }
      return order
    }))

    setIsRemarkModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">正常状态 (&gt;12h)</div>
                <div className="text-3xl font-bold text-green-700 mt-1">
                  {orders.filter(o => o.remainingTime > 720).length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600/80 font-medium">
              进度正常，无需干预
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">紧急状态 (6-12h)</div>
                <div className="text-3xl font-bold text-orange-700 mt-1">
                  {orders.filter(o => o.remainingTime > 360 && o.remainingTime <= 720).length}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="text-2xl">!</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600/80 font-medium">
              建议发送提醒通知
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">超期预警 (&lt;6h)</div>
                <div className="text-3xl font-bold text-red-700 mt-1">
                  {orders.filter(o => o.remainingTime <= 360).length}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600/80 font-medium">
              需立即介入处理
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Order List Area */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10 flex-1">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent p-4 flex justify-between items-center">
          <div className="flex gap-4">
            <PaperInput placeholder="搜索销售单/安装单号" className="w-64 bg-white/50" />
            <PaperInput placeholder="客户姓名/电话/地址" className="w-64 bg-white/50" />
            <PaperButton variant="outline">查询</PaperButton>
          </div>
          <div className="flex gap-2">
            <PaperButton variant="outline" size="small">批量提醒</PaperButton>
            <PaperButton variant="outline" size="small">导出数据</PaperButton>
          </div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
              <PaperTableCell>订单编号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>产品信息</PaperTableCell>
              <PaperTableCell>开单人</PaperTableCell>
              <PaperTableCell>安装师信息</PaperTableCell>
              <PaperTableCell>预约/状态</PaperTableCell>
              <PaperTableCell>时效状态</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.map(order => (
                <PaperTableRow key={order.id} className={order.priority === 'vip' ? 'bg-yellow-50/30' : ''}>
                  <PaperTableCell>
                    <div className="font-mono text-xs text-gray-900">{order.salesNo}</div>
                    <div className="font-mono text-xs text-gray-500">{order.installNo}</div>
                    {order.priority === 'vip' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">VIP</span>}
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div>{order.category}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[100px]" title={order.remark}>{order.remark || '-'}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm text-gray-700">{order.creator}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="font-medium">{order.installer}</div>
                    <div className="text-xs text-gray-500">{order.installerPhone}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm">{order.apptTime}</div>
                    <div className="mt-1">{getInstallerStatusBadge(order.installerStatus)}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className={`text-sm font-medium ${getTimeStatusColor(order.remainingTime)}`}>
                      {formatRemainingTime(order.remainingTime)}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div
                      className="text-xs text-gray-600 max-w-[150px] truncate cursor-pointer hover:bg-gray-50 p-1 rounded"
                      title={order.remark}
                      onDoubleClick={() => openRemarkModal(order)}
                    >
                      {order.remark || '- 双击添加备注'}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex flex-col gap-2">
                      <PaperButton size="small" variant="outline" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleRemindOrder(order)}>催单</PaperButton>
                      <PaperButton size="small" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleReassignOrder(order)}>重新分配</PaperButton>
                      <PaperButton size="small" variant="primary" className="h-7 text-xs" onClick={() => markInstallCompleted(order)}>标记安装完成</PaperButton>
                    </div>
                  </PaperTableCell>
                </PaperTableRow>
              ))}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination
            currentPage={1}
            totalPages={1}
            totalItems={orders.length}
            itemsPerPage={10}
            onPageChange={() => { }}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 4. Remind Order Dialog */}
      <PaperDialog open={remindDialogOpen} onOpenChange={setRemindDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>确认催单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            您确定要对订单 {selectedOrder?.installNo} 进行催单吗？
          </PaperDialogDescription>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setRemindDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton variant="primary" onClick={confirmRemindOrder}>
            确认催单
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 5. Reassign Order Dialog */}
      <PaperDialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>确认重新分配</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            您确定要将订单 {selectedOrder?.installNo} 重新分配吗？安装单将回到安装中-待分配状态。
          </PaperDialogDescription>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">重新分配理由</label>
            <PaperTextarea
              placeholder="请输入重新分配的理由"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setReassignDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmReassignOrder}
            disabled={!reassignReason.trim()}
          >
            确认重新分配
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 6. Remark Edit Modal */}
      <PaperDialog
        open={isRemarkModalOpen}
        onOpenChange={setIsRemarkModalOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>编辑备注</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为订单 {selectedOrderForRemark?.installNo} 编辑备注内容。
          </PaperDialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注内容</label>
              <PaperInput
                type="textarea"
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                placeholder="请输入备注内容..."
                className="w-full h-32 text-sm"
              />
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setIsRemarkModalOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={saveRemark}
          >
            保存
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
