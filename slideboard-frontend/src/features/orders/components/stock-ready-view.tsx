'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter, PaperDialogDescription } from '@/components/ui/paper-dialog'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperToast } from '@/components/ui/paper-toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'

// 订单状态值类型
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

// 备货完成订单类型定义
interface StockReadyOrder {
  id: string
  salesOrderNo: string // 销售单号
  customerName: string // 客户姓名
  customerAddress: string // 客户地址
  designer: string // 负责设计师
  salesPerson: string // 导购员
  expectedDeliveryTime: string // 预计发货时间
  remark: string // 备注
  status: OrderStatus // 订单状态
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
  // 订单详情相关字段
  orderDetails: {
    items: {
      id: string
      productName: string
      quantity: number
      unitPrice: number
      totalPrice: number
      remark?: string
    }[]
    totalAmount: number
    paymentInfo: {
      paymentMethod: string
      paymentStatus: string
      paymentTime?: string
    }
  }
}

// 订单筛选条件类型
interface OrderFilter {
  search: string
  designer: string
  salesPerson: string
  sortBy: 'createdAt' | 'expectedDeliveryTime'
  sortOrder: 'asc' | 'desc'
}

// 分页信息类型
interface Pagination {
  page: number
  pageSize: number
  total: number
}

export function StockReadyView() {
  const supabase = createClient()
  // 状态管理
  const [orders, setOrders] = useState<StockReadyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 对话框状态
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showShipmentDialog, setShowShipmentDialog] = useState(false)

  // 当前操作的订单
  const [currentOrder, setCurrentOrder] = useState<StockReadyOrder | null>(null)

  // 筛选条件
  const [filters, setFilters] = useState<OrderFilter>({
    search: '',
    designer: '',
    salesPerson: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 分页信息
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 提示消息
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // 备注编辑模态框状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<StockReadyOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // 预计发货时间编辑模态框状态
  const [isDeliveryTimeModalOpen, setIsDeliveryTimeModalOpen] = useState(false)
  const [selectedOrderForDeliveryTime, setSelectedOrderForDeliveryTime] = useState<StockReadyOrder | null>(null)
  const [deliveryTimeValue, setDeliveryTimeValue] = useState('')

  // 提醒状态
  const [reminders, setReminders] = useState<{
    orderId: string;
    message: string;
  }[]>([])

  // 模拟数据 - 实际应从API获取


  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockOrders: StockReadyOrder[] = [
        {
          id: '1',
          salesOrderNo: 'SO20241201001',
          customerName: '张三',
          customerAddress: '北京市朝阳区建国路88号',
          designer: '王五',
          salesPerson: '赵六',
          expectedDeliveryTime: '2024-12-10',
          remark: '加急订单',
          status: ORDER_STATUS.STOCK_PREPARED,
          createdAt: '2024-11-26T10:00:00Z',
          updatedAt: '2024-12-01T14:30:00Z',
          orderDetails: {
            items: [
              {
                id: 'item1',
                productName: '窗帘布料',
                quantity: 24,
                unitPrice: 180,
                totalPrice: 4320,
                remark: 'K3套餐布料'
              },
              {
                id: 'item2',
                productName: '窗帘纱料',
                quantity: 24,
                unitPrice: 100,
                totalPrice: 2400,
                remark: 'K3套餐纱料'
              },
              {
                id: 'item3',
                productName: '窗帘轨道',
                quantity: 24,
                unitPrice: 50,
                totalPrice: 1200,
                remark: 'K3套餐轨道'
              }
            ],
            totalAmount: 7920,
            paymentInfo: {
              paymentMethod: '微信支付',
              paymentStatus: '已支付',
              paymentTime: '2024-11-26T10:30:00Z'
            }
          }
        },
        {
          id: '2',
          salesOrderNo: 'SO20241201002',
          customerName: '李四',
          customerAddress: '上海市浦东新区陆家嘴金融中心',
          designer: '钱七',
          salesPerson: '孙八',
          expectedDeliveryTime: '2024-12-15',
          remark: '',
          status: ORDER_STATUS.STOCK_PREPARED,
          createdAt: '2024-11-25T14:00:00Z',
          updatedAt: '2024-12-01T10:00:00Z',
          orderDetails: {
            items: [
              {
                id: 'item4',
                productName: '背景墙材料',
                quantity: 1,
                unitPrice: 6000,
                totalPrice: 6000,
                remark: '定制背景墙'
              }
            ],
            totalAmount: 6000,
            paymentInfo: {
              paymentMethod: '支付宝',
              paymentStatus: '已支付',
              paymentTime: '2024-11-25T14:30:00Z'
            }
          }
        },
        {
          id: '3',
          salesOrderNo: 'SO20241201003',
          customerName: '王五',
          customerAddress: '广州市天河区珠江新城',
          designer: '王五',
          salesPerson: '赵六',
          expectedDeliveryTime: '2024-12-20',
          remark: '需要提前发货',
          status: ORDER_STATUS.STOCK_PREPARED,
          createdAt: '2024-11-24T09:00:00Z',
          updatedAt: '2024-12-01T16:00:00Z',
          orderDetails: {
            items: [
              {
                id: 'item5',
                productName: '墙布',
                quantity: 50,
                unitPrice: 80,
                totalPrice: 4000,
                remark: '全屋墙布'
              }
            ],
            totalAmount: 4000,
            paymentInfo: {
              paymentMethod: '银行转账',
              paymentStatus: '已支付',
              paymentTime: '2024-11-24T10:00:00Z'
            }
          }
        }
      ]

      // 模拟筛选和排序
      let filteredOrders = [...mockOrders]

      // 搜索筛选
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredOrders = filteredOrders.filter(order =>
          order.salesOrderNo.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.customerAddress.toLowerCase().includes(searchLower)
        )
      }

      // 设计师筛选
      if (filters.designer) {
        filteredOrders = filteredOrders.filter(order => order.designer === filters.designer)
      }

      // 导购员筛选
      if (filters.salesPerson) {
        filteredOrders = filteredOrders.filter(order => order.salesPerson === filters.salesPerson)
      }

      // 排序
      filteredOrders.sort((a, b) => {
        const aValue = a[filters.sortBy]
        const bValue = b[filters.sortBy]

        if (aValue < bValue) {
          return filters.sortOrder === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return filters.sortOrder === 'asc' ? 1 : -1
        }
        return 0
      })

      // 模拟分页
      const total = filteredOrders.length
      const startIndex = (pagination.page - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

      setOrders(paginatedOrders)
      setPagination(prev => ({ ...prev, total }))
    } catch (_error) {
      setToast({ message: '获取订单列表失败', type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, pagination.page, pagination.pageSize])

  // 模拟数据 - 实际应从API获取
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 刷新订单列表
  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  // 打开订单详情对话框
  const handleOpenDetailDialog = (order: StockReadyOrder) => {
    setCurrentOrder(order)
    setShowDetailDialog(true)
  }

  // 打开发货确认对话框
  const handleOpenShipmentDialog = (order: StockReadyOrder) => {
    setCurrentOrder(order)
    setShowShipmentDialog(true)
  }

  // 确认发货
  const confirmShipment = async () => {
    if (!currentOrder) return

    try {
      setLoading(true)

      // 1. 验证当前订单状态是否为备货完成
      if (currentOrder.status !== ORDER_STATUS.STOCK_PREPARED) {
        throw new Error('只有备货完成的订单才能发出发货指令')
      }

      // 2. 更新订单状态
      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.PENDING_SHIPMENT })
        .eq('id', currentOrder.id)

      if (error) throw error

      // 3. 从当前列表中移除该订单
      setOrders(prevOrders => prevOrders.filter(order => order.id !== currentOrder.id))

      // 4. 关闭对话框并显示成功提示
      setShowShipmentDialog(false)
      setToast({
        message: '发货指令已发出，订单状态已更新为待发货',
        type: 'success'
      })

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '发货操作失败'
      setToast({
        message,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理筛选条件变化
  const handleFilterChange = <K extends keyof OrderFilter>(field: K, value: OrderFilter[K]) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // 重置到第一页
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 打开备注编辑模态框
  const openRemarkModal = (order: StockReadyOrder) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark || '')
    setIsRemarkModalOpen(true)
  }

  // 保存备注
  const saveRemark = async () => {
    if (!selectedOrderForRemark) return

    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))

      // 更新订单数据
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === selectedOrderForRemark.id
          ? { ...order, remark: remarkValue }
          : order
      ))

      setToast({ message: '备注保存成功', type: 'success' })
      setIsRemarkModalOpen(false)
    } catch (_error) {
      setToast({ message: '备注保存失败', type: 'error' })
    }
  }

  // 打开预计发货时间编辑模态框
  const openDeliveryTimeModal = (order: StockReadyOrder) => {
    setSelectedOrderForDeliveryTime(order)
    setDeliveryTimeValue(order.expectedDeliveryTime || '')
    setIsDeliveryTimeModalOpen(true)
  }

  // 保存预计发货时间
  const saveDeliveryTime = async () => {
    if (!selectedOrderForDeliveryTime) return

    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))

      // 更新订单数据
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === selectedOrderForDeliveryTime.id
          ? { ...order, expectedDeliveryTime: deliveryTimeValue }
          : order
      ))

      setToast({ message: '预计发货时间保存成功', type: 'success' })
      setIsDeliveryTimeModalOpen(false)

      // 检查是否需要更新提醒
      checkDeliveryReminders()
    } catch (_error) {
      setToast({ message: '预计发货时间保存失败', type: 'error' })
    }
  }

  // 检查发货时间提醒
  const checkDeliveryReminders = useCallback(() => {
    const now = new Date()
    const newReminders: { orderId: string; message: string }[] = []

    orders.forEach(order => {
      if (!order.expectedDeliveryTime) return

      const deliveryDate = new Date(order.expectedDeliveryTime)
      const timeDiff = deliveryDate.getTime() - now.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      // 检查是否在48小时内
      if (hoursDiff > 0 && hoursDiff <= 48) {
        newReminders.push({
          orderId: order.id,
          message: `订单 ${order.salesOrderNo} 距离预计发货时间还有 ${Math.ceil(hoursDiff)} 小时`
        })
      }
      // 检查是否在24小时内
      if (hoursDiff > 0 && hoursDiff <= 24) {
        newReminders.push({
          orderId: order.id,
          message: `订单 ${order.salesOrderNo} 距离预计发货时间还有 ${Math.ceil(hoursDiff)} 小时，请注意发货！`
        })
      }
    })

    setReminders(newReminders)
  }, [orders])

  // 定期检查发货时间提醒
  useEffect(() => {
    checkDeliveryReminders()
    const interval = setInterval(checkDeliveryReminders, 60 * 60 * 1000) // 每小时检查一次

    return () => clearInterval(interval)
  }, [checkDeliveryReminders])

  // 获取设计师列表（模拟）
  const designerOptions = [
    { value: '', label: '全部设计师' },
    { value: '王五', label: '王五' },
    { value: '钱七', label: '钱七' }
  ]

  // 获取导购员列表（模拟）
  const salesPersonOptions = [
    { value: '', label: '全部导购员' },
    { value: '赵六', label: '赵六' },
    { value: '孙八', label: '孙八' }
  ]

  // 获取排序选项
  const sortOptions = [
    { value: 'createdAt', label: '创建时间' },
    { value: 'expectedDeliveryTime', label: '预计发货时间' }
  ]

  // 获取排序顺序选项
  const sortOrderOptions = [
    { value: 'desc', label: '降序' },
    { value: 'asc', label: '升序' }
  ]

  return (
    <div className="space-y-6">
      {/* 发货提醒区域 */}
      {reminders.length > 0 && (
        <PaperCard className="bg-yellow-50 border-yellow-200">
          <PaperCardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600 font-medium">⚠️ 发货提醒</span>
            </div>
            <div className="space-y-2">
              {reminders.map((reminder, index) => (
                <div key={index} className="text-sm text-yellow-800">
                  {reminder.message}
                </div>
              ))}
            </div>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-ink-800 mb-2">备货完成 - 订单管理</h3>
                <p className="text-sm text-ink-500 leading-relaxed max-w-[80%]">
                  销售团队处理已经备货完成的销售订单，发出发货指令
                </p>
                <div className="mt-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <span className="text-xs font-medium px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    待处理
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-ink-500 mb-1">备货完成订单</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-ink-800">{pagination.total}</h3>
                  <span className="text-sm text-ink-400">单</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 筛选和搜索区域 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperCardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* 左侧搜索和筛选区域 */}
            <div className="flex flex-wrap gap-2 flex-1 min-w-[300px]">
              <PaperInput
                placeholder="搜索销售单号、客户姓名或地址"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="flex-1 min-w-[200px]"
              />

              <select
                value={filters.designer}
                onChange={(e) => handleFilterChange('designer', e.target.value)}
                className="border rounded px-3 py-2 min-w-[120px]"
                aria-label="设计师"
              >
                {designerOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.salesPerson}
                onChange={(e) => handleFilterChange('salesPerson', e.target.value)}
                className="border rounded px-3 py-2 min-w-[120px]"
                aria-label="导购员"
              >
                {salesPersonOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 右侧排序区域 */}
            <div className="flex space-x-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as 'createdAt' | 'expectedDeliveryTime')}
                className="border rounded px-3 py-2 min-w-[120px]"
                aria-label="排序字段"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="border rounded px-3 py-2 min-w-[80px]"
                aria-label="排序顺序"
              >
                {sortOrderOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 订单列表 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-ink-600">共 {pagination.total} 条订单</div>
          <PaperButton variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中...' : '刷新'}
          </PaperButton>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell className="pl-6">销售单号</PaperTableCell>
              <PaperTableCell>客户姓名</PaperTableCell>
              <PaperTableCell>客户地址</PaperTableCell>
              <PaperTableCell>负责设计师</PaperTableCell>
              <PaperTableCell>导购员</PaperTableCell>
              <PaperTableCell>预计发货时间</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {loading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={8} className="text-center py-8">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={8} className="text-center text-gray-500 py-8">
                    暂无备货完成的订单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((order) => (
                  <PaperTableRow key={order.id}>
                    <PaperTableCell className="pl-6">{order.salesOrderNo}</PaperTableCell>
                    <PaperTableCell>{order.customerName}</PaperTableCell>
                    <PaperTableCell>{order.customerAddress}</PaperTableCell>
                    <PaperTableCell>{order.designer}</PaperTableCell>
                    <PaperTableCell>{order.salesPerson}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center gap-2">
                        <div className="truncate text-xs text-gray-500">
                          {order.expectedDeliveryTime || '-'}
                        </div>
                        <PaperButton
                          variant="outline"
                          size="small"
                          onClick={() => openDeliveryTimeModal(order)}
                          className="h-6 px-2 text-xs text-blue-600"
                        >
                          编辑
                        </PaperButton>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div
                        className="truncate text-xs text-gray-500 max-w-[150px] cursor-pointer hover:bg-gray-50 p-1 rounded"
                        title={order.remark}
                        onDoubleClick={() => openRemarkModal(order)}
                      >
                        {order.remark || '- 双击添加备注'}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-wrap gap-2">
                        <PaperButton
                          size="small"
                          variant="outline"
                          onClick={() => handleOpenDetailDialog(order)}
                        >
                          详情
                        </PaperButton>
                        <PaperButton
                          size="small"
                          variant="primary"
                          onClick={() => handleOpenShipmentDialog(order)}
                        >
                          发货
                        </PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
        </PaperCardContent>

        {/* 分页控件 */}
        {!loading && pagination.total > 0 && (
          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-ink-500">
              显示 {((pagination.page - 1) * pagination.pageSize) + 1} 到 {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
            </div>
            <div className="flex space-x-2">
              <PaperButton
                size="small"
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                上一页
              </PaperButton>
              <PaperButton
                size="small"
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
              >
                下一页
              </PaperButton>
            </div>
          </div>
        )}
      </PaperCard>

      {/* 订单详情对话框 */}
      <PaperDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        className="max-w-4xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>订单详情 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          {currentOrder && (
            <div className="space-y-6">
              {/* 基础订单信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-ink-800 mb-2">基础信息</h4>
                  <div className="space-y-2">
                    <p><strong>销售单号：</strong>{currentOrder.salesOrderNo}</p>
                    <p><strong>客户姓名：</strong>{currentOrder.customerName}</p>
                    <p><strong>客户地址：</strong>{currentOrder.customerAddress}</p>
                    <p><strong>负责设计师：</strong>{currentOrder.designer}</p>
                    <p><strong>导购员：</strong>{currentOrder.salesPerson}</p>
                    <p><strong>预计发货时间：</strong>{currentOrder.expectedDeliveryTime}</p>
                    <p><strong>订单状态：</strong>{currentOrder.status === ORDER_STATUS.STOCK_PREPARED ? '备货完成' : currentOrder.status}</p>
                    <p><strong>备注：</strong>{currentOrder.remark || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-ink-800 mb-2">支付信息</h4>
                  <div className="space-y-2">
                    <p><strong>支付方式：</strong>{currentOrder.orderDetails.paymentInfo.paymentMethod}</p>
                    <p><strong>支付状态：</strong>{currentOrder.orderDetails.paymentInfo.paymentStatus}</p>
                    {currentOrder.orderDetails.paymentInfo.paymentTime && (
                      <p><strong>支付时间：</strong>{new Date(currentOrder.orderDetails.paymentInfo.paymentTime).toLocaleString()}</p>
                    )}
                    <p><strong>订单总金额：</strong>¥{currentOrder.orderDetails.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 商品明细 */}
              <div>
                <h4 className="font-medium text-ink-800 mb-3">商品明细</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrder.orderDetails.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.unitPrice}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.totalPrice}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.remark || '-'}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">总计：</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">¥{currentOrder.orderDetails.totalAmount.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 发货确认对话框 */}
      <PaperDialog
        open={showShipmentDialog}
        onOpenChange={setShowShipmentDialog}
        className="max-w-md"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认发货 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <p className="text-ink-600">
              确定要为订单 <strong>{currentOrder?.salesOrderNo}</strong> 发出发货指令吗？
            </p>
            <p className="text-ink-600">
              操作后，订单状态将更新为<strong>待发货</strong>，请谨慎操作。
            </p>
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong>此操作将触发实际发货流程，请确保所有商品已准备就绪。
              </p>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowShipmentDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmShipment}
          >
            确认发货
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 提示消息 */}
      {toast && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      {/* 备注编辑模态框 */}
      <PaperDialog
        open={isRemarkModalOpen}
        onOpenChange={setIsRemarkModalOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>编辑备注</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为订单 {selectedOrderForRemark?.salesOrderNo} 编辑备注内容。
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

      {/* 预计发货时间编辑模态框 */}
      <PaperDialog
        open={isDeliveryTimeModalOpen}
        onOpenChange={setIsDeliveryTimeModalOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>编辑预计发货时间</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为订单 {selectedOrderForDeliveryTime?.salesOrderNo} 编辑预计发货时间。
          </PaperDialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预计发货时间</label>
              <input
                type="date"
                value={deliveryTimeValue}
                onChange={(e) => setDeliveryTimeValue(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setIsDeliveryTimeModalOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={saveDeliveryTime}
            disabled={!deliveryTimeValue}
          >
            保存
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
