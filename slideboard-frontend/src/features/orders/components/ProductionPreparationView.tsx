'use client'

import { format } from 'date-fns'
import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle, PaperCardDescription } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter, PaperDialogDescription } from '@/components/ui/paper-dialog'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTextarea } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { VanishInput } from '@/components/ui/vanish-input'


// Mock data types
interface ProductionOrder {
  id: string
  salesNo: string
  customerName: string
  customerPhone: string
  address: string
  totalAmount: number
  createdAt: string
  stayDuration: number // days
  estimatedShipDate: string // ISO date string
  remark: string
  productionOrders: ProductionDetail[]
  status: 'preparing' | 'partial' | 'completed'
  progress: number // percentage
  shipReminderStatus: 'none' | 'warning' | 'urgent' // none: >48h, warning: 24-48h, urgent: <24h
}

interface ProductionDetail {
  id: string
  productionNo: string
  productName: string
  quantity: number
  status: 'pending' | 'processing' | 'completed'
  completedAt?: string
}

// Helper function to calculate ship reminder status
const calculateShipReminderStatus = (estimatedShipDate: string): 'none' | 'warning' | 'urgent' => {
  const now = new Date()
  const shipDate = new Date(estimatedShipDate)
  const diffTime = shipDate.getTime() - now.getTime()
  const diffHours = diffTime / (1000 * 60 * 60)

  if (diffHours < 0) return 'none' // Already shipped
  if (diffHours < 24) return 'urgent' // Less than 24 hours
  if (diffHours < 48) return 'warning' // 24-48 hours
  return 'none' // More than 48 hours
}

// Mock data
const MOCK_ORDERS: ProductionOrder[] = [
  {
    id: '1',
    salesNo: 'XS2024010020',
    customerName: '赵先生',
    customerPhone: '13811112222',
    address: '北京市朝阳区建国路88号',
    totalAmount: 12800,
    createdAt: '2024-01-15',
    stayDuration: 5,
    estimatedShipDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 36 hours from now (warning)
    remark: '客户要求使用环保材料，注意包装保护',
    productionOrders: [
      { id: '101', productionNo: 'PD2024010020-01', productName: '窗帘布料', quantity: 3, status: 'completed', completedAt: '2024-01-18' },
      { id: '102', productionNo: 'PD2024010020-02', productName: '窗帘轨道', quantity: 2, status: 'completed', completedAt: '2024-01-19' },
      { id: '103', productionNo: 'PD2024010020-03', productName: '窗帘配件', quantity: 1, status: 'completed', completedAt: '2024-01-20' }
    ],
    status: 'preparing',
    progress: 100,
    shipReminderStatus: calculateShipReminderStatus(new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString())
  },
  {
    id: '2',
    salesNo: 'XS2024010021',
    customerName: '钱女士',
    customerPhone: '13922223333',
    address: '北京市海淀区中关村大街',
    totalAmount: 8900,
    createdAt: '2024-01-10',
    stayDuration: 10,
    estimatedShipDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now (urgent)
    remark: '加急订单，优先处理',
    productionOrders: [
      { id: '201', productionNo: 'PD2024010021-01', productName: '墙布', quantity: 50, status: 'completed', completedAt: '2024-01-15' },
      { id: '202', productionNo: 'PD2024010021-02', productName: '墙布胶', quantity: 10, status: 'processing' },
      { id: '203', productionNo: 'PD2024010021-03', productName: '施工工具', quantity: 2, status: 'pending' }
    ],
    status: 'preparing',
    progress: 33.3,
    shipReminderStatus: calculateShipReminderStatus(new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString())
  },
  {
    id: '3',
    salesNo: 'XS2024010022',
    customerName: '孙先生',
    customerPhone: '13733334444',
    address: '北京市丰台区总部基地',
    totalAmount: 15600,
    createdAt: '2024-01-05',
    stayDuration: 15,
    estimatedShipDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now (none)
    remark: 'VIP客户，注意服务质量',
    productionOrders: [
      { id: '301', productionNo: 'PD2024010022-01', productName: '墙咔', quantity: 30, status: 'completed', completedAt: '2024-01-10' },
      { id: '302', productionNo: 'PD2024010022-02', productName: '安装配件', quantity: 5, status: 'completed', completedAt: '2024-01-12' },
      { id: '303', productionNo: 'PD2024010022-03', productName: '定制边框', quantity: 10, status: 'processing' },
      { id: '304', productionNo: 'PD2024010022-04', productName: '施工图纸', quantity: 1, status: 'pending' }
    ],
    status: 'preparing',
    progress: 50,
    shipReminderStatus: calculateShipReminderStatus(new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString())
  }
]

// Mock chart data
const MOCK_CHART_DATA = [
  { name: '1月1日', orders: 5, amount: 50000 },
  { name: '1月2日', orders: 8, amount: 80000 },
  { name: '1月3日', orders: 6, amount: 60000 },
  { name: '1月4日', orders: 10, amount: 100000 },
  { name: '1月5日', orders: 7, amount: 70000 },
  { name: '1月6日', orders: 9, amount: 90000 },
  { name: '1月7日', orders: 12, amount: 120000 }
]

export function ProductionPreparationView() {
  const [orders, setOrders] = useState<ProductionOrder[]>(MOCK_ORDERS)
  const [filteredOrders, setFilteredOrders] = useState<ProductionOrder[]>(MOCK_ORDERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false)
  const [selectedProductionOrders, setSelectedProductionOrders] = useState<string[]>([])
  const [showReport, setShowReport] = useState(false)
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  // Local state for dialog editing
  const [editEstimatedShipDate, setEditEstimatedShipDate] = useState('')
  const [editRemark, setEditRemark] = useState('')
  // 备注编辑模态框状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<ProductionOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // Sort state
  const [sortBy, setSortBy] = useState<'stayDuration' | ''>('stayDuration')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Calculate summary data
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const averageStayDuration = orders.length > 0
    ? orders.reduce((sum, order) => sum + order.stayDuration, 0) / orders.length
    : 0
  const overdueOrders = orders.filter(order => order.stayDuration > 7).length

  // Handle search and filter
  useEffect(() => {
    let result = [...orders]

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(order =>
        order.salesNo.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerPhone.includes(term) ||
        order.address.toLowerCase().includes(term)
      )
    }

    // Apply only overdue filter
    if (onlyOverdue) {
      result = result.filter(order => order.stayDuration > 7)
    }

    // Apply sorting
    if (sortBy === 'stayDuration') {
      result.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.stayDuration - b.stayDuration
        } else {
          return b.stayDuration - a.stayDuration
        }
      })
    }

    setFilteredOrders(result)
  }, [searchTerm, orders, onlyOverdue, sortBy, sortOrder])

  // Handle preparation dialog open
  const handlePreparationOpen = (order: ProductionOrder) => {
    setSelectedOrder(order)
    // Initialize selected production orders with completed ones
    const completedIds = order.productionOrders
      .filter(prod => prod.status === 'completed')
      .map(prod => prod.id)
    setSelectedProductionOrders(completedIds)
    // Initialize edit state with current order data
    setEditEstimatedShipDate(new Date(order.estimatedShipDate).toISOString().slice(0, 16)) // Format for datetime-local input
    setEditRemark(order.remark)
    setPreparationDialogOpen(true)
  }

  // Handle production order selection change
  const handleProductionOrderChange = (productionId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductionOrders(prev => [...prev, productionId])
    } else {
      setSelectedProductionOrders(prev => prev.filter(id => id !== productionId))
    }
  }

  // Handle preparation complete
  const handlePreparationComplete = () => {
    if (!selectedOrder) return

    // Update production order statuses
    const updatedProductionOrders = selectedOrder.productionOrders.map(prod => ({
      ...prod,
      status: selectedProductionOrders.includes(prod.id) ? 'completed' : prod.status,
      completedAt: selectedProductionOrders.includes(prod.id) && !prod.completedAt ? new Date().toISOString() : prod.completedAt
    }))

    // Calculate new progress
    const completedCount = updatedProductionOrders.filter(prod => prod.status === 'completed').length
    const newProgress = (completedCount / updatedProductionOrders.length) * 100

    // Update order in the list with estimated ship date and remark changes
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrder.id) {
        // Convert datetime-local string to ISO string
        const updatedEstimatedShipDate = new Date(editEstimatedShipDate).toISOString()

        return {
          ...order,
          productionOrders: updatedProductionOrders,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : order.status,
          estimatedShipDate: updatedEstimatedShipDate,
          remark: editRemark,
          shipReminderStatus: calculateShipReminderStatus(updatedEstimatedShipDate)
        }
      }
      return order
    }))

    setPreparationDialogOpen(false)
  }

  // Handle final preparation complete
  const handleFinalPreparationComplete = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'completed'
        }
      }
      return order
    }))
  }

  // 打开备注编辑模态框
  const openRemarkModal = (order: ProductionOrder) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark)
    setIsRemarkModalOpen(true)
  }

  // 保存备注
  const saveRemark = () => {
    if (!selectedOrderForRemark) return

    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrderForRemark.id) {
        return { ...order, remark: remarkValue }
      }
      return order
    }))

    setIsRemarkModalOpen(false)
  }

  // Render Gantt chart component
  const renderGanttChart = (productionOrders: ProductionDetail[]) => {
    const completedCount = selectedProductionOrders.length
    const progress = (completedCount / productionOrders.length) * 100

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">备货进度</span>
          <span className="text-sm font-bold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {productionOrders.map((prod) => (
            <div key={prod.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`prod-${prod.id}`}
                checked={selectedProductionOrders.includes(prod.id)}
                onChange={(e) => handleProductionOrderChange(prod.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <label htmlFor={`prod-${prod.id}`} className="flex-1 text-sm cursor-pointer">
                {prod.productionNo} - {prod.productName} (x{prod.quantity})
              </label>
              <PaperBadge
                className={
                  selectedProductionOrders.includes(prod.id)
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : prod.status === 'processing'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                }
              >
                {selectedProductionOrders.includes(prod.id) ? '已完成' : prod.status === 'processing' ? '处理中' : '待处理'}
              </PaperBadge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header with Data Report Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">生产/备货中</h1>
          <p className="text-ink-500 mt-1">按状态进行筛选与推进</p>
        </div>
        <PaperButton
          variant="primary"
          onClick={() => setShowReport(!showReport)}
        >
          {showReport ? '隐藏报告' : '查看数据报告'}
        </PaperButton>
      </div>

      {/* 1. Summary and Alert Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">备货中总单数</div>
                <div className="text-3xl font-bold text-ink-800 mt-1">
                  {totalOrders}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">备货中总金额</div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">
                  ¥{totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">超期单数</div>
                <div className="text-3xl font-bold text-red-600 mt-1">
                  {overdueOrders}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br ${overdueOrders > 0 ? 'from-red-50/50 dark:from-red-900/20' : 'from-orange-50/50 dark:from-orange-900/20'} to-transparent pointer-events-none`} />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">
                  平均停留时长
                </div>
                <div className={`text-3xl font-bold mt-1 ${overdueOrders > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {averageStayDuration.toFixed(1)}天
                </div>
              </div>
              <div className={`p-3 rounded-xl ${overdueOrders > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
            {overdueOrders > 0 && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                有 {overdueOrders} 个订单停留时间超过7天
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Filter and Search Area */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperCardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <VanishInput
              placeholders={["搜索销售单...", "搜索客户...", "搜索地址...", "输入关键词..."]}
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              className="flex-1 min-w-[200px]"
            />

            {/* Sort Buttons */}
            <div className="flex gap-1">
              <PaperButton
                variant={sortBy === 'stayDuration' && sortOrder === 'asc' ? "primary" : "outline"}
                size="small"
                onClick={() => {
                  setSortBy('stayDuration')
                  setSortOrder('asc')
                }}
              >
                ↑ 停留时间
              </PaperButton>
              <PaperButton
                variant={sortBy === 'stayDuration' && sortOrder === 'desc' ? "primary" : "outline"}
                size="small"
                onClick={() => {
                  setSortBy('stayDuration')
                  setSortOrder('desc')
                }}
              >
                ↓ 停留时间
              </PaperButton>
            </div>

            {/* Only Overdue Button */}
            <PaperButton
              variant={onlyOverdue ? "primary" : "outline"}
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className="ml-auto whitespace-nowrap"
            >
              {onlyOverdue ? '显示全部' : '只看超期'}
            </PaperButton>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 3. Data Report Area (Conditional) */}
      {showReport && (
        <PaperCard className="border-gray-200 shadow-sm">
          <PaperCardHeader>
            <PaperCardTitle>备货进度趋势</PaperCardTitle>
            <PaperCardDescription>最近7天的备货订单数量和金额趋势</PaperCardDescription>
          </PaperCardHeader>
          <PaperCardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="orders" name="订单数量" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="amount" name="订单金额" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 4. Order List Area */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10 flex-1">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-ink-600">共 {filteredOrders.length} 条备货中订单</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell className="pl-6">销售单号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>收货地址</PaperTableCell>
              <PaperTableCell>停留时长</PaperTableCell>
              <PaperTableCell>预计发货时间</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>备货进度</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {filteredOrders.map(order => (
                <PaperTableRow key={order.id} className={order.stayDuration > 7 || order.shipReminderStatus !== 'none' ? 'bg-red-50/30' : ''}>
                  <PaperTableCell className="pl-6">
                    <div className="font-mono text-xs text-gray-900">{order.salesNo}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-xs text-gray-600 max-w-[150px] truncate" title={order.address}>
                      {order.address}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className={`text-sm ${order.stayDuration > 7 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                      {order.stayDuration}天
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className={`flex flex-col items-start gap-1 ${order.shipReminderStatus !== 'none' ? 'font-bold' : ''}`}>
                      <span className={
                        order.shipReminderStatus === 'urgent' ? 'text-red-600' :
                          order.shipReminderStatus === 'warning' ? 'text-orange-600' :
                            'text-gray-700'
                      }>
                        {format(new Date(order.estimatedShipDate), 'MM/dd HH时')}
                      </span>
                      {order.shipReminderStatus === 'urgent' && (
                        <PaperBadge className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
                          24小时内
                        </PaperBadge>
                      )}
                      {order.shipReminderStatus === 'warning' && (
                        <PaperBadge className="bg-orange-50 text-orange-700 border-orange-200 whitespace-nowrap">
                          48小时内
                        </PaperBadge>
                      )}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div
                      className="text-xs text-gray-600 max-w-[150px] line-clamp-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      title={order.remark}
                      onDoubleClick={() => openRemarkModal(order)}
                    >
                      {order.remark || '- 双击添加备注'}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-2.5 bg-gray-200 rounded-full flex flex-col justify-end overflow-hidden">
                        <div
                          className="bg-blue-600 w-full rounded-full transition-all duration-300 ease-in-out"
                          style={{ height: `${order.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{order.progress.toFixed(1)}%</span>
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex flex-col gap-2">
                      <PaperButton
                        size="small"
                        variant="outline"
                        className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handlePreparationOpen(order)}
                      >
                        备货操作
                      </PaperButton>
                      <PaperButton
                        size="small"
                        variant="primary"
                        className="h-7 text-xs"
                        disabled={order.progress < 100}
                        onClick={() => handleFinalPreparationComplete(order.id)}
                      >
                        备货完成
                      </PaperButton>
                    </div>
                  </PaperTableCell>
                </PaperTableRow>
              ))}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination
            currentPage={1}
            totalPages={1}
            totalItems={filteredOrders.length}
            itemsPerPage={10}
            onPageChange={() => { }}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 5. Preparation Dialog */}
      <PaperDialog open={preparationDialogOpen} onOpenChange={setPreparationDialogOpen} className="max-w-2xl">
        <PaperDialogHeader>
          <PaperDialogTitle>备货操作 - {selectedOrder?.salesNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">客户信息</h4>
                  <p className="text-sm">{selectedOrder.customerName} - {selectedOrder.customerPhone}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedOrder.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">订单信息</h4>
                  <p className="text-sm">总金额：¥{selectedOrder.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">停留时长：{selectedOrder.stayDuration}天</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">预计发货时间</h4>
                  <input
                    type="datetime-local"
                    value={editEstimatedShipDate}
                    onChange={(e) => setEditEstimatedShipDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">备注</h4>
                  <PaperInput
                    placeholder="请输入备注信息"
                    value={editRemark}
                    onChange={(e) => setEditRemark(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">生产单明细</h4>
                {renderGanttChart(selectedOrder.productionOrders)}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">备货备注</h4>
                <PaperTextarea
                  placeholder="请输入备货备注信息"
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setPreparationDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton variant="primary" onClick={handlePreparationComplete}>
            保存备货进度
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 6. Remark Edit Modal */}
      <PaperDialog
        open={isRemarkModalOpen}
        onOpenChange={setIsRemarkModalOpen}
        className="max-w-md"
      >
        <PaperDialogHeader className="border-b border-gray-100 pb-4">
          <PaperDialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">📝</span> 编辑备注
          </PaperDialogTitle>
          <PaperDialogDescription>
            为销售单 <span className="font-mono text-blue-600 font-medium">{selectedOrderForRemark?.salesNo}</span> 添加或修改备注信息
          </PaperDialogDescription>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-6">
            {/* Order Context Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 text-xs block mb-0.5">客户</span>
                <span className="font-medium text-gray-800">{selectedOrderForRemark?.customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-0.5">当前进度</span>
                <span className="font-medium text-blue-600">{selectedOrderForRemark?.progress.toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700 flex justify-between">
                <span>备注内容</span>
                <span className="text-xs text-gray-400 font-normal">记录特殊要求或注意事项</span>
              </label>
              <PaperTextarea
                placeholder="例如：客户要求加急处理，预计周五发货..."
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                className="w-full resize-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                rows={5}
                maxLength={200}
              />
              <div className="text-right text-xs text-gray-400">
                {remarkValue.length}/200
              </div>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter className="border-t border-gray-100 pt-4">
          <PaperButton variant="outline" onClick={() => setIsRemarkModalOpen(false)} className="hover:bg-gray-50">
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={saveRemark}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            保存备注
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
