'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperToast } from '@/components/ui/paper-toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// 采购单类型定义
interface PurchaseOrder {
  id: string
  purchaseOrderNo: string // 采购单号
  productName: string // 产品名称
  quantity: number // 数量
  unitPrice: number // 单价
  totalPrice: number // 总价
  logisticsInfo: {
    logisticsCompany?: string // 物流公司
    trackingNumber?: string // 快递单号
    logisticsStatus?: string // 物流状态
    updatedAt?: string // 物流更新时间
  }
  status: string // 采购单状态
}

// 待发货订单类型定义
interface PendingShipmentOrder {
  id: string
  salesOrderNo: string // 销售单号
  customerName: string // 客户姓名
  customerAddress: string // 客户地址
  designer: string // 负责设计师
  salesPerson: string // 导购员
  expectedDeliveryTime: string // 预计发货时间
  expectedArrivalTime: string // 预计到货时间
  shipmentProgress: string // 发货进度
  logisticsInfo: {
    logisticsCompany?: string // 物流公司
    trackingNumber?: string // 快递单号
    logisticsStatus?: string // 物流状态
    updatedAt?: string // 物流更新时间
  }
  remark: string // 备注
  status: string // 订单状态
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
  // 采购单相关字段
  purchaseOrders: PurchaseOrder[] // 采购单列表
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
  sortBy: 'createdAt' | 'expectedDeliveryTime' | 'expectedArrivalTime'
  sortOrder: 'asc' | 'desc'
}

// 分页信息类型
interface Pagination {
  page: number
  pageSize: number
  total: number
}

export function PendingShipmentView() {
  const supabase = createClient()
  // 状态管理
  const [orders, setOrders] = useState<PendingShipmentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 对话框状态
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showLogisticsDialog, setShowLogisticsDialog] = useState(false)
  const [showShipmentCompleteDialog, setShowShipmentCompleteDialog] = useState(false)

  // 当前操作的订单
  const [currentOrder, setCurrentOrder] = useState<PendingShipmentOrder | null>(null)

  // 物流信息表单 - 生产单号到物流信息的映射
  const [logisticsForm, setLogisticsForm] = useState<Record<string, {
    logisticsCompany: string;
    trackingNumber: string;
  }>>({})

  // 筛选条件
  const [filters, setFilters] = useState<OrderFilter>({
    search: '',
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
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<PendingShipmentOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockOrders: PendingShipmentOrder[] = [
        {
          id: '1',
          salesOrderNo: 'SO20241201001',
          customerName: '张三',
          customerAddress: '北京市朝阳区建国路88号',
          designer: '王五',
          salesPerson: '赵六',
          expectedDeliveryTime: '2024-12-10',
          expectedArrivalTime: '2024-12-12',
          shipmentProgress: '已出库',
          logisticsInfo: {
            logisticsCompany: '',
            trackingNumber: '',
            logisticsStatus: '',
            updatedAt: ''
          },
          remark: '加急订单',
          status: 'pending-shipment',
          createdAt: '2024-11-26T10:00:00Z',
          updatedAt: '2024-12-01T14:30:00Z',
          // 采购单列表
          purchaseOrders: [
            {
              id: 'po1',
              purchaseOrderNo: 'PO20241201001',
              productName: '窗帘布料',
              quantity: 24,
              unitPrice: 150,
              totalPrice: 3600,
              logisticsInfo: {
                logisticsCompany: '',
                trackingNumber: '',
                logisticsStatus: '',
                updatedAt: ''
              },
              status: 'pending-shipment'
            },
            {
              id: 'po2',
              purchaseOrderNo: 'PO20241201002',
              productName: '窗帘纱料',
              quantity: 24,
              unitPrice: 80,
              totalPrice: 1920,
              logisticsInfo: {
                logisticsCompany: '',
                trackingNumber: '',
                logisticsStatus: '',
                updatedAt: ''
              },
              status: 'pending-shipment'
            }
          ],
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
          expectedArrivalTime: '2024-12-17',
          shipmentProgress: '待出库',
          logisticsInfo: {
            logisticsCompany: '',
            trackingNumber: '',
            logisticsStatus: '',
            updatedAt: ''
          },
          remark: '',
          status: 'pending-shipment',
          createdAt: '2024-11-25T14:00:00Z',
          updatedAt: '2024-12-01T10:00:00Z',
          // 采购单列表
          purchaseOrders: [
            {
              id: 'po3',
              purchaseOrderNo: 'PO20241201003',
              productName: '背景墙材料',
              quantity: 1,
              unitPrice: 5000,
              totalPrice: 5000,
              logisticsInfo: {
                logisticsCompany: '顺丰速运',
                trackingNumber: 'SF9876543210',
                logisticsStatus: '运输中',
                updatedAt: '2024-12-01T10:00:00Z'
              },
              status: 'pending-shipment'
            }
          ],
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
          expectedArrivalTime: '2024-12-22',
          shipmentProgress: '已出库',
          logisticsInfo: {
            logisticsCompany: '顺丰速运',
            trackingNumber: 'SF1234567890',
            logisticsStatus: '运输中',
            updatedAt: '2024-12-01T16:00:00Z'
          },
          remark: '需要提前发货',
          status: 'pending-shipment',
          createdAt: '2024-11-24T09:00:00Z',
          updatedAt: '2024-12-01T16:00:00Z',
          // 采购单列表
          purchaseOrders: [
            {
              id: 'po4',
              purchaseOrderNo: 'PO20241201004',
              productName: '墙布',
              quantity: 50,
              unitPrice: 60,
              totalPrice: 3000,
              logisticsInfo: {
                logisticsCompany: '顺丰速运',
                trackingNumber: 'SF1122334455',
                logisticsStatus: '运输中',
                updatedAt: '2024-12-01T16:00:00Z'
              },
              status: 'pending-shipment'
            }
          ],
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

      // 搜索筛选 - 合并设计师和导购员搜索
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredOrders = filteredOrders.filter(order =>
          order.salesOrderNo.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.customerAddress.toLowerCase().includes(searchLower) ||
          order.designer.toLowerCase().includes(searchLower) ||
          order.salesPerson.toLowerCase().includes(searchLower)
        )
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
  }, [filters, pagination.page, pagination.pageSize, setOrders, setPagination, setToast])

  // 模拟数据 - 实际应从API获取
  useEffect(() => {
    fetchOrders()
  }, [filters, pagination.page, pagination.pageSize, fetchOrders])

  // 刷新订单列表
  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  // 打开订单详情对话框
  const handleOpenDetailDialog = (order: PendingShipmentOrder) => {
    setCurrentOrder(order)
    setShowDetailDialog(true)
  }

  // 打开填写物流信息对话框
  const handleOpenLogisticsDialog = (order: PendingShipmentOrder) => {
    setCurrentOrder(order)

    // 初始化物流信息表单，为每个采购单号创建一个条目
    const initialForm: Record<string, {
      logisticsCompany: string;
      trackingNumber: string;
    }> = {}

    order.purchaseOrders.forEach(po => {
      initialForm[po.purchaseOrderNo] = {
        logisticsCompany: po.logisticsInfo.logisticsCompany || '',
        trackingNumber: po.logisticsInfo.trackingNumber || ''
      }
    })

    setLogisticsForm(initialForm)
    setShowLogisticsDialog(true)
  }

  // 打开发货完成确认对话框
  const handleOpenShipmentCompleteDialog = (order: PendingShipmentOrder) => {
    setCurrentOrder(order)
    setShowShipmentCompleteDialog(true)
  }

  // 保存物流信息
  const saveLogisticsInfo = async () => {
    if (!currentOrder) return

    try {
      setLoading(true)
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 更新订单物流信息，包括每个采购单号的物流信息
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === currentOrder.id
          ? {
            ...order,
            // 更新销售单的物流信息
            logisticsInfo: {
              ...order.logisticsInfo,
              logisticsStatus: '运输中',
              updatedAt: new Date().toISOString()
            },
            shipmentProgress: '已出库',
            // 更新每个采购单号的物流信息
            purchaseOrders: order.purchaseOrders.map(po => ({
              ...po,
              logisticsInfo: {
                ...po.logisticsInfo,
                logisticsCompany: logisticsForm[po.purchaseOrderNo]?.logisticsCompany || '',
                trackingNumber: logisticsForm[po.purchaseOrderNo]?.trackingNumber || '',
                logisticsStatus: logisticsForm[po.purchaseOrderNo]?.trackingNumber ? '运输中' : '',
                updatedAt: new Date().toISOString()
              }
            }))
          }
          : order
      ))

      setShowLogisticsDialog(false)
      setToast({ message: '物流信息已保存', type: 'success' })
    } catch (_error) {
      setToast({ message: '保存物流信息失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 确认发货完成
  const confirmShipmentComplete = async () => {
    if (!currentOrder) return

    try {
      setLoading(true)

      // 更新订单状态为"安装中-待分配"
      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT })
        .eq('id', currentOrder.id)

      if (error) throw error

      setOrders(prevOrders => prevOrders.filter(order => order.id !== currentOrder.id))
      setShowShipmentCompleteDialog(false)
      setToast({ message: '发货已完成，订单状态已更新为安装中-待分配', type: 'success' })
    } catch (error) {
      logger.error('确认发货完成失败', { resourceType: 'order', resourceId: currentOrder?.id, details: { error } })
      setToast({ message: '确认发货完成失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 处理筛选条件变化
  const handleFilterChange = (field: keyof OrderFilter, value: string | 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // 重置到第一页
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 物流公司列表
  const logisticsCompanies = [
    { value: '', label: '请选择物流公司' },
    { value: '顺丰速运', label: '顺丰速运' },
    { value: '中通快递', label: '中通快递' },
    { value: '圆通速递', label: '圆通速递' },
    { value: '韵达快递', label: '韵达快递' },
    { value: '申通快递', label: '申通快递' },
    { value: '百世快递', label: '百世快递' },
    { value: '京东物流', label: '京东物流' },
    { value: '中国邮政', label: '中国邮政' },
    { value: '极兔速递', label: '极兔速递' }
  ]

  // 快递单号核验函数
  const validateTrackingNumber = (company: string, trackingNumber: string): boolean => {
    if (!company || !trackingNumber) return false

    // 简单的快递单号格式核验，实际项目中可以使用更复杂的正则表达式
    const trackingNumberRegex = /^[A-Z0-9]{6,20}$/
    return trackingNumberRegex.test(trackingNumber)
  }

  // 打开备注编辑模态框
  const openRemarkModal = (order: PendingShipmentOrder) => {
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
    setToast({ message: '备注已保存', type: 'success' })
  }



  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <PaperCard>
        <PaperCardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-ink-800">待发货 - 订单管理</h3>
              <p className="text-ink-500 text-sm">客服团队处理已经发出的销售订单，更新物流信息，确认发货完成</p>
            </div>
            <div className="text-right">
              <p className="text-ink-500 text-sm">待发货订单</p>
              <p className="text-2xl font-bold text-ink-800">{pagination.total}</p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 筛选和搜索区域 */}
      <PaperCard>
        <PaperCardContent className="p-4">
          <div className="grid grid-cols-1 gap-4">
            <PaperInput
              placeholder="搜索销售单号、客户姓名、地址、设计师或导购员"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="mb-2"
            />
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 订单列表 */}
      <PaperCard>
        <PaperTableToolbar className="flex justify-between items-center">
          <div className="text-sm text-ink-500">共 {pagination.total} 条订单</div>
          <PaperButton variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中...' : '刷新'}
          </PaperButton>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>销售单号</PaperTableCell>
              <PaperTableCell>客户姓名</PaperTableCell>
              <PaperTableCell>客户地址</PaperTableCell>
              <PaperTableCell>发货进度</PaperTableCell>
              <PaperTableCell>预计到货时间</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>填写快递单号</PaperTableCell>
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
                    暂无待发货的订单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((order) => (
                  <PaperTableRow key={order.id}>
                    <PaperTableCell>{order.salesOrderNo}</PaperTableCell>
                    <PaperTableCell>{order.customerName}</PaperTableCell>
                    <PaperTableCell>{order.customerAddress}</PaperTableCell>
                    <PaperTableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.shipmentProgress === '已出库' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.shipmentProgress}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>{order.expectedArrivalTime}</PaperTableCell>
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
                      <PaperButton
                        size="small"
                        variant="primary"
                        onClick={() => handleOpenLogisticsDialog(order)}
                      >
                        填写快递单号
                      </PaperButton>
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
                          onClick={() => handleOpenShipmentCompleteDialog(order)}
                          disabled={order.purchaseOrders.some(po => !po.logisticsInfo.trackingNumber)}
                        >
                          发货完成
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
                    <p><strong>预计到货时间：</strong>{currentOrder.expectedArrivalTime}</p>
                    <p><strong>发货进度：</strong>{currentOrder.shipmentProgress}</p>
                    <p><strong>订单状态：</strong>{currentOrder.status === 'pending-shipment' ? '待发货' : currentOrder.status}</p>
                    <p><strong>备注：</strong>{currentOrder.remark || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-ink-800 mb-2">物流信息</h4>
                  <div className="space-y-2">
                    <p><strong>物流公司：</strong>{currentOrder.logisticsInfo.logisticsCompany || '-'}</p>
                    <p><strong>快递单号：</strong>{currentOrder.logisticsInfo.trackingNumber || '-'}</p>
                    <p><strong>物流状态：</strong>{currentOrder.logisticsInfo.logisticsStatus || '-'}</p>
                    {currentOrder.logisticsInfo.updatedAt && (
                      <p><strong>物流更新时间：</strong>{new Date(currentOrder.logisticsInfo.updatedAt).toLocaleString()}</p>
                    )}
                  </div>

                  <h4 className="font-medium text-ink-800 mb-2 mt-4">支付信息</h4>
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

      {/* 填写物流信息对话框 */}
      <PaperDialog
        open={showLogisticsDialog}
        onOpenChange={setShowLogisticsDialog}
        className="max-w-2xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>填写物流信息 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            {currentOrder && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        生产单号
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        产品名称
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物流公司
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        快递单号
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentOrder.purchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {po.purchaseOrderNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {po.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={logisticsForm[po.purchaseOrderNo]?.logisticsCompany || ''}
                            onChange={(e) => setLogisticsForm(prev => ({
                              ...prev,
                              [po.purchaseOrderNo]: {
                                trackingNumber: '',
                                ...prev[po.purchaseOrderNo],
                                logisticsCompany: e.target.value
                              }
                            }))}
                          >
                            {logisticsCompanies.map(company => (
                              <option key={company.value} value={company.value}>{company.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className={`w-full border rounded px-3 py-2 ${logisticsForm[po.purchaseOrderNo]?.trackingNumber && !validateTrackingNumber(logisticsForm[po.purchaseOrderNo]?.logisticsCompany || '', logisticsForm[po.purchaseOrderNo]?.trackingNumber || '') ? 'border-red-500' : ''}`}
                            placeholder="请输入快递单号"
                            value={logisticsForm[po.purchaseOrderNo]?.trackingNumber || ''}
                            onChange={(e) => setLogisticsForm(prev => ({
                              ...prev,
                              [po.purchaseOrderNo]: {
                                logisticsCompany: '',
                                ...prev[po.purchaseOrderNo],
                                trackingNumber: e.target.value
                              }
                            }))}
                          />
                          {logisticsForm[po.purchaseOrderNo]?.trackingNumber && !validateTrackingNumber(logisticsForm[po.purchaseOrderNo]?.logisticsCompany || '', logisticsForm[po.purchaseOrderNo]?.trackingNumber || '') && (
                            <p className="text-xs text-red-500 mt-1">快递单号格式不正确</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowLogisticsDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={saveLogisticsInfo}
            disabled={!currentOrder || currentOrder.purchaseOrders.some(po => {
              const logistics = logisticsForm[po.purchaseOrderNo]
              return !logistics?.logisticsCompany || !logistics?.trackingNumber || !validateTrackingNumber(logistics.logisticsCompany, logistics.trackingNumber)
            })}
          >
            保存
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 发货完成确认对话框 */}
      <PaperDialog
        open={showShipmentCompleteDialog}
        onOpenChange={setShowShipmentCompleteDialog}
        className="max-w-md"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认发货完成 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <p className="text-ink-600">
              确定要将订单 <strong>{currentOrder?.salesOrderNo}</strong> 标记为发货完成吗？
            </p>
            <p className="text-ink-600">
              操作后，订单状态将更新为<strong>已发货</strong>，请谨慎操作。
            </p>
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong>此操作将确认订单已完成发货，物流信息将不再允许修改。
              </p>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowShipmentCompleteDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmShipmentComplete}
          >
            确认发货完成
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 备注编辑模态框 */}
      <PaperDialog
        open={isRemarkModalOpen}
        onOpenChange={setIsRemarkModalOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>编辑备注</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注内容</label>
              <PaperInput
                type="textarea"
                placeholder="请输入备注信息..."
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                className="w-full h-32"
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

      {/* 提示消息 */}
      {toast && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  )
}
