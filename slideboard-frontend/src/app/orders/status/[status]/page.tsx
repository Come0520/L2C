'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { BatchActionBar } from '@/components/ui/batch-action-bar'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar, PaperTablePagination } from '@/components/ui/paper-table'
import { ReassignModal } from '@/components/ui/reassign-modal'
import { ShareModal } from '@/components/ui/share-modal'
import { toast } from '@/components/ui/toast'
import { ServiceDispatchOnly, FinanceOnly, InstallerOnly, MeasurerOnly } from '@/features/orders/components/permissions'
import { useSalesOrders } from '@/hooks/useSalesOrders'
import { getOrderStatusConfig } from '@/lib/state-machine/order-state-machine'
import { createClient } from '@/lib/supabase/client'
import { assignmentService } from '@/services/assignment.client'
import { batchService } from '@/services/batch.client'
import { shareService } from '@/services/share.client'
import { BaseOrder } from '@/shared/types/order'
const StatePage = dynamic(() => import('@/features/orders/components/state-page').then(mod => ({ default: mod.StatePage })))
const MeasuringPendingAssignmentView = dynamic(() => import('@/features/orders/components/measuring-pending-assignment-view').then(mod => ({ default: mod.MeasuringPendingAssignmentView })))
const MeasuringAssignedView = dynamic(() => import('@/features/orders/components/measuring-assigned-view').then(mod => ({ default: mod.MeasuringAssignedView })))
const MeasuringPendingVisitView = dynamic(() => import('@/features/orders/components/measuring-pending-visit-view').then(mod => ({ default: mod.MeasuringPendingVisitView })))
const PlanPendingConfirmationView = dynamic(() => import('@/features/orders/components/plan-pending-confirmation-view').then(mod => ({ default: mod.PlanPendingConfirmationView })))
const MeasuringPendingConfirmationView = dynamic(() => import('@/features/orders/components/measuring-pending-confirmation-view').then(mod => ({ default: mod.MeasuringPendingConfirmationView })))
const PendingSurveyView = dynamic(() => import('@/features/orders/components/pending-survey-view').then(mod => ({ default: mod.PendingSurveyView })))
const OrderCreateView = dynamic(() => import('@/features/orders/components/order-create-view').then(mod => ({ default: mod.OrderCreateView })))
const PendingPushView = dynamic(() => import('@/features/orders/components/pending-push-view').then(mod => ({ default: mod.PendingPushView })))
const PendingPlaceOrderView = dynamic(() => import('@/features/orders/components/pending-place-order-view').then(mod => ({ default: mod.PendingPlaceOrderView })))
const StockReadyView = dynamic(() => import('@/features/orders/components/stock-ready-view').then(mod => ({ default: mod.StockReadyView })))
const ProductionPreparationView = dynamic(() => import('@/features/orders/components/production-preparation-view').then(mod => ({ default: mod.ProductionPreparationView })))
const PendingShipmentView = dynamic(() => import('@/features/orders/components/pending-shipment-view').then(mod => ({ default: mod.PendingShipmentView })))
const InstallingPendingAssignmentView = dynamic(() => import('@/features/orders/components/installing-pending-assignment-view').then(mod => ({ default: mod.InstallingPendingAssignmentView })))
const InstallingAssignmentInProgressView = dynamic(() => import('@/features/orders/components/installing-assignment-in-progress-view').then(mod => ({ default: mod.InstallingAssignmentInProgressView })))
const InstallingPendingVisitView = dynamic(() => import('@/features/orders/components/installing-pending-visit-view').then(mod => ({ default: mod.InstallingPendingVisitView })))
const InstallingPendingConfirmationView = dynamic(() => import('@/features/orders/components/installing-pending-confirmation-view').then(mod => ({ default: mod.InstallingPendingConfirmationView })))
const PendingReconciliationView = dynamic(() => import('@/features/orders/components/pending-reconciliation-view').then(mod => ({ default: mod.PendingReconciliationView })))
const PendingInvoiceView = dynamic(() => import('@/features/orders/components/pending-invoice-view').then(mod => ({ default: mod.PendingInvoiceView })))



// Interfaces definition
interface Measurer {
  id: string
  name: string
  phone: string
}

interface MeasurementOrder {
  id: string
  measurer_id: string
  measurer: Measurer[]
  assigned_at: string
  last_urged_at?: string
}

interface Installer {
  id: string
  name: string
  phone: string
}

interface InstallationOrder {
  id: string
  installer_id: string
  installer: Installer[]
  assigned_at: string
  last_urged_at?: string
}

interface SalesPerson {
  id: string
  name: string
}

interface Order {
  id: string
  customer_name: string
  project_address: string
  address: string
  salesNo: string
  surveyNo: string
  customer: { name: string }
  measurer: string | { name: string; phone: string }
  measurerPhone: string
  sales: string | { name: string }
  salesName: string
  statusUpdatedAt: string
  waitingTime: string
  measurement_order?: MeasurementOrder[]
  installation_order?: InstallationOrder[]
  sales_person: SalesPerson
  creator: string
}

interface OrderWithMeasurement extends Order {
  measurement_order: MeasurementOrder[]
}


type SurveyAssignField = 'customer' | 'address' | 'measurer' | 'salesName'
const filterConfig: Record<string, { fields: SurveyAssignField[]; placeholders: Record<SurveyAssignField, string> }> = {
  'surveying-assigning': {
    fields: ['customer', 'address', 'measurer', 'salesName'],
    placeholders: {
      customer: '客户姓名',
      address: '项目地址',
      measurer: '测量师',
      salesName: '销售姓名'
    }
  }
}


export default function OrderStatusPage() {
  const params = useParams()
  const status = params.status as string
  const config = getOrderStatusConfig(status)
  const title = config?.label || '订单状态'
  const actionsForStatus = config?.actions || []
  const supabase = createClient()

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; email?: string; role?: string }>>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')

  const { data: rawResponse, isLoading, refetch } = useSalesOrders(page, pageSize, status, filters.customer)
  // FIXME: Temporary any cast to resolve build error. Will replace with proper generated types in Phase 4.
  const response = rawResponse as any
  const orders = (response?.data?.orders || []) as BaseOrder[]
  const total = response?.data?.total || 0

  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase.from('users').select('id,name,email,role').limit(200)
      const normalized = Array.isArray(data)
        ? data.map(u => ({
          id: String((u as { id: string }).id),
          name: String((u as { name: string }).name),
          email: typeof (u as { email?: unknown }).email === 'string' ? (u as { email?: string }).email : undefined,
          role: typeof (u as { role?: unknown }).role === 'string' ? (u as { role?: string }).role : undefined,
        }))
        : []
      setUsers(normalized)
    }
    loadUsers()
  }, [supabase])

  const handleAction = (action: string) => {
    if (action === 'batch' && selectedOrders.length > 0) {
      handleBatchUrge()
    }
  }

  const handleBatchUrge = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`id, customer_name, project_address, assigned_at, measurement_order:measurement_orders(*, measurer:measurers(*))`)
        .in('id', selectedOrders)

      if (ordersError) throw ordersError
      if (!ordersData) throw new Error('No orders found')

      for (const order of ordersData as unknown as Array<OrderWithMeasurement>) {
        const mo = order.measurement_order?.[0]
        const firstMeasurer = mo?.measurer?.[0]
        if (!mo || !firstMeasurer) continue

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: firstMeasurer.id,
            title: '批量催单提醒',
            content: `订单 ${order.id} 需要尽快处理，客户 ${order.customer_name} 的测量任务等待中`,
            type: 'urge_order',
            is_read: false,
            metadata: {
              orderId: order.id,
              customerName: order.customer_name,
              address: order.project_address,
              waitingTime: calculateWaitingTime(mo.assigned_at)
            }
          })

        if (notificationError) throw notificationError

        const { error: updateError } = await supabase
          .from('measurement_orders')
          .update({ last_urged_at: new Date().toISOString() })
          .eq('id', mo.id)

        if (updateError) throw updateError
      }

      toast.success('批量催单消息已发送给测量师')
      refetch()
      setSelectedOrders([])
    } catch (_error) {
      toast.error('批量催单失败，请重试')
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId])
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleUrgeOrder = async (orderId: string) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`id, customer_name, project_address, assigned_at, measurement_order:measurement_orders(*, measurer:measurers(*))`)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const measurementOrder = order?.measurement_order?.[0] as any
      if (!order || !measurementOrder || !measurementOrder.measurer || measurementOrder.measurer.length === 0) throw new Error('Order or measurer not found')

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user_id: (measurementOrder.measurer[0] as any).id,
          title: '催单提醒',
          content: `订单 ${order.id} 需要尽快处理，客户 ${order.customer_name} 的测量任务等待中`,
          type: 'urge_order',
          is_read: false,
          metadata: {
            orderId: order.id,
            customerName: order.customer_name,
            address: order.project_address,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            waitingTime: calculateWaitingTime((measurementOrder as any).assigned_at)
          }
        })

      // Send Feishu notification if enabled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const measurer = (measurementOrder as any).measurer?.[0] as any
      if (measurer?.feishu_open_id) {
        // TODO: Implement Feishu notification logic
        console.log('Sending Feishu notification to', measurer.feishu_open_id)
      }

      if (notificationError) throw notificationError

      const { error: updateError } = await supabase
        .from('measurement_orders')
        .update({ last_urged_at: new Date().toISOString() })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', (measurementOrder as any).id)

      if (updateError) throw updateError

      toast.success('催单消息已发送给测量师')
      refetch()
    } catch (_error) {
      toast.error('催单失败，请重试')
    }
  }

  const handleExportSelected = async () => {
    try {
      setIsExporting(true)
      const { blob, filename } = await batchService.exportData('orders', selectedOrders)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `orders-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('已导出所选订单')
    } catch (_e) {
      toast.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenReassign = () => {
    if (selectedOrders.length === 0) return
    setIsReassignOpen(true)
  }

  const handleDoReassign = async (_ids: string[], userId: string) => {
    try {
      for (const id of selectedOrders) {
        await assignmentService.reassignOrder(id, userId)
      }
      toast.success('重新分配成功')
      setIsReassignOpen(false)
      setSelectedOrders([])
      refetch()
    } catch (_e) {
      toast.error('重新分配失败')
    }
  }

  const handleShareOrder = async (orderId: string) => {
    try {
      const active = await shareService.getActiveToken('order', orderId)
      const token = active ? active.token : (await shareService.generateToken('order', orderId)).token
      const link = `${window.location.origin}/api/sharing/validate?token=${token}`
      setShareLink(link)
      setIsShareModalOpen(true)
    } catch (_e) {
      toast.error('生成分享链接失败')
    }
  }

  function calculateWaitingTime(assignedAt: string): string {
    const now = new Date()
    const assignedDate = new Date(assignedAt)
    const diff = now.getTime() - assignedDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  function calculateWaitingHours(updatedAt?: string): number {
    if (!updatedAt) return 0
    const now = new Date()
    const updatedDate = new Date(updatedAt)
    const diff = now.getTime() - updatedDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours
  }

  function formatWaiting(updatedAt?: string): string {
    if (!updatedAt) return '-'
    const now = new Date()
    const updatedDate = new Date(updatedAt)
    const diff = now.getTime() - updatedDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1) // 重置到第一页
  }

  if (status === 'draft-sign') {
    return (
      <DashboardLayout>
        <OrderCreateView />
      </DashboardLayout>
    )
  }

  if (status === 'surveying-pending-assignment') {
    return (
      <StatePage title={title}>
        <ServiceDispatchOnly>
          <MeasuringPendingAssignmentView />
        </ServiceDispatchOnly>
      </StatePage>
    )
  }

  if (status === 'surveying-assigning') {
    return (
      <StatePage title={title} actions={actionsForStatus.map(a => ({ ...a, onClick: handleAction }))}>
        <ServiceDispatchOnly>
          <MeasuringAssignedView />
        </ServiceDispatchOnly>
      </StatePage>
    )
  }

  if (status === 'surveying-pending-visit') {
    return (
      <StatePage title={title}>
        <MeasurerOnly>
          <MeasuringPendingVisitView />
        </MeasurerOnly>
      </StatePage>
    )
  }

  if (status === 'surveying-pending-confirmation') {
    return (
      <StatePage title={title}>
        <MeasuringPendingConfirmationView />
      </StatePage>
    )
  }

  if (status === 'pending-survey') {
    return (
      <StatePage title={title}>
        <PendingSurveyView />
      </StatePage>
    )
  }

  if (status === 'plan-pending-confirmation') {
    return (
      <StatePage title={title}>
        <PlanPendingConfirmationView />
      </StatePage>
    )
  }

  if (status === 'pending-push') {
    return (
      <StatePage title={title}>
        <PendingPushView />
      </StatePage>
    )
  }

  if (status === 'pending-place-order') {
    return (
      <StatePage title={title}>
        <PendingPlaceOrderView />
      </StatePage>
    )
  }

  if (status === 'stock-ready') {
    return (
      <StatePage title={title}>
        <StockReadyView />
      </StatePage>
    )
  }

  if (status === 'in-production') {
    return (
      <StatePage title={title}>
        <ProductionPreparationView />
      </StatePage>
    )
  }

  if (status === 'pending-shipment') {
    return (
      <StatePage title={title}>
        <PendingShipmentView />
      </StatePage>
    )
  }

  if (status === 'installing-pending-assignment') {
    return (
      <StatePage title={title}>
        <ServiceDispatchOnly>
          <InstallingPendingAssignmentView />
        </ServiceDispatchOnly>
      </StatePage>
    )
  }

  if (status === 'installing-assigning') {
    return (
      <StatePage title={title}>
        <ServiceDispatchOnly>
          <InstallingAssignmentInProgressView />
        </ServiceDispatchOnly>
      </StatePage>
    )
  }

  if (status === 'installing-pending-visit') {
    return (
      <StatePage title={title}>
        <InstallerOnly>
          <InstallingPendingVisitView />
        </InstallerOnly>
      </StatePage>
    )
  }

  if (status === 'installing-pending-confirmation') {
    return (
      <StatePage title={title}>
        <InstallingPendingConfirmationView />
      </StatePage>
    )
  }

  if (status === 'pending-reconciliation') {
    return (
      <StatePage title={title}>
        <FinanceOnly>
          <PendingReconciliationView />
        </FinanceOnly>
      </StatePage>
    )
  }

  if (status === 'pending-invoice') {
    return (
      <StatePage title={title}>
        <FinanceOnly>
          <PendingInvoiceView />
        </FinanceOnly>
      </StatePage>
    )
  }

  return (
    <StatePage title={title} actions={actionsForStatus.map(a => ({ ...a, onClick: handleAction }))}>
      {/* 筛选栏 - 仅测量中-分配中页面显示 */}
      {status === 'surveying-assigning' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap gap-4">
            {filterConfig[status]?.fields.map((field) => (
              <div key={field} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {filterConfig[status]?.placeholders[field]}
                </label>
                <input
                  placeholder={`请输入${filterConfig[status]?.placeholders[field]}`}
                  value={(filters as Record<SurveyAssignField, string>)[field] || ''}
                  onChange={(e) => handleFilterChange(field, e.target.value)}
                  className="w-48 border rounded px-2 py-1"
                />
              </div>
            ))}
            <div className="flex items-end">
              <button onClick={() => setFilters({})} className="border px-3 py-1 rounded">重置</button>
            </div>
          </div>
        </div>
      )}

      <PaperCard>
        <PaperTableToolbar>
          {/* 只有非测量中状态显示新建和导入按钮 */}
          {!status.startsWith('surveying-') && (
            <div className="flex items-center space-x-2">
              <PaperButton variant="primary">新建</PaperButton>
              <PaperButton variant="outline">导入</PaperButton>
            </div>
          )}
          <div className="text-sm text-ink-500">共 {total} 条</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={isLoading || orders.length === 0}
                />
              </PaperTableCell>
              <PaperTableCell>订单号</PaperTableCell>
              <PaperTableCell>客户</PaperTableCell>
              <PaperTableCell>地址</PaperTableCell>
              <PaperTableCell>测量师</PaperTableCell>
              <PaperTableCell>测量师电话</PaperTableCell>
              <PaperTableCell>销售姓名</PaperTableCell>
              <PaperTableCell>等待时长</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center text-gray-500">
                    {isLoading ? '加载中...' : '暂无数据'}
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((o) => (
                  <PaperTableRow key={o.id}>
                    <PaperTableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(o.id)}
                        onChange={(e) => handleSelectOrder(o.id, e.target.checked)}
                        disabled={isLoading}
                      />
                    </PaperTableCell>
                    <PaperTableCell>{o.id}</PaperTableCell>
                    <PaperTableCell>{o.customerName}</PaperTableCell>
                    <PaperTableCell>{o.projectAddress}</PaperTableCell>
                    <PaperTableCell>-</PaperTableCell>
                    <PaperTableCell>-</PaperTableCell>
                    <PaperTableCell>{o.sales || '-'}</PaperTableCell>
                    <PaperTableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${calculateWaitingHours(o.statusUpdatedAt) >= 8
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {formatWaiting(o.statusUpdatedAt)}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        {status === 'surveying-assigning' ? (
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => handleUrgeOrder(o.id)}
                          >
                            催单
                          </PaperButton>
                        ) : (
                          <>
                            <PaperButton size="small" variant="outline">查看</PaperButton>
                            <PaperButton size="small" variant="outline">推进</PaperButton>
                            <PaperButton size="small" variant="outline" onClick={() => handleShareOrder(o.id)}>分享</PaperButton>
                          </>
                        )}
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        </PaperCardContent>
      </PaperCard>
      <BatchActionBar
        selectedCount={selectedOrders.length}
        actions={[
          { id: 'export', label: isExporting ? '导出中…' : '导出所选', variant: 'outline', onClick: handleExportSelected, disabled: isExporting },
          { id: 'reassign', label: '重新分配', variant: 'primary', onClick: handleOpenReassign },
        ]}
        onClearSelection={() => setSelectedOrders([])}
      />
      <ReassignModal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        items={orders.filter((o) => selectedOrders.includes(o.id))}
        users={users}
        onReassign={handleDoReassign}
        getDisplayName={(o) => o.id}
        title="重新分配订单"
        itemType="订单"
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareLink={shareLink}
        title="分享订单"
      />
    </StatePage>
  )
}
