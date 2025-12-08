'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperFileUpload } from '@/components/ui/paper-file-upload'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperToast } from '@/components/ui/paper-toast'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// 待推单订单类型定义
interface PendingPushOrder {
  id: string
  salesOrderNo: string // 销售单号
  customerNo: string // 客户号
  customerName: string // 客户姓名
  customerAddress: string // 客户地址
  designer: string // 设计师
  sales: string // 导购
  confirmedAmount: number // 确认金额
  purchaseOrderScreenshot?: {
    id: string
    name: string
    url: string
    type: 'image' | 'pdf'
  } // 采购单截图
  purchaseAmount?: number // 采购金额
}

// 上传的文件类型定义
interface UploadedFile {
  id: string
  name: string
  url: string
}

export function PendingPushView() {
  const supabase = createClient()
  // 状态管理
  const [orders, setOrders] = useState<PendingPushOrder[]>([])
  const [loading, setLoading] = useState(true)

  // 对话框状态
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showPurchaseAmountDialog, setShowPurchaseAmountDialog] = useState(false)

  // 当前操作的订单
  const [currentOrder, setCurrentOrder] = useState<PendingPushOrder | null>(null)

  // 上传的文件
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // 采购金额
  const [purchaseAmount, setPurchaseAmount] = useState<string>('')

  // 提示消息
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // 模拟数据 - 实际应从API获取
  React.useEffect(() => {
    const mockOrders: PendingPushOrder[] = [
      {
        id: '1',
        salesOrderNo: 'SO20241126001',
        customerNo: 'CUST001',
        customerName: '张三',
        customerAddress: '北京市朝阳区建国路88号',
        designer: '王五',
        sales: '赵六',
        confirmedAmount: 5500
      },
      {
        id: '2',
        salesOrderNo: 'SO20241125002',
        customerNo: 'CUST002',
        customerName: '李四',
        customerAddress: '上海市浦东新区陆家嘴金融中心',
        designer: '钱七',
        sales: '孙八',
        confirmedAmount: 6000,
        purchaseOrderScreenshot: {
          id: 'ss1',
          name: '采购单截图.png',
          url: 'https://example.com/screenshot.png',
          type: 'image'
        },
        purchaseAmount: 5800
      }
    ]

    setOrders(mockOrders)
    setLoading(false)
  }, [])

  // 打开上传采购单截图对话框
  const handleOpenUploadDialog = (order: PendingPushOrder) => {
    setCurrentOrder(order)
    setUploadedFiles([])
    setShowUploadDialog(true)
  }

  // 打开填写采购金额对话框
  const handleOpenPurchaseAmountDialog = (order: PendingPushOrder) => {
    setCurrentOrder(order)
    setPurchaseAmount(order.purchaseAmount?.toString() || '')
    setShowPurchaseAmountDialog(true)
  }

  // 处理文件上传
  const handleFileUpload = (files: File[]) => {
    // 模拟上传，实际应调用API
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      url: URL.createObjectURL(file)
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  // 确认上传采购单截图
  const confirmUpload = () => {
    if (!currentOrder || uploadedFiles.length === 0) return

    // 模拟上传，实际应调用API
    const file = uploadedFiles[0]
    if (!file) return

    // 模拟上传，实际应调用API
    setOrders(prev => prev.map(order =>
      order.id === currentOrder.id
        ? {
          ...order,
          purchaseOrderScreenshot: {
            id: file.id,
            name: file.name,
            url: file.url,
            type: file.name.endsWith('.pdf') ? 'pdf' : 'image'
          }
        }
        : order
    ))

    setShowUploadDialog(false)
    setToast({ message: '采购单截图上传成功', type: 'success' })
  }

  // 确认填写采购金额
  const confirmPurchaseAmount = () => {
    if (!currentOrder || !purchaseAmount) return

    const amount = parseFloat(purchaseAmount)
    if (isNaN(amount)) {
      setToast({ message: '请输入有效的采购金额', type: 'error' })
      return
    }

    // 模拟保存，实际应调用API
    setOrders(prev => prev.map(order =>
      order.id === currentOrder.id
        ? { ...order, purchaseAmount: amount }
        : order
    ))

    setShowPurchaseAmountDialog(false)
    setToast({ message: '采购金额保存成功', type: 'success' })
  }

  // 检查是否可以下单
  const canPlaceOrder = (order: PendingPushOrder) => {
    return !!order.purchaseOrderScreenshot && !!order.purchaseAmount
  }

  // 处理下单操作
  const handlePlaceOrder = async (order: PendingPushOrder) => {
    if (!canPlaceOrder(order)) return

    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending_order' })
      .eq('id', order.id)

    if (error) {
      logger.error('更新订单状态失败', { resourceType: 'order', resourceId: order.id, details: { error } })
      setToast({ message: '更新状态失败', type: 'error' })
      return
    }

    // 模拟下单，实际应调用API
    setToast({ message: '订单已下单，状态已更新为待下单', type: 'success' })

    // 更新订单状态（实际应从API重新获取）
    setOrders(prev => prev.filter(o => o.id !== order.id))
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <PaperCard>
        <PaperCardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-ink-800">待推单 - 统计信息</h3>
              <p className="text-ink-500 text-sm">按状态进行筛选与推进</p>
            </div>
            <div className="text-right">
              <p className="text-ink-500 text-sm">待推单数量</p>
              <p className="text-2xl font-bold text-ink-800">{orders.length}</p>
              <p className="text-ink-500 text-sm mt-1">总确认金额</p>
              <p className="text-2xl font-bold text-ink-800">¥{orders.reduce((sum, order) => sum + order.confirmedAmount, 0).toLocaleString()}</p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 待推单列表 */}
      <PaperCard>
        <PaperTableToolbar>
          <div className="text-sm text-ink-500">共 {orders.length} 条待推单</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>销售单号/客户号</PaperTableCell>
              <PaperTableCell>客户姓名</PaperTableCell>
              <PaperTableCell>客户地址</PaperTableCell>
              <PaperTableCell>设计师</PaperTableCell>
              <PaperTableCell>导购</PaperTableCell>
              <PaperTableCell>确认金额</PaperTableCell>
              <PaperTableCell>上传采购单截图</PaperTableCell>
              <PaperTableCell>采购金额</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {loading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center text-gray-500">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center text-gray-500">
                    暂无待推单
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
                    <PaperTableCell>{order.designer}</PaperTableCell>
                    <PaperTableCell>{order.sales}</PaperTableCell>
                    <PaperTableCell>¥{order.confirmedAmount.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        {order.purchaseOrderScreenshot ? (
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => window.open(order.purchaseOrderScreenshot?.url, '_blank')}
                          >
                            {order.purchaseOrderScreenshot.type === 'image' ? '📷' : '📄'}
                            {order.purchaseOrderScreenshot.name}
                          </PaperButton>
                        ) : (
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => handleOpenUploadDialog(order)}
                          >
                            上传
                          </PaperButton>
                        )}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        {order.purchaseAmount !== undefined ? (
                          <span className="text-sm">¥{order.purchaseAmount.toLocaleString()}</span>
                        ) : (
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => handleOpenPurchaseAmountDialog(order)}
                          >
                            填写
                          </PaperButton>
                        )}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-wrap gap-2">
                        <PaperButton
                          size="small"
                          variant="primary"
                          onClick={() => handlePlaceOrder(order)}
                          disabled={!canPlaceOrder(order)}
                        >
                          下单
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

      {/* 上传采购单截图弹窗 */}
      <PaperDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        className="max-w-2xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>上传采购单截图 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-ink-800 mb-2">订单信息</h4>
              <p>销售单号：<strong>{currentOrder?.salesOrderNo}</strong></p>
              <p>客户号：<strong>{currentOrder?.customerNo}</strong></p>
              <p>客户姓名：<strong>{currentOrder?.customerName}</strong></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                上传采购单截图（支持图片、PDF等格式）
              </label>
              <PaperFileUpload
                onUpload={handleFileUpload}
                accept="image/*,.pdf"
                multiple={false}
                maxSizeMB={10}
                onValidateError={(errs) => setToast({ message: errs.join('；'), type: 'error' })}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h5 className="text-sm font-medium text-ink-700">已上传文件：</h5>
                  <div className="space-y-1">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-ink-800">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>支持的文件类型：</strong>采购申请截图、PDF格式采购单等
              </p>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowUploadDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmUpload}
            disabled={uploadedFiles.length === 0}
          >
            确认上传
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 填写采购金额弹窗 */}
      <PaperDialog
        open={showPurchaseAmountDialog}
        onOpenChange={setShowPurchaseAmountDialog}
        className="max-w-sm"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>填写采购金额 - {currentOrder?.salesOrderNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-ink-800 mb-2">订单信息</h4>
              <p>销售单号：<strong>{currentOrder?.salesOrderNo}</strong></p>
              <p>客户号：<strong>{currentOrder?.customerNo}</strong></p>
              <p>确认金额：<strong>¥{currentOrder?.confirmedAmount.toLocaleString()}</strong></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                采购金额
              </label>
              <PaperInput
                type="number"
                placeholder="请输入采购金额"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                prefix="¥"
              />
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowPurchaseAmountDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmPurchaseAmount}
            disabled={!purchaseAmount}
          >
            确认保存
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
