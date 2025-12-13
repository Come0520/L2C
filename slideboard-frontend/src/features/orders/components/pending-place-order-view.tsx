'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperToast } from '@/components/ui/paper-toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// 商品类型定义
interface OrderProduct {
  id: string
  name: string
  size: string
  realSize: string
  model: string
  quantity: number
  purchaseAmount: number // 采购金额
  productionOrderNo?: string // 生产单号
  purchaseOrderImage?: {
    id: string
    name: string
    url: string
    type: 'image' | 'pdf'
  } // 采购订单图片
}

// 待下单订单类型定义
interface PendingPlaceOrder {
  id: string
  salesOrderNo: string // 销售单号
  customerNo: string // 客户号
  customerName: string // 客户姓名
  customerAddress: string // 客户地址
  decorationCompanyPurchaseAmount: number // 装企采购金额（继承待推单页面的采购金额）
  purchaseTotalCost: number // 采购总成本
  products: OrderProduct[] // 商品列表
  enteredPendingOrderAt: string // 进入待下单状态时间
  pendingOrderDuration: number // 待下单状态持续时间（秒）
  isOrderInfoCompleted: boolean // 下单信息是否已完成
}

export function PendingPlaceOrderView() {
  const supabase = createClient()
  // 状态管理
  const [orders, setOrders] = useState<PendingPlaceOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  // 对话框状态
  const [showPlaceOrderDialog, setShowPlaceOrderDialog] = useState(false)
  
  // 当前操作的订单
  const [currentOrder, setCurrentOrder] = useState<PendingPlaceOrder | null>(null)
  
  // 选中的商品
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  
  // 提示消息
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  // 上传的文件
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>({})
  

  
  // 表单状态
  const [batchForm, setBatchForm] = useState({
    productionOrderNo: '',
    purchaseAmount: '',
    hasPurchaseOrderImage: false
  })
  
  // 计算订单在待下单状态的持续时间（秒）
  const calculatePendingDuration = (enteredAt: string): number => {
    const now = new Date()
    const enteredDate = new Date(enteredAt)
    return Math.floor((now.getTime() - enteredDate.getTime()) / 1000)
  }

  // 格式化持续时间为天时分秒
  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (days > 0) {
      return `${days}天${hours}小时`
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟${secs}秒`
    }
  }

  // 获取持续时间的状态类名
  const getDurationStatusClass = (seconds: number): string => {
    if (seconds >= 48 * 3600) {
      return 'text-red-600 font-bold' // 48小时警报
    } else if (seconds >= 24 * 3600) {
      return 'text-yellow-600 font-medium' // 24小时警示
    } else {
      return 'text-ink-600' // 正常
    }
  }

  // 模拟数据 - 实际应从API获取
  React.useEffect(() => {
    // 生成不同时间的订单，用于测试计时功能
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)

    const mockOrders: PendingPlaceOrder[] = [
      {
        id: '1',
        salesOrderNo: 'SO20241126001',
        customerNo: 'CUST001',
        customerName: '张三',
        customerAddress: '北京市朝阳区建国路88号',
        decorationCompanyPurchaseAmount: 5300, // 装企采购金额（继承待推单页面的采购金额）
        purchaseTotalCost: 5300, // 采购总成本
        enteredPendingOrderAt: threeDaysAgo.toISOString(), // 3天前进入待下单状态
        pendingOrderDuration: calculatePendingDuration(threeDaysAgo.toISOString()), // 计算持续时间
        isOrderInfoCompleted: false, // 下单信息未完成
        products: [
          {
            id: 'p1',
            name: '窗帘',
            size: '500cm',
            realSize: '520cm',
            model: 'Model A',
            quantity: 1,
            purchaseAmount: 500
          },
          {
            id: 'p2',
            name: '墙布',
            size: '1000cm²',
            realSize: '1050cm²',
            model: 'Model B',
            quantity: 1,
            purchaseAmount: 4800
          }
        ]
      },
      {
        id: '2',
        salesOrderNo: 'SO20241125002',
        customerNo: 'CUST002',
        customerName: '李四',
        customerAddress: '上海市浦东新区陆家嘴金融中心',
        decorationCompanyPurchaseAmount: 5800, // 装企采购金额（继承待推单页面的采购金额）
        purchaseTotalCost: 5800, // 采购总成本
        enteredPendingOrderAt: twoDaysAgo.toISOString(), // 2天前进入待下单状态
        pendingOrderDuration: calculatePendingDuration(twoDaysAgo.toISOString()), // 计算持续时间
        isOrderInfoCompleted: true, // 下单信息已完成
        products: [
          {
            id: 'p3',
            name: '背景墙',
            size: '300x200cm',
            realSize: '310x210cm',
            model: 'Model C',
            quantity: 1,
            purchaseAmount: 5800
          }
        ]
      },
      {
        id: '3',
        salesOrderNo: 'SO20241124003',
        customerNo: 'CUST003',
        customerName: '王五',
        customerAddress: '广州市天河区珠江新城',
        decorationCompanyPurchaseAmount: 7200, // 装企采购金额（继承待推单页面的采购金额）
        purchaseTotalCost: 7200, // 采购总成本
        enteredPendingOrderAt: oneDayAgo.toISOString(), // 1天前进入待下单状态
        pendingOrderDuration: calculatePendingDuration(oneDayAgo.toISOString()), // 计算持续时间
        isOrderInfoCompleted: false, // 下单信息未完成
        products: [
          {
            id: 'p4',
            name: '窗帘',
            size: '600cm',
            realSize: '620cm',
            model: 'Model A',
            quantity: 1,
            purchaseAmount: 1200
          },
          {
            id: 'p5',
            name: '墙布',
            size: '1200cm²',
            realSize: '1250cm²',
            model: 'Model B',
            quantity: 1,
            purchaseAmount: 6000
          }
        ]
      }
    ]
    
    setOrders(mockOrders)
    setLoading(false)
  }, [])
  
  // 打开下单对话框
  const handleOpenPlaceOrderDialog = (order: PendingPlaceOrder) => {
    setCurrentOrder(order)
    setSelectedProducts([])
    setUploadedFiles({})
    // 重置表单状态
    setBatchForm({
      productionOrderNo: '',
      purchaseAmount: '',
      hasPurchaseOrderImage: false
    })
    setShowPlaceOrderDialog(true)
  }
  
  // 处理商品选择
  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }
  
  // 处理商品选择全选/取消全选
  const handleSelectAllProducts = () => {
    if (!currentOrder) return
    
    if (selectedProducts.length === currentOrder.products.length) {
      // 取消全选
      setSelectedProducts([])
    } else {
      // 全选
      setSelectedProducts(currentOrder.products.map(p => p.id))
    }
  }
  
  // 计算选中商品的采购金额总和
  const calculateSelectedProductsTotal = () => {
    if (!currentOrder) return 0
    
    return currentOrder.products
      .filter(p => selectedProducts.includes(p.id))
      .reduce((sum, product) => sum + product.purchaseAmount, 0)
  }
  
  // 计算采购总成本
  const calculatePurchaseTotalCost = () => {
    if (!currentOrder) return 0
    
    return currentOrder.products
      .reduce((sum, product) => sum + product.purchaseAmount, 0)
  }
  
  // 检查批量操作表单是否已完成所有必填操作
  const isBatchFormCompleted = () => {
    // 检查真实的表单状态
    const hasProductionOrderNo = batchForm.productionOrderNo.trim() !== ''
    const hasPurchaseAmount = parseFloat(batchForm.purchaseAmount) > 0
    const hasPurchaseOrderImage = batchForm.hasPurchaseOrderImage || Object.keys(uploadedFiles).length > 0
    
    return (hasProductionOrderNo || hasPurchaseOrderImage) && hasPurchaseAmount
  }
  
  // 检查是否可以确认下单
  const canConfirmOrder = () => {
    if (!currentOrder) return false
    
    // 检查是否选择了商品
    if (selectedProducts.length === 0) return false
    
    // 检查批量操作表单是否已完成
    return isBatchFormCompleted()
  }
  
  // 检查所有商品是否都已完成必填项
  const areAllProductsCompleted = (products: OrderProduct[]) => {
    return products.every(product => {
      return (
        (!!product.productionOrderNo || !!product.purchaseOrderImage) &&
        product.purchaseAmount > 0
      )
    })
  }
  
  // 确认下单信息
  const handleConfirmOrderInfo = () => {
    if (!currentOrder) return
    
    // 使用真实的表单数据
    const productionOrderNo = batchForm.productionOrderNo.trim()
    const purchaseAmount = parseFloat(batchForm.purchaseAmount)
    
    // 更新所选商品的生产单号和采购金额
    const updatedProducts = currentOrder.products.map(product => {
      // 只更新选中的商品
      if (selectedProducts.includes(product.id)) {
        return { 
          ...product, 
          productionOrderNo,
          purchaseAmount
        }
      }
      return product
    })
    
    // 检查所有商品是否都已完成必填项
    const allProductsCompleted = areAllProductsCompleted(updatedProducts)
    
    // 模拟确认下单信息，实际应调用API保存单号、图片和金额等信息
    setToast({ message: '下单信息已确认', type: 'success' })
    
    // 更新当前订单状态，以便在对话框中显示更新后的结果
    setCurrentOrder(prev => {
      if (!prev) return prev
      return {
        ...prev,
        isOrderInfoCompleted: allProductsCompleted,
        products: updatedProducts
      }
    })
    
    // 更新订单列表中的订单
    setOrders(prev => prev.map(order => {
      if (order.id === currentOrder.id) {
        return { 
          ...order, 
          isOrderInfoCompleted: allProductsCompleted,
          products: updatedProducts
        }
      }
      return order
    }))
    
    // 重置表单和选择状态
    setSelectedProducts([])
    setBatchForm({
      productionOrderNo: '',
      purchaseAmount: '',
      hasPurchaseOrderImage: false
    })
    setUploadedFiles({})
  }
  
  // 处理下单完成
  const handleOrderCompleted = async (orderId: string) => {
    // 模拟下单完成，实际应调用API将订单状态更新为"生产/备货中"
    
    // 更新订单状态
    const { error } = await supabase
      .from('orders')
      .update({ status: ORDER_STATUS.IN_PRODUCTION })
      .eq('id', orderId)

    if (error) {
      logger.error('更新订单状态失败', { resourceType: 'order', resourceId: orderId, details: { error } })
      setToast({ message: '更新状态失败', type: 'error' })
      return
    }

    setToast({ message: '订单已进入生产/备货中状态', type: 'success' })
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }
  

  
  return (
    <div className="space-y-6">
      {/* 统计卡片 - Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-ink-500 mb-1">待下单数量</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-ink-800">{orders.length}</h3>
                <span className="text-sm text-ink-400">单</span>
              </div>
              <p className="text-xs text-ink-400 mt-2">当前处于待下单状态的订单总数</p>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-ink-500 mb-1">总装企采购金额</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-ink-800">¥{orders.reduce((sum, order) => sum + order.decorationCompanyPurchaseAmount, 0).toLocaleString()}</h3>
              </div>
              <p className="text-xs text-ink-400 mt-2">所有待下单订单的装企采购总金额</p>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
      
      {/* 待下单列表 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-ink-600">共 {orders.length} 条待下单</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
              <PaperTableCell>销售单号/客户号</PaperTableCell>
              <PaperTableCell>客户姓名</PaperTableCell>
              <PaperTableCell>客户地址</PaperTableCell>
              <PaperTableCell>装企采购金额</PaperTableCell>
              <PaperTableCell>采购总成本</PaperTableCell>
              <PaperTableCell>待下单时长</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {loading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={7} className="text-center text-gray-500">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={7} className="text-center text-gray-500">
                    暂无待下单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((order) => (
                  <PaperTableRow key={order.id}>
                    <PaperTableCell>
                      <div>
                        <div>{order.salesOrderNo}</div>
                        <div className="text-sm text-ink-500">{order.customerNo}</div>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>{order.customerName}</PaperTableCell>
                    <PaperTableCell>{order.customerAddress}</PaperTableCell>
                    <PaperTableCell>¥{order.decorationCompanyPurchaseAmount.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>¥{order.purchaseTotalCost.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>
                      <span className={getDurationStatusClass(order.pendingOrderDuration)}>
                        {formatDuration(order.pendingOrderDuration)}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-wrap gap-2">
                        <PaperButton 
                          size="small" 
                          variant="primary" 
                          onClick={() => handleOpenPlaceOrderDialog(order)}
                        >
                          下单
                        </PaperButton>
                        <PaperButton 
                          size="small" 
                          variant="primary" 
                          onClick={() => handleOrderCompleted(order.id)}
                          disabled={!order.isOrderInfoCompleted}
                        >
                          下单完成
                        </PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
        </PaperCardContent>
      </PaperCard>
      
      {/* 下单对话框 */}
      <PaperDialog 
        open={showPlaceOrderDialog} 
        onOpenChange={setShowPlaceOrderDialog}
        className="max-w-4xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认销售单 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          {currentOrder && (
            <div className="space-y-6">
              {/* 订单基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-ink-800 mb-2">基本信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">销售单号：</span>
                      <span className="text-sm font-medium">{currentOrder.salesOrderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">客户号：</span>
                      <span className="text-sm font-medium">{currentOrder.customerNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">客户姓名：</span>
                      <span className="text-sm font-medium">{currentOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">客户地址：</span>
                      <span className="text-sm font-medium">{currentOrder.customerAddress}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-ink-800 mb-2">金额信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">装企采购金额：</span>
                      <span className="text-sm font-bold">¥{currentOrder.decorationCompanyPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">采购总成本：</span>
                      <span className="text-sm font-bold">¥{calculatePurchaseTotalCost().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 商品列表 */}
              <div>
                <h4 className="font-medium text-ink-800 mb-2">商品列表</h4>
                
                {/* 商品选择全选/取消全选 */}
                <div className="flex items-center mb-3">
                  <input 
                    type="checkbox" 
                    id="select-all-products"
                    checked={currentOrder.products.length > 0 && selectedProducts.length === currentOrder.products.length}
                    onChange={handleSelectAllProducts}
                    className="mr-2"
                  />
                  <label htmlFor="select-all-products" className="text-sm font-medium text-ink-700">全选商品</label>
                </div>
                
                {/* 选中商品的采购金额总和 */}
                {selectedProducts.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-blue-800">选中商品采购金额总和：</span>
                      <span className="text-sm font-bold text-blue-800">¥{calculateSelectedProductsTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {/* 商品列表 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">选择</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">真实尺寸</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采购金额</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生产单号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采购订单图片</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrder.products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              id={`product-${product.id}`}
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleProductSelect(product.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink-800">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">{product.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">{product.realSize}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">{product.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">{product.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">¥{product.purchaseAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">
                            {product.productionOrderNo || '未填写'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.purchaseOrderImage ? (
                              <div className="text-xs text-ink-500">
                                {product.purchaseOrderImage.type === 'image' ? '📷' : '📄'}
                                {product.purchaseOrderImage.name}
                              </div>
                            ) : (
                              <span className="text-xs text-ink-500">未上传</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 选中商品操作区域 */}
              {selectedProducts.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-ink-800 mb-2">选中商品操作</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-ink-700 mb-1">生产单号</label>
                      <input 
                        type="text" 
                        placeholder="请输入生产单号"
                        className="w-full border rounded px-2 py-1"
                        value={batchForm.productionOrderNo}
                        onChange={(e) => setBatchForm(prev => ({ ...prev, productionOrderNo: e.target.value }))}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-ink-700 mb-1">采购订单图片</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        className="w-full"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setUploadedFiles(prev => ({ ...prev, [Date.now()]: Array.from(files) }))
                            setBatchForm(prev => ({ ...prev, hasPurchaseOrderImage: true }))
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-ink-700 mb-1">采购金额</label>
                      <input 
                        type="number" 
                        placeholder="请输入采购金额"
                        className="w-full border rounded px-2 py-1"
                        value={batchForm.purchaseAmount}
                        onChange={(e) => setBatchForm(prev => ({ ...prev, purchaseAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowPlaceOrderDialog(false)}>
            取消
          </PaperButton>
          <PaperButton 
            variant="primary" 
            onClick={handleConfirmOrderInfo}
            disabled={!canConfirmOrder()}
          >
            确认
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
