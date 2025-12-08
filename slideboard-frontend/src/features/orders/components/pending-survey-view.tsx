'use client'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperFileUpload } from '@/components/ui/paper-file-upload'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { ORDER_STATUS, OrderStatus } from '@/constants/order-status'
import { useAuth } from '@/contexts/auth-context'
import { useSalesOrders } from '@/hooks/useSalesOrders'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// 报价产品类型定义
interface QuoteProduct {
  id: string
  name: string
  size: string
  realSize: string
  model: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

// 报价版本类型定义
interface QuoteVersion {
  id: string
  quoteNo: string
  version: string
  createDate: string
  amount: number
  isFormal: boolean
}

interface PendingSurveyOrder {
  id: string
  quoteNo: string
  customer: string
  address: string
  designer: string
  sales: string
  amount: number
  quote: string
  status: OrderStatus
  leadNo: string
  projectAddress: string
  draftAmount: number
  createDate: string
  version: string
  products: QuoteProduct[]
  surveyFiles?: UploadedFile[] // 已上传的HOME测量单文件
  statusUpdatedAt: string // 状态更新时间
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export function PendingSurveyView() {
  const supabase = createClient()
  const { user } = useAuth()
  const [orders, setOrders] = useState<PendingSurveyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [page] = useState(1)
  const pageSize = 10

  // 对话框状态
  const [showGoSurveyDialog, setShowGoSurveyDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showRealQuoteDialog, setShowRealQuoteDialog] = useState(false)
  const [showVersionHistoryDialog, setShowVersionHistoryDialog] = useState(false)

  // 当前操作的订单/报价单
  const [currentOrder, setCurrentOrder] = useState<PendingSurveyOrder | null>(null)

  // 关闭原因
  const [closeReason, setCloseReason] = useState('')

  // 当前上传对话框中的临时文件
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // 报价单相关状态
  const [versionHistory, setVersionHistory] = useState<QuoteVersion[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // 用于PDF导出的ref
  const quoteContentRef = useRef<HTMLDivElement>(null)

  // Toast自动消失
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (toast) {
      timer = setTimeout(() => setToast(null), 3000)
    }
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [toast])

  // 清理Blob URL防止内存泄漏
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })
    }
  }, [uploadedFiles])

  // 权限检查
  const canUploadSurvey = () => {
    const allowedRoles = ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_ADMIN']
    return allowedRoles.includes(user?.role as string)
  }

  const canGoSurvey = () => {
    const allowedRoles = ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_ADMIN']
    return allowedRoles.includes(user?.role as string)
  }

  const canCloseOrder = () => {
    const allowedRoles = ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_ADMIN']
    return allowedRoles.includes(user?.role as string)
  }

  // 模拟版本历史数据
  const mockVersionHistory: QuoteVersion[] = [
    {
      id: 'v1',
      quoteNo: 'QT20240001-V1.0',
      version: '1.0',
      createDate: '2024-11-26',
      amount: 12800,
      isFormal: false
    },
    {
      id: 'v2',
      quoteNo: 'QT20240001-V0.9',
      version: '0.9',
      createDate: '2024-11-25',
      amount: 12500,
      isFormal: false
    }
  ]

  // 使用useSalesOrders hook获取待测量订单
  const { data: rawResponse, isLoading } = useSalesOrders(
    page,
    pageSize,
    ORDER_STATUS.PENDING_MEASUREMENT
  )

  // 更新订单数据
  useEffect(() => {
    const response = rawResponse as any
    if (response?.data?.orders) {
      // 临时修复类型转换问题，实际应完善BaseOrder定义或转换逻辑
      const mappedOrders = (response.data.orders as any[]).map(order => ({
        ...order,
        quoteNo: order.quoteNo || order.orderNo || 'N/A',
        customer: order.customer || order.customerName || 'N/A',
        address: order.address || order.projectAddress || 'N/A',
        quote: order.quote || '',
        products: order.products || [],
        version: order.version || '1.0',
        draftAmount: order.draftAmount || order.amount || 0,
        createDate: order.createDate || order.createdAt || new Date().toISOString(),
        statusUpdatedAt: order.statusUpdatedAt || order.updatedAt || new Date().toISOString()
      }))
      setOrders(mappedOrders as PendingSurveyOrder[])
      setLoading(isLoading)

      // 计算总金额
      const total = (mappedOrders as PendingSurveyOrder[]).reduce((sum, order) => sum + order.amount, 0)
      setTotalAmount(total)
    } else {
      setOrders([])
      setLoading(isLoading)
      setTotalAmount(0)
    }
  }, [rawResponse, isLoading])

  // 检查订单是否已上传测量单
  const hasUploadedSurvey = (order: PendingSurveyOrder) => {
    return order.surveyFiles && order.surveyFiles.length > 0
  }

  // 计算等待时长
  const calculateWaitingTime = (statusUpdatedAt: string) => {
    const now = new Date()
    const updatedAt = new Date(statusUpdatedAt)
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}天${diffHours % 24}小时`
    } else if (diffHours > 0) {
      return `${diffHours}小时`
    } else {
      return '1小时内'
    }
  }

  // 检查是否超时
  const isOverdue = (statusUpdatedAt: string) => {
    const now = new Date()
    const updatedAt = new Date(statusUpdatedAt)
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    return diffHours >= 48 // 48小时超时
  }

  // 处理去测量
  const handleGoSurvey = (order: PendingSurveyOrder) => {
    // 严格校验：必须先上传测量单
    if (!hasUploadedSurvey(order)) {
      setToast({
        message: '请先上传HOME测量单后再进行测量',
        type: 'error'
      })
      return
    }
    setCurrentOrder(order)
    setShowGoSurveyDialog(true)
  }

  // 确认去测量
  const confirmGoSurvey = async () => {
    // 实际应调用API更新订单状态
    setShowGoSurveyDialog(false)
    // 更新订单状态为测量中
    if (currentOrder) {
      setOrders(prev => prev.map(order =>
        order.id === currentOrder.id
          ? { ...order, status: ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT }
          : order
      ))

      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT })
        .eq('id', currentOrder.id)

      if (error) {
        logger.error('更新订单状态失败', { resourceType: 'order', resourceId: currentOrder.id, details: { error } })
        setToast({ message: '更新状态失败', type: 'error' })
      }
    }
  }

  // 处理关闭订单
  const handleCloseOrder = (order: PendingSurveyOrder) => {
    setCurrentOrder(order)
    setShowCloseDialog(true)
  }

  // 确认关闭订单
  const confirmCloseOrder = async () => {
    setShowCloseDialog(false)
    setCloseReason('')
    // 从列表中移除订单
    if (currentOrder) {
      setOrders(prev => prev.filter(order => order.id !== currentOrder.id))
      // 更新总金额
      setTotalAmount(prev => prev - currentOrder.amount)

      const { error } = await supabase
        .from('orders')
        .update({
          status: ORDER_STATUS.CANCELLED,
          cancel_reason: closeReason
        })
        .eq('id', currentOrder.id)

      if (error) {
        logger.error('关闭订单失败', { resourceType: 'order', resourceId: currentOrder.id, details: { error } })
        setToast({ message: '关闭订单失败', type: 'error' })
        // Revert optimistic update if needed, or just show error
        // For now we just show error as the list is already updated locally
      } else {
        setToast({ message: '订单已关闭', type: 'success' })
      }
    }
  }

  // 处理上传测量单
  const handleUploadSurvey = (order: PendingSurveyOrder) => {
    setCurrentOrder(order)
    // 如果订单已有文件，加载到临时状态
    if (order.surveyFiles && order.surveyFiles.length > 0) {
      setUploadedFiles([...order.surveyFiles])
    } else {
      setUploadedFiles([])
    }
    setShowUploadDialog(true)
  }

  // 确认上传测量单
  const confirmUploadSurvey = () => {
    if (!currentOrder) return

    setOrders(prev => prev.map(order =>
      order.id === currentOrder.id
        ? { ...order, surveyFiles: [...uploadedFiles] }
        : order
    ))

    setToast({
      message: `已成功上传${uploadedFiles.length}个测量单文件`,
      type: 'success'
    })

    setShowUploadDialog(false)
    setUploadedFiles([])
  }

  // 处理文件上传
  const handleFileUpload = (files: File[]) => {
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Unknown'
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }


  // 打开版本历史弹窗
  const handleOpenVersionHistory = (order: PendingSurveyOrder) => {
    setCurrentOrder(order)
    setVersionHistory(mockVersionHistory)
    setUploadedFiles([])
    setShowVersionHistoryDialog(true)
  }

  // 保存报价单
  const saveQuote = () => {
    // 实际应调用API保存报价单
    setToast({ message: '报价单已保存', type: 'success' })
  }

  // 导出Excel功能
  const exportToExcel = () => {
    if (!currentOrder) return

    // 准备导出数据
    const exportData = {
      客户信息: [
        { 字段: '客户', 值: currentOrder.customer },
        { 字段: '线索号', 值: currentOrder.leadNo },
        { 字段: '设计师', 值: currentOrder.designer },
        { 字段: '导购', 值: currentOrder.sales },
        { 字段: '项目地址', 值: currentOrder.projectAddress },
        { 字段: '创建日期', 值: currentOrder.createDate },
        { 字段: '当前版本', 值: currentOrder.version },
        { 字段: '总金额', 值: `¥${currentOrder.draftAmount.toLocaleString()}` }
      ],
      产品明细: currentOrder.products.map(product => ({
        产品名称: product.name,
        型号: product.model,
        尺寸: product.size,
        真实尺寸: product.realSize,
        数量: product.quantity,
        单价: `¥${product.unitPrice}`,
        总价: `¥${product.totalPrice}`
      }))
    }

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()

    // 客户信息工作表
    const customerWorksheet = XLSX.utils.json_to_sheet(exportData.客户信息)
    XLSX.utils.book_append_sheet(workbook, customerWorksheet, '客户信息')

    // 产品明细工作表
    const productsWorksheet = XLSX.utils.json_to_sheet(exportData.产品明细)
    XLSX.utils.book_append_sheet(workbook, productsWorksheet, '产品明细')

    // 导出文件
    XLSX.writeFile(workbook, `报价单-${currentOrder.leadNo}-V${currentOrder.version}.xlsx`)
    setToast({ message: 'Excel导出成功', type: 'success' })
  }

  // 导出PDF功能
  const exportToPDF = async () => {
    if (!currentOrder || !quoteContentRef.current) return

    try {
      // 使用html2canvas捕获DOM内容
      const canvas = await html2canvas(quoteContentRef.current, {
        scale: 2, // 提高分辨率
        useCORS: true, // 允许跨域图片
        logging: false
      })

      // 创建PDF文档
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // 计算PDF页面大小和缩放比例
      const imgWidth = 210 // A4宽度，单位mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // 添加图片到PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      )

      // 保存PDF文件
      pdf.save(`报价单-${currentOrder.leadNo}-V${currentOrder.version}.pdf`)
      setToast({ message: 'PDF导出成功', type: 'success' })
    } catch (_error) {
      setToast({ message: 'PDF导出失败', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <PaperCard>
        <PaperCardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-ink-800">待测量订单统计</h3>
              <p className="text-ink-500 text-sm">根据您的权限显示相关订单</p>
            </div>
            <div className="text-right">
              <p className="text-ink-500 text-sm">总金额</p>
              <p className="text-2xl font-bold text-ink-800">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 订单列表 */}
      <PaperCard>
        <PaperTableToolbar>
          <div className="text-sm text-ink-500">共 {orders.length} 条，总金额：¥{totalAmount.toLocaleString()}</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>报价单单号</PaperTableCell>
              <PaperTableCell>客户</PaperTableCell>
              <PaperTableCell>地址</PaperTableCell>
              <PaperTableCell>设计师</PaperTableCell>
              <PaperTableCell>导购</PaperTableCell>
              <PaperTableCell>金额</PaperTableCell>
              <PaperTableCell>等待时长</PaperTableCell>
              <PaperTableCell>报价单</PaperTableCell>
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
                    暂无待测量订单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((order) => {
                  const waitingTime = calculateWaitingTime(order.statusUpdatedAt)
                  const overdue = isOverdue(order.statusUpdatedAt)
                  return (
                    <PaperTableRow key={order.id} className={overdue ? 'bg-red-50' : ''}>
                      <PaperTableCell>{order.quoteNo}</PaperTableCell>
                      <PaperTableCell>{order.customer}</PaperTableCell>
                      <PaperTableCell>{order.address}</PaperTableCell>
                      <PaperTableCell>{order.designer}</PaperTableCell>
                      <PaperTableCell>{order.sales}</PaperTableCell>
                      <PaperTableCell>¥{order.amount.toLocaleString()}</PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {waitingTime}
                          </span>
                          {overdue && (
                            <span className="ml-2 text-xs text-red-500">⚠️ 超时</span>
                          )}
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <PaperButton
                          size="small"
                          variant="outline"
                          onClick={() => handleOpenVersionHistory(order)}
                        >
                          V{order.version}
                        </PaperButton>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          {canUploadSurvey() && (
                            <PaperButton
                              size="small"
                              variant={hasUploadedSurvey(order) ? "outline" : "primary"}
                              onClick={() => handleUploadSurvey(order)}
                            >
                              {hasUploadedSurvey(order)
                                ? `已上传(${order.surveyFiles?.length})`
                                : '上传HOME测量单'}
                            </PaperButton>
                          )}
                          {canGoSurvey() && (
                            <PaperButton
                              size="small"
                              variant={hasUploadedSurvey(order) ? "primary" : "outline"}
                              onClick={() => handleGoSurvey(order)}
                              disabled={!hasUploadedSurvey(order)}
                              className={!hasUploadedSurvey(order) ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              去测量
                            </PaperButton>
                          )}
                          {canCloseOrder() && (
                            <PaperButton
                              size="small"
                              variant="outline"
                              onClick={() => handleCloseOrder(order)}
                            >
                              关闭
                            </PaperButton>
                          )}
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  )
                })
              )}
            </PaperTableBody>
          </PaperTable>
        </PaperCardContent>
      </PaperCard>

      {/* 去测量确认对话框 */}
      <PaperDialog
        open={showGoSurveyDialog}
        onOpenChange={setShowGoSurveyDialog}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认去测量</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <p>您确定要开始测量订单 <strong>{currentOrder?.quoteNo}</strong> 吗？</p>
          <div className="bg-green-50 p-3 rounded-md mt-3">
            <p className="text-sm text-green-800">
              ✓ 已上传 <strong>{currentOrder?.surveyFiles?.length || 0}</strong> 个HOME测量单文件
            </p>
          </div>
          <p className="text-ink-500 text-sm mt-2">此操作将把订单状态更新为测量中，并进入派单流程。</p>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowGoSurveyDialog(false)}>
            取消
          </PaperButton>
          <PaperButton variant="primary" onClick={confirmGoSurvey}>
            确认
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 关闭订单对话框 */}
      <PaperDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>关闭订单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-ink-800 mb-2">订单信息</h4>
              <p>报价单单号：<strong>{currentOrder?.quoteNo}</strong></p>
              <p>客户：<strong>{currentOrder?.customer}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">关闭原因</label>
              <PaperTextarea
                placeholder="请输入关闭订单的原因"
                value={closeReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCloseReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>审批流程：</strong>销售负责人 → 渠道负责人
              </p>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowCloseDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmCloseOrder}
            disabled={!closeReason.trim()}
          >
            提交审批
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 上传HOME测量单对话框 */}
      <PaperDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        className="max-w-2xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>上传HOME测量单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-ink-800 mb-2">订单信息</h4>
              <p>报价单单号：<strong>{currentOrder?.quoteNo}</strong></p>
              <p>客户：<strong>{currentOrder?.customer}</strong></p>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                💡 上传HOME测量单后，才能点击&ldquo;去测量&rdquo;按钮进入派单流程
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                上传HOME测量单（支持图片、PDF等格式）
              </label>
              <PaperFileUpload
                onUpload={handleFileUpload}
                accept="image/*,.pdf"
                multiple
                maxSizeMB={5}
                onValidateError={(errs) => setToast({ message: errs.join('；'), type: 'error' })}
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h5 className="text-sm font-medium text-ink-700">
                    已选择文件（{uploadedFiles.length}个）：
                  </h5>
                  <div className="space-y-1">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-ink-800">{file.name}</span>
                        <PaperButton
                          size="small"
                          variant="ghost"
                          onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                        >
                          删除
                        </PaperButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowUploadDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmUploadSurvey}
            disabled={uploadedFiles.length === 0}
          >
            确认上传
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 真实报价弹窗 */}
      <PaperDialog
        open={showRealQuoteDialog}
        onOpenChange={setShowRealQuoteDialog}
        className="max-w-3xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>真实报价 - {currentOrder?.leadNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          {currentOrder && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-ink-800 mb-3">客户信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">客户姓名</label>
                    <input type="text" value={currentOrder.customer} disabled className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">创建日期</label>
                    <input type="text" value={currentOrder.createDate} disabled className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-ink-800 mb-3">产品信息</h4>
                <div className="space-y-4">
                  {currentOrder.products.map((product) => (
                    <div key={product.id} className="border p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">产品名称</label>
                          <input type="text" value={product.name} disabled className="w-full p-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">型号</label>
                          <input type="text" value={product.model} disabled className="w-full p-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">数量</label>
                          <input type="text" value={product.quantity.toString()} disabled className="w-full p-2 border rounded" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">尺寸</label>
                          <input type="text" value={product.size} className="w-full p-2 border rounded" />
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>师傅测量真实尺寸：</strong>{product.realSize}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">单价</label>
                          <input type="text" value={product.unitPrice.toString()} disabled className="w-full p-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">总价</label>
                          <input type="text" value={product.totalPrice.toString()} disabled className="w-full p-2 border rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <PaperButton variant="outline" onClick={() => setShowRealQuoteDialog(false)}>
                  取消
                </PaperButton>
                <PaperButton variant="primary" onClick={() => {
                  saveQuote()
                  setShowRealQuoteDialog(false)
                }}>
                  保存
                </PaperButton>
              </div>
            </div>
          )}
        </PaperDialogContent>
      </PaperDialog>

      {/* 版本历史弹窗 - 支持版本切换和选择 */}
      <PaperDialog
        open={showVersionHistoryDialog}
        onOpenChange={setShowVersionHistoryDialog}
        className="max-w-5xl"
      >
        <PaperDialogHeader className="flex justify-between items-center">
          <PaperDialogTitle>报价单版本选择 - {currentOrder?.leadNo}</PaperDialogTitle>
          <PaperButton variant="primary" onClick={() => {
            // 基于当前版本再报价 - 打开报价页面
            setShowVersionHistoryDialog(false)
            setShowRealQuoteDialog(true)
            setToast({ message: '进入报价编辑页面', type: 'success' })
          }}>
            基于当前版本报价
          </PaperButton>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-6">
            {/* 报价单内容展示区域 - 添加ref用于PDF导出 */}
            <div ref={quoteContentRef} className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-ink-800 mb-4">报价单内容</h4>

              {/* 客户信息 - 更紧凑的单行布局 */}
              <div className="mb-4 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                <strong>客户：</strong>{currentOrder?.customer || ''} |
                <strong>线索号：</strong>{currentOrder?.leadNo || ''} |
                <strong>设计师：</strong>{currentOrder?.designer || ''} |
                <strong>导购：</strong>{currentOrder?.sales || ''} |
                <strong>项目地址：</strong>{currentOrder?.projectAddress || ''}
              </div>

              {/* 产品列表 */}
              <div className="mb-4">
                <h5 className="font-medium text-ink-800 mb-2">产品列表</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrder?.products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{product.unitPrice}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{product.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 金额汇总 */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-ink-700">总金额：</span>
                    <span className="text-sm font-bold text-ink-800">¥{currentOrder?.draftAmount.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 版本选择缩略图区域 */}
            <div>
              <h4 className="font-medium text-ink-800 mb-3">选择版本</h4>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {versionHistory.map((version) => (
                  <div
                    key={version.id}
                    className={`flex-shrink-0 w-40 border rounded-lg p-3 cursor-pointer transition-all ${version.version === currentOrder?.version ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'
                      }`}
                    onClick={() => {
                      // 切换到选中的版本
                    }}
                  >
                    <div className="text-center">
                      <div className={`text-lg font-bold mb-1 ${version.version === currentOrder?.version ? 'text-primary' : 'text-ink-800'
                        }`}>
                        V{version.version}
                      </div>
                      <div className="text-xs text-ink-500 mb-1">{version.createDate}</div>
                      <div className="text-sm font-medium">¥{version.amount.toLocaleString()}</div>
                      <PaperBadge
                        variant={version.isFormal ? "success" : "warning"}
                        className="mt-1"
                      >
                        {version.isFormal ? "正式" : "非正式"}
                      </PaperBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <div className="flex space-x-2">
            <PaperButton variant="outline" onClick={() => setShowVersionHistoryDialog(false)}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={() => {
              // 设置为当前版本
              setShowVersionHistoryDialog(false)
              setToast({ message: '已设置为当前版本', type: 'success' })
            }}>
              设置为当前版本
            </PaperButton>
          </div>
          <div className="flex space-x-2">
            <PaperButton variant="outline" onClick={() => {
              // 导出Excel
              exportToExcel()
            }}>
              导出Excel
            </PaperButton>
            <PaperButton variant="outline" onClick={() => {
              // 导出PDF
              exportToPDF()
            }}>
              导出PDF
            </PaperButton>
          </div>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 提示消息 */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 bg-white border-l-4 ${toast.type === 'success' ? 'border-green-500' :
          toast.type === 'error' ? 'border-red-500' :
            'border-blue-500'
          }`}>
          <p className="text-sm text-ink-800">{toast.message}</p>
        </div>
      )}
    </div>
  )
}
