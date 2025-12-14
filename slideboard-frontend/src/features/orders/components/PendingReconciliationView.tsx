'use client'

import { CheckCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { PaperFileUpload } from '@/components/ui/paper-file-upload'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { PaperToast } from '@/components/ui/paper-toast'
import { useAuth } from '@/contexts/auth-context'
import { getReconciliationOrders, completeReconciliation, submitDifferenceReconciliation } from '@/features/orders/actions'

// API返回的订单数据类型
export interface ApiOrder {
  id: string
  po_no: string
  sales_no: string
  production_no: string
  total_amount: number
  customer?: {
    name: string
    phone: string
    address: string
  }
  category: string
  designer_name: string
  sales?: {
    name: string
  }
}

// 待对账订单类型定义
interface ReconciliationOrder {
  id: string
  poNo: string
  salesNo: string
  productionNo: string
  amount: number
  customerName: string
  customerPhone: string
  address: string
  category: string
  status: 'pending_reconciliation'
  designer: string
  sales: string
}

// 对账数据类型定义
interface ReconciliationData {
  poNo: string
  orders: ReconciliationOrder[]
  totalAmount: number
}

// 按PO号分组订单
const groupOrdersByPoNo = (orders: ReconciliationOrder[]): ReconciliationData[] => {
  const grouped = orders.reduce((acc, order) => {
    if (!acc[order.poNo]) {
      acc[order.poNo] = {
        poNo: order.poNo,
        orders: [],
        totalAmount: 0
      }
    }
    const group = acc[order.poNo]
    if (group) {
      group.orders.push(order)
      group.totalAmount += order.amount
    }
    return acc
  }, {} as Record<string, ReconciliationData>)
  return Object.values(grouped)
}

export function PendingReconciliationView() {
  const { user } = useAuth()
  const isFinance = (user?.role as string) === 'OTHER_FINANCE'
  // 状态管理
  const [orders, setOrders] = useState<ReconciliationOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoNos, setSelectedPoNos] = useState<string[]>([])
  const [isReconciliationDialogOpen, setIsReconciliationDialogOpen] = useState(false)
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [reconciliationNo, setReconciliationNo] = useState<string>('')
  const [hasDifferences, setHasDifferences] = useState(false)
  const [differenceReason, setDifferenceReason] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [expandedPoNo, setExpandedPoNo] = useState<string | null>(null)

  // 获取待对账订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const data = await getReconciliationOrders()
        // 将Supabase返回的数据转换为组件需要的格式
        const formattedOrders = data.map((order: ApiOrder) => ({
          id: order.id,
          poNo: order.po_no,
          salesNo: order.sales_no,
          productionNo: order.production_no,
          amount: order.total_amount,
          customerName: order.customer?.name || '',
          customerPhone: order.customer?.phone || '',
          address: order.customer?.address || '',
          category: order.category,
          status: 'pending_reconciliation' as const,
          designer: order.designer_name,
          sales: order.sales?.name || ''
        }))
        setOrders(formattedOrders)
      } catch (_error) {
        setToast({ message: '获取待对账订单失败，请刷新页面重试', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // 搜索逻辑
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.salesNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // 按PO号分组的订单数据
  const groupedOrders = groupOrdersByPoNo(filteredOrders)

  // 处理PO号选择
  const handlePoNoSelect = (poNo: string) => {
    setSelectedPoNos(prev => {
      if (prev.includes(poNo)) {
        return prev.filter(item => item !== poNo)
      } else {
        return [...prev, poNo]
      }
    })
  }

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedPoNos.length === groupedOrders.length) {
      setSelectedPoNos([])
    } else {
      setSelectedPoNos(groupedOrders.map(item => item.poNo))
    }
  }

  // 打开对账弹窗
  const handleReconciliation = () => {
    if (!isFinance) {
      setToast({ message: '无权限：仅财务可发起对账', type: 'error' })
      return
    }
    if (selectedPoNos.length === 0) {
      setToast({ message: '请至少选择一个PO号进行对账', type: 'error' })
      return
    }

    // 筛选选中的PO号数据
    const selectedData = groupedOrders.filter(item => selectedPoNos.includes(item.poNo))
    setReconciliationData(selectedData)

    // 生成对账单单号
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const generatedNo = `R${year}${month}${day}${random}`
    setReconciliationNo(generatedNo)

    setIsReconciliationDialogOpen(true)
  }

  // 处理文件上传
  const handleFileUpload = (files: File[]) => {
    const file = files[0]
    if (file) {
      setUploadedFile(file)
      setToast({ message: '文件上传成功', type: 'success' })
    }
  }

  // 刷新订单列表
  const refreshOrders = async () => {
    try {
      const data = await getReconciliationOrders()
      const formattedOrders = data.map((order: ApiOrder) => ({
        id: order.id,
        poNo: order.po_no,
        salesNo: order.sales_no,
        productionNo: order.production_no,
        amount: order.total_amount,
        customerName: order.customer?.name || '',
        customerPhone: order.customer?.phone || '',
        address: order.customer?.address || '',
        category: order.category,
        status: 'pending_reconciliation' as const,
        designer: order.designer_name,
        sales: order.sales?.name || ''
      }))
      setOrders(formattedOrders)
    } catch (_error) {
      setToast({ message: '刷新订单失败，请重试', type: 'error' })
    }
  }

  // 处理对账完成
  const handleReconciliationComplete = async () => {
    if (!isFinance) {
      setToast({ message: '无权限：仅财务可完成对账', type: 'error' })
      return
    }
    try {
      // 收集所有需要对账的订单ID
      const orderIds = reconciliationData.flatMap(group => group.orders.map(order => order.id))
      await completeReconciliation(orderIds)

      // 关闭弹窗并重置状态
      setIsReconciliationDialogOpen(false)
      setSelectedPoNos([])
      setUploadedFile(null)

      // 刷新订单列表
      await refreshOrders()

      setToast({ message: '对账完成，订单状态已更新为待开票', type: 'success' })
    } catch (_error) {
      setToast({ message: '完成对账失败，请重试', type: 'error' })
    }
  }

  // 处理差异对账提交
  const handleDifferenceSubmit = async () => {
    if (!differenceReason.trim()) {
      setToast({ message: '请填写差异原因', type: 'error' })
      return
    }

    try {
      // 收集所有需要对账的订单ID
      const orderIds = reconciliationData.flatMap(group => group.orders.map(order => order.id))
      await submitDifferenceReconciliation(orderIds, differenceReason)

      // 关闭弹窗并重置状态
      setIsReconciliationDialogOpen(false)
      setSelectedPoNos([])
      setUploadedFile(null)
      setDifferenceReason('')

      // 刷新订单列表
      await refreshOrders()

      setToast({ message: '差异对账已提交审批', type: 'success' })
    } catch (_error) {
      setToast({ message: '提交差异对账失败，请重试', type: 'error' })
    }
  }

  // 切换PO号详情展开/折叠
  const togglePoNoDetails = (poNo: string) => {
    setExpandedPoNo(expandedPoNo === poNo ? null : poNo)
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">待回款管理</h1>
        <PaperButton
          variant="primary"
          onClick={refreshOrders}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-all duration-200"
        >
          刷新数据
        </PaperButton>
      </div>

      {/* Toast通知 */}
      {toast && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          className="fixed top-4 right-4 z-50"
        />
      )}

      {/* 搜索和统计区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">待对账订单数</div>
                <div className="text-3xl font-bold text-ink-800 mt-1">
                  {filteredOrders.length}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">待对账总金额</div>
                <div className="text-3xl font-bold text-indigo-600 mt-1">
                  ¥{filteredOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500">PO号组数</div>
                <div className="text-3xl font-bold text-purple-600 mt-1">
                  {groupedOrders.length}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 搜索区域 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperCardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/3">
              <PaperInput
                type="text"
                placeholder="搜索PO号、销售单号或客户名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/50 dark:bg-black/20"
              />
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 待对账订单列表 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="border-b border-black/5 dark:border-white/5 bg-transparent px-6 py-4">
          <h3 className="text-lg font-semibold text-ink-800">待对账订单列表</h3>
        </div>
        <PaperCardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPoNos.length === groupedOrders.length && groupedOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销售</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedOrders.length > 0 ? (
                    groupedOrders.map((group) => {
                      // 获取该PO号下的第一个订单用于显示客户和销售信息
                      const firstOrder = group.orders[0]
                      if (!firstOrder) return null
                      return (
                        <React.Fragment key={group.poNo}>
                          <tr className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedPoNos.includes(group.poNo)}
                                onChange={() => handlePoNoSelect(group.poNo)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => togglePoNoDetails(group.poNo)}
                                  className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {expandedPoNo === group.poNo ? '▼' : '▶'}
                                </button>
                                <span className="font-medium text-gray-800">{group.poNo}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{group.orders.length}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">¥{group.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{firstOrder.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{firstOrder.sales}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <PaperButton
                                size="small"
                                variant="primary"
                                onClick={() => {
                                  setSelectedPoNos([group.poNo])
                                  handleReconciliation()
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded-md transition-all duration-200"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                对账
                              </PaperButton>
                            </td>
                          </tr>

                          {/* 展开的订单详情 */}
                          {expandedPoNo === group.poNo && (
                            <tr>
                              <td colSpan={7} className="px-6 py-0">
                                <div className="bg-gray-50 p-4 border-t border-gray-100">
                                  <PaperTable className="min-w-full">
                                    <PaperTableHeader className="bg-gray-100">
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">销售单号</PaperTableCell>
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">生产单号</PaperTableCell>
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">客户名称</PaperTableCell>
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">金额</PaperTableCell>
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">设计师</PaperTableCell>
                                      <PaperTableCell className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">分类</PaperTableCell>
                                    </PaperTableHeader>
                                    <PaperTableBody>
                                      {group.orders.map((order) => (
                                        <PaperTableRow key={order.id} className="hover:bg-gray-100">
                                          <PaperTableCell className="px-4 py-2 text-sm text-gray-600">{order.salesNo}</PaperTableCell>
                                          <PaperTableCell className="px-4 py-2 text-sm text-gray-600">{order.productionNo}</PaperTableCell>
                                          <PaperTableCell className="px-4 py-2 text-sm text-gray-600">{order.customerName}</PaperTableCell>
                                          <PaperTableCell className="px-4 py-2 text-sm font-medium text-gray-800">¥{order.amount.toFixed(2)}</PaperTableCell>
                                          <PaperTableCell className="px-4 py-2 text-sm text-gray-600">{order.designer}</PaperTableCell>
                                          <PaperTableCell className="px-4 py-2 text-sm text-gray-600">{order.category}</PaperTableCell>
                                        </PaperTableRow>
                                      ))}
                                    </PaperTableBody>
                                  </PaperTable>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        暂无待对账订单
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </PaperCardContent>
      </PaperCard>

      {/* 批量操作区域 */}
      {selectedPoNos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              已选择 <span className="font-semibold text-gray-800">{selectedPoNos.length}</span> 个PO号
            </div>
            <PaperButton
              variant="primary"
              size="large"
              onClick={handleReconciliation}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-200"
            >
              <CheckCircle size={20} />
              批量对账
            </PaperButton>
          </div>
        </div>
      )}

      {/* 对账弹窗 */}
      <PaperDialog
        open={isReconciliationDialogOpen}
        onOpenChange={setIsReconciliationDialogOpen}
        className="max-w-4xl"
      >
        <PaperDialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <PaperDialogTitle className="text-xl font-semibold text-gray-800">对账处理</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent className="p-6">
          <div className="space-y-6">
            {/* 对账单信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">对账单单号</label>
                <PaperInput
                  value={reconciliationNo}
                  readOnly
                  placeholder="自动生成"
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传对账单</label>
                <PaperFileUpload
                  onUpload={handleFileUpload}
                  accept=".pdf,.xls,.xlsx"
                  maxSizeMB={10}
                  onValidateError={(errs) => setToast({ message: errs.join('；'), type: 'error' })}
                  className="border-dashed border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors"
                />
                {uploadedFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle size={16} className="mr-1" />
                    <span>已上传：{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 对账订单列表 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-800">对账订单列表</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销售单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">生产单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reconciliationData.map((group) => (
                      <React.Fragment key={group.poNo}>
                        {group.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.poNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.salesNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.productionNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">¥{order.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* 金额小计 */}
                        <tr className="bg-gray-50 font-medium">
                          <td className="px-6 py-3 whitespace-nowrap text-right" colSpan={3}>
                            <span className="text-sm text-gray-600">{group.poNo} 小计</span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">¥{group.totalAmount.toFixed(2)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                    {/* 总金额 */}
                    <tr className="bg-blue-50 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-right" colSpan={3}>
                        <span className="text-sm text-gray-700">总计</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800">
                        ¥{reconciliationData.reduce((sum, group) => sum + group.totalAmount, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 对账差异处理 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-800">对账差异处理</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">是否存在差异</label>
                  <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="hasDifferences"
                        value="false"
                        checked={!hasDifferences}
                        onChange={() => setHasDifferences(false)}
                        className="rounded-full text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">无差异</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="hasDifferences"
                        value="true"
                        checked={hasDifferences}
                        onChange={() => setHasDifferences(true)}
                        className="rounded-full text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">有差异</span>
                    </label>
                  </div>
                </div>

                {hasDifferences && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">差异原因</label>
                    <PaperTextarea
                      value={differenceReason}
                      onChange={(e) => setDifferenceReason(e.target.value)}
                      placeholder="请详细说明对账差异原因"
                      rows={4}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
          <PaperButton
            variant="outline"
            onClick={() => setIsReconciliationDialogOpen(false)}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            取消
          </PaperButton>
          {!hasDifferences ? (
            <PaperButton
              variant="primary"
              onClick={handleReconciliationComplete}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              对账完成
            </PaperButton>
          ) : (
            <PaperButton
              variant="primary"
              onClick={handleDifferenceSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              差异对账提交
            </PaperButton>
          )}
        </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
