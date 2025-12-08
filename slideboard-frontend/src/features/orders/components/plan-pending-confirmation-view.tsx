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
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar } from '@/components/ui/paper-table'
import { PaperToast } from '@/components/ui/paper-toast'
import { PaperTooltip } from '@/components/ui/paper-tooltip'


// 报价单类型定义
interface QuoteItem {
  id: string
  leadNo: string // 线索号
  customer: string
  designer: string
  sales: string
  projectAddress: string
  draftAmount: number
  createDate: string
  version: string
  status: string
  isFormal: boolean
  confirmationDocument?: {
    id: string
    name: string
    url: string
    type: 'image' | 'pdf' | 'doc'
  }
  products: QuoteProduct[]
}

// 报价产品类型定义
interface QuoteProduct {
  id: string
  name: string
  size: string
  realSize: string // 师傅测量的真实尺寸
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

// 上传的文件类型定义
interface UploadedFile {
  id: string
  name: string
  url: string
}

export function PlanPendingConfirmationView() {
  // 状态管理
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)

  // 对话框状态
  const [showRealQuoteDialog, setShowRealQuoteDialog] = useState(false)
  const [showVersionHistoryDialog, setShowVersionHistoryDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // 当前操作的报价单
  const [currentQuote, setCurrentQuote] = useState<QuoteItem | null>(null)

  // 报价单版本历史
  const [versionHistory, setVersionHistory] = useState<QuoteVersion[]>([])

  // 上传的文件
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // 提示消息
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // 用于PDF导出的ref
  const quoteContentRef = useRef<HTMLDivElement>(null)

  // 模拟数据 - 实际应从API获取
  useEffect(() => {
    const mockQuotes: QuoteItem[] = [
      {
        id: '1',
        leadNo: 'LS20241126001',
        customer: '张三',
        designer: '王五',
        sales: '赵六',
        projectAddress: '北京市朝阳区建国路88号',
        draftAmount: 5500,
        createDate: '2024-11-26',
        version: '1.0',
        status: 'plan-pending-confirmation',
        isFormal: false,
        products: [
          {
            id: 'p1',
            name: '窗帘',
            size: '500cm',
            realSize: '520cm',
            model: 'Model A',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 500
          },
          {
            id: 'p2',
            name: '墙布',
            size: '1000cm²',
            realSize: '1050cm²',
            model: 'Model B',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 5000
          }
        ]
      },
      {
        id: '2',
        leadNo: 'LS20241125002',
        customer: '李四',
        designer: '钱七',
        sales: '孙八',
        projectAddress: '上海市浦东新区陆家嘴金融中心',
        draftAmount: 6000,
        createDate: '2024-11-25',
        version: '1.0',
        status: 'plan-pending-confirmation',
        isFormal: false,
        confirmationDocument: {
          id: 'doc1',
          name: '客户确认凭证.pdf',
          url: 'https://example.com/document.pdf',
          type: 'pdf'
        },
        products: [
          {
            id: 'p3',
            name: '背景墙',
            size: '300x200cm',
            realSize: '310x210cm',
            model: 'Model C',
            quantity: 1,
            unitPrice: 200,
            totalPrice: 6000
          }
        ]
      }
    ]

    setQuotes(mockQuotes)
    setLoading(false)
  }, [])

  // 模拟版本历史数据
  const mockVersionHistory: QuoteVersion[] = [
    {
      id: 'v1',
      quoteNo: 'BJ报价-20241126-V1.0',
      version: '1.0',
      createDate: '2024-11-26',
      amount: 5500,
      isFormal: false
    },
    {
      id: 'v2',
      quoteNo: 'BJ报价-20241125-V1.0',
      version: '1.0',
      createDate: '2024-11-25',
      amount: 5200,
      isFormal: false
    }
  ]


  // 打开上传确认凭证弹窗
  const handleOpenUploadDialog = (quote: QuoteItem) => {
    setCurrentQuote(quote)
    setVersionHistory(mockVersionHistory)
    setUploadedFiles([])
    setShowUploadDialog(true)
  }

  // 打开版本历史弹窗
  const handleOpenVersionHistory = (quote: QuoteItem) => {
    setCurrentQuote(quote)
    setVersionHistory(mockVersionHistory)
    setUploadedFiles([])
    setShowVersionHistoryDialog(true)
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

  // 确认上传
  // const confirmUpload = () => {
  //   // 实际应调用API上传文件
  //   setShowVersionHistoryDialog(false)
  //   setToast({ message: '客户确认凭证上传成功', type: 'success' })
  //   
  //   // 更新报价单的确认凭证URL
  //   if (currentQuote) {
  //     setQuotes(prev => prev.map(quote => 
  //       quote.id === currentQuote.id 
  //         ? { ...quote, confirmationDocumentUrl: uploadedFiles[0].url } 
  //         : quote
  //     ))
  //   }
  // }

  // 确认报价单
  const confirmQuote = (quote: QuoteItem) => {
    // 实际应调用API更新报价单状态
    setToast({ message: '报价单已确认，状态已更新为待推单', type: 'success' })

    // 更新报价单状态
    setQuotes(prev => prev.map(q =>
      q.id === quote.id
        ? { ...q, status: 'pending-push' }
        : q
    ))
  }



  // 保存报价单
  const saveQuote = () => {
    // 实际应调用API保存报价单
    setToast({ message: '报价单已保存', type: 'success' })
  }

  // 检查是否可以确认报价单
  const canConfirmQuote = (quote: QuoteItem) => {
    return !!quote.confirmationDocument
  }

  // 导出Excel功能
  const exportToExcel = () => {
    if (!currentQuote) return

    // 准备导出数据
    const exportData = {
      客户信息: [
        { 字段: '客户', 值: currentQuote.customer },
        { 字段: '线索号', 值: currentQuote.leadNo },
        { 字段: '设计师', 值: currentQuote.designer },
        { 字段: '导购', 值: currentQuote.sales },
        { 字段: '项目地址', 值: currentQuote.projectAddress },
        { 字段: '创建日期', 值: currentQuote.createDate },
        { 字段: '当前版本', 值: currentQuote.version },
        { 字段: '总金额', 值: `¥${currentQuote.draftAmount.toLocaleString()}` }
      ],
      产品明细: currentQuote.products.map(product => ({
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
    XLSX.writeFile(workbook, `报价单-${currentQuote.leadNo}-V${currentQuote.version}.xlsx`)
    setToast({ message: 'Excel导出成功', type: 'success' })
  }

  // 导出PDF功能
  const exportToPDF = async () => {
    if (!currentQuote || !quoteContentRef.current) return

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
      pdf.save(`报价单-${currentQuote.leadNo}-V${currentQuote.version}.pdf`)
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
              <h3 className="text-lg font-medium text-ink-800">方案待确认 - 报价单统计</h3>
              <p className="text-ink-500 text-sm">根据您的权限显示相关报价单</p>
            </div>
            <div className="text-right">
              <p className="text-ink-500 text-sm">待确认报价单</p>
              <p className="text-2xl font-bold text-ink-800">{quotes.length}</p>
              <p className="text-ink-500 text-sm mt-1">草签金额</p>
              <p className="text-2xl font-bold text-ink-800">¥{quotes.reduce((sum, quote) => sum + quote.draftAmount, 0).toLocaleString()}</p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 报价单列表 */}
      <PaperCard>
        <PaperTableToolbar>
          <div className="text-sm text-ink-500">共 {quotes.length} 条报价单</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>线索号</PaperTableCell>
              <PaperTableCell>客户</PaperTableCell>
              <PaperTableCell>设计师</PaperTableCell>
              <PaperTableCell>导购</PaperTableCell>
              <PaperTableCell>项目地址</PaperTableCell>
              <PaperTableCell>当前报价单</PaperTableCell>
              <PaperTableCell>金额</PaperTableCell>
              <PaperTableCell>客户确认凭证</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {loading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center text-gray-500">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : quotes.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center text-gray-500">
                    暂无待确认的报价单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                quotes.map((quote) => (
                  <PaperTableRow key={quote.id}>
                    <PaperTableCell>
                      {quote.leadNo}
                    </PaperTableCell>
                    <PaperTableCell>{quote.customer}</PaperTableCell>
                    <PaperTableCell>{quote.designer}</PaperTableCell>
                    <PaperTableCell>{quote.sales}</PaperTableCell>
                    <PaperTableCell>{quote.projectAddress}</PaperTableCell>
                    <PaperTableCell>
                      <PaperButton
                        size="small"
                        variant="outline"
                        onClick={() => handleOpenVersionHistory(quote)}
                      >
                        V{quote.version}
                      </PaperButton>
                    </PaperTableCell>
                    <PaperTableCell>
                      ¥{quote.draftAmount.toLocaleString()}
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        {quote.confirmationDocument ? (
                          <>
                            {/* 已上传的确认凭证 */}
                            <div className="relative">
                            <PaperButton
                              size="small"
                              variant="outline"
                              onClick={() => window.open(quote.confirmationDocument?.url, '_blank')}
                              className="pr-8"
                            >
                              {quote.confirmationDocument.type === 'image' ? '📷' :
                                quote.confirmationDocument.type === 'pdf' ? '📄' : '📋'}
                              {quote.confirmationDocument.name}
                            </PaperButton>
                              {/* 右上角删除按钮 - X图标 */}
                              <button
                                className="absolute top-1 right-1 text-gray-500 hover:text-red-500 transition-colors"
                                onClick={() => {
                                  // 显示确认删除对话框
                                  setCurrentQuote(quote)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        ) : (
                          // 未上传确认凭证，显示上传按钮
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => handleOpenUploadDialog(quote)}
                          >
                            上传
                          </PaperButton>
                        )}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-wrap gap-2">
                        {/* 确认按钮 */}
                        <PaperTooltip content="请先上传客户确认凭证" disabled={canConfirmQuote(quote)}>
                          <div>
                            <PaperButton
                              size="small"
                              variant="primary"
                              onClick={() => confirmQuote(quote)}
                              disabled={!canConfirmQuote(quote)}
                            >
                              确认
                            </PaperButton>
                          </div>
                        </PaperTooltip>

                        {/* 关闭按钮 */}
                        <PaperButton
                          size="small"
                          variant="outline"
                        >
                          关闭
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

      {/* 真实报价弹窗 */}
      <PaperDialog
        open={showRealQuoteDialog}
        onOpenChange={setShowRealQuoteDialog}
        className="max-w-3xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>真实报价 - {currentQuote?.leadNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          {currentQuote && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-ink-800 mb-3">客户信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">客户姓名</label>
                    <PaperInput value={currentQuote.customer} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">创建日期</label>
                    <PaperInput value={currentQuote.createDate} disabled />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-ink-800 mb-3">产品信息</h4>
                <div className="space-y-4">
                  {currentQuote.products.map((product) => (
                    <div key={product.id} className="border p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">产品名称</label>
                          <PaperInput value={product.name} disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">型号</label>
                          <PaperInput value={product.model} disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">数量</label>
                          <PaperInput value={product.quantity.toString()} disabled />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">尺寸</label>
                          <PaperInput value={product.size} />
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
                          <PaperInput value={product.unitPrice.toString()} disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink-700 mb-1">总价</label>
                          <PaperInput value={product.totalPrice.toString()} disabled />
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

      {/* 上传确认凭证弹窗 */}
      <PaperDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        className="max-w-2xl"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>上传客户确认凭证 - {currentQuote?.leadNo}</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-ink-800 mb-2">订单信息</h4>
              <p>线索号：<strong>{currentQuote?.leadNo}</strong></p>
              <p>客户：<strong>{currentQuote?.customer}</strong></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                上传客户确认凭证（支持图片、PDF等格式）
              </label>
              <PaperFileUpload
                onUpload={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx"
                multiple
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

            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>支持的文件类型：</strong>客户签字的纸质文档照片、电子版签字文件、聊天记录截图、PDF格式确认文件等
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
            onClick={() => {
              // 模拟上传，实际应调用API
              setShowUploadDialog(false)
              setToast({ message: '客户确认凭证上传成功', type: 'success' })

              // 更新报价单的确认凭证
              if (currentQuote && uploadedFiles.length > 0) {
                setQuotes(prev => prev.map(quote =>
                  quote.id === currentQuote.id
                    ? {
                      ...quote,
                      confirmationDocument: {
                        id: Math.random().toString(36).slice(2, 11),
                        name: uploadedFiles[0]?.name || 'unknown',
                        url: uploadedFiles[0]?.url || '',
                        type: uploadedFiles[0]?.name.endsWith('.pdf') ? 'pdf' :
                          (uploadedFiles[0]?.name.endsWith('.doc') || uploadedFiles[0]?.name.endsWith('.docx')) ? 'doc' : 'image'
                      }
                    }
                    : quote
                ))
              }
            }}
            disabled={uploadedFiles.length === 0}
          >
            确认上传
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>



      {/* 版本历史弹窗 - 支持版本切换和选择 */}
      <PaperDialog
        open={showVersionHistoryDialog}
        onOpenChange={setShowVersionHistoryDialog}
        className="max-w-5xl"
      >
        <PaperDialogHeader className="flex justify-between items-center">
          <PaperDialogTitle>报价单版本选择 - {currentQuote?.leadNo}</PaperDialogTitle>
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
                <strong>客户：</strong>{currentQuote?.customer || ''} |
                <strong>线索号：</strong>{currentQuote?.leadNo || ''} |
                <strong>设计师：</strong>{currentQuote?.designer || ''} |
                <strong>导购：</strong>{currentQuote?.sales || ''} |
                <strong>项目地址：</strong>{currentQuote?.projectAddress || ''}
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
                      {currentQuote?.products.map((product) => (
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
                    <span className="text-sm font-bold text-ink-800">¥{currentQuote?.draftAmount.toLocaleString() || '0'}</span>
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
                    className={`flex-shrink-0 w-40 border rounded-lg p-3 cursor-pointer transition-all ${version.version === currentQuote?.version ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'
                      }`}
                    onClick={() => {
                      // 切换到选中的版本
                      // 这里应该更新currentQuote的版本信息
                    }}
                  >
                    <div className="text-center">
                      <div className={`text-lg font-bold mb-1 ${version.version === currentQuote?.version ? 'text-primary' : 'text-ink-800'
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

      {/* 删除确认弹窗 */}
      <PaperDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        className="max-w-md"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认删除</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <p className="text-ink-600">确定要删除该客户确认凭证吗？此操作无法撤销。</p>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowDeleteDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              if (currentQuote) {
                setQuotes(prev => prev.map(q =>
                  q.id === currentQuote.id
                    ? { ...q, confirmationDocument: undefined }
                    : q
                ))
                setToast({ message: '客户确认凭证已删除', type: 'success' })
              }
              setShowDeleteDialog(false)
            }}
          >
            删除
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
