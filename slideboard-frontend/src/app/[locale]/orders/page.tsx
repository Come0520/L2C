'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar, PaperTablePagination } from '@/components/ui/paper-table'
import SpotlightCard from '@/components/ui/spotlight-card'
import { useSalesOrders } from '@/hooks/useSalesOrders'
import { BaseOrder } from '@/shared/types/order'
import { TRACK_PAGE_VIEW } from '@/utils/analytics'

const statusLinks = [
  // 销售单状态流程
  { href: '/orders/status/draft', title: '草稿' },
  { href: '/orders/status/confirmed', title: '已确认' },
  { href: '/orders/status/purchasing', title: '采购中' },
  { href: '/orders/status/shipping', title: '物流中' },
  { href: '/orders/status/installing', title: '安装中' },
  { href: '/orders/status/confirming', title: '待确认' },
  { href: '/orders/status/reconciliation', title: '待对账' },
  { href: '/orders/status/completed', title: '已完成' },
  { href: '/orders/status/cancelled', title: '已取消' },

  // 测量单状态流程
  { href: '/orders/status/measurement-pending', title: '测量-待分配' },
  { href: '/orders/status/measurement-assigning', title: '测量-分配中' },
  { href: '/orders/status/measurement-waiting', title: '测量-待上门' },
  { href: '/orders/status/measurement-confirming', title: '测量-待确认' },
  { href: '/orders/status/measurement-completed', title: '测量-已完成' },
  { href: '/orders/status/measurement-cancelled', title: '测量-已取消' },

  // 安装单状态流程
  { href: '/orders/status/installation-pending', title: '安装-待分配' },
  { href: '/orders/status/installation-assigning', title: '安装-分配中' },
  { href: '/orders/status/installation-waiting', title: '安装-待上门' },
  { href: '/orders/status/installation-confirming', title: '安装-待确认' },
  { href: '/orders/status/installation-completed', title: '安装-已完成' },
  { href: '/orders/status/installation-cancelled', title: '安装-已取消' },
]

export default function OrdersOverviewPage() {
  // Track page view
  useEffect(() => {
    TRACK_PAGE_VIEW('Orders List')
  }, [])

  // Order list state
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Get all orders
  const { data: rawResponse, isLoading } = useSalesOrders(page, pageSize)

  // FIXME: Temporary any cast to resolve build error. Will replace with proper generated types in Phase 4.
  const response = rawResponse as any
  const orders = (response?.data?.orders || []) as BaseOrder[]
  const total = response?.data?.total || 0

  // Format waiting time
  const formatWaiting = (updatedAt?: string): string => {
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

  // Calculate waiting hours
  const calculateWaitingHours = (updatedAt?: string): number => {
    if (!updatedAt) return 0
    const now = new Date()
    const updatedDate = new Date(updatedAt)
    const diff = now.getTime() - updatedDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">订单管理</h1>
              <p className="text-theme-text-secondary mt-1">按状态机管理销售全流程。</p>
            </div>
            <Link href="/orders/create">
              <PaperButton variant="primary">新建订单</PaperButton>
            </Link>
          </div>

          <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
            <SpotlightCard.Header>
              <SpotlightCard.Title>状态筛选</SpotlightCard.Title>
            </SpotlightCard.Header>
            <SpotlightCard.Content>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {statusLinks.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <PaperButton variant="outline" className="w-full justify-start text-sm">
                      {s.title}
                    </PaperButton>
                  </Link>
                ))}
              </div>
            </SpotlightCard.Content>
          </SpotlightCard>

          <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
            <SpotlightCard.Header>
              <SpotlightCard.Title>全部订单</SpotlightCard.Title>
            </SpotlightCard.Header>
            <SpotlightCard.Content className="p-0">
              <PaperTableToolbar className="bg-transparent border-theme-border">
                <div className="text-sm text-theme-text-secondary">共 {total} 条订单</div>
              </PaperTableToolbar>

              <PaperTable className="border-0">
                <PaperTableHeader className="bg-theme-bg-tertiary">
                  <PaperTableRow>
                    <PaperTableCell isHeader>订单号</PaperTableCell>
                    <PaperTableCell isHeader>客户</PaperTableCell>
                    <PaperTableCell isHeader>状态</PaperTableCell>
                    <PaperTableCell isHeader>金额</PaperTableCell>
                    <PaperTableCell isHeader>更新时间</PaperTableCell>
                    <PaperTableCell isHeader>停留时间</PaperTableCell>
                    <PaperTableCell isHeader>操作</PaperTableCell>
                  </PaperTableRow>
                </PaperTableHeader>
                <PaperTableBody>
                  {isLoading ? (
                    <PaperTableRow>
                      <PaperTableCell colSpan={7} className="text-center py-12 text-theme-text-secondary">
                        加载中...
                      </PaperTableCell>
                    </PaperTableRow>
                  ) : orders.length === 0 ? (
                    <PaperTableRow>
                      <PaperTableCell colSpan={7} className="text-center py-12 text-theme-text-secondary">
                        暂无订单
                      </PaperTableCell>
                    </PaperTableRow>
                  ) : (
                    orders.map((order: any) => (
                      <PaperTableRow key={order.id}>
                        <PaperTableCell className="font-mono text-sm">{order.orderNo}</PaperTableCell>
                        <PaperTableCell className="font-medium text-theme-text-primary">{order.customerName}</PaperTableCell>
                        <PaperTableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary border border-theme-border">
                            {order.status}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>¥{order.totalAmount}</PaperTableCell>
                        <PaperTableCell className="text-theme-text-secondary text-sm">{new Date(order.updatedAt).toLocaleString()}</PaperTableCell>
                        <PaperTableCell>
                          <span className={calculateWaitingHours(order.updatedAt) > 24 ? 'text-rose-500 font-medium' : 'text-theme-text-secondary'}>
                            {formatWaiting(order.updatedAt)}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>
                          <Link href={`/orders/${order.id}`}>
                            <PaperButton variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                              查看
                            </PaperButton>
                          </Link>
                        </PaperTableCell>
                      </PaperTableRow>
                    ))
                  )}
                </PaperTableBody>
              </PaperTable>

              <div className="p-4 border-t border-theme-border">
                <PaperTablePagination
                  currentPage={page}
                  totalPages={Math.ceil(total / pageSize)}
                  totalItems={total}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                  className="text-theme-text-secondary"
                />
              </div>
            </SpotlightCard.Content>
          </SpotlightCard>
        </div>
      </div>
    </DashboardLayout>
  )
}
