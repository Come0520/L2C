'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperInput } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'

// Mock data for surveyors
const MOCK_SURVEYORS = {
  curtain: [
    { id: '1', name: '吴师傅', count: 156, onTime: '98%', accept: '95%', area: '上海市-普陀区' },
    { id: '2', name: '张师傅', count: 89, onTime: '96%', accept: '92%', area: '上海市-静安区' },
    { id: '3', name: '王师傅', count: 203, onTime: '99%', accept: '97%', area: '上海市-徐汇区' },
  ],
  wallpaper: [
    { id: '4', name: '李师傅', count: 178, onTime: '97%', accept: '94%', area: '上海市-黄浦区' },
    { id: '5', name: '赵师傅', count: 134, onTime: '95%', accept: '89%', area: '上海市-长宁区' },
  ],
  wallpanel: [
    { id: '6', name: '刘师傅', count: 145, onTime: '96%', accept: '93%', area: '上海市-虹口区' },
  ]
}

interface UploadedFile {
  id: string
  name: string
  url: string
}

import { ORDER_STATUS } from '@/constants/order-status'

interface MeasurementOrder {
  id: string
  leadId: string
  salesNo: string
  measurementNo: string
  customerName: string
  customerPhone: string
  projectAddress: string
  category: string
  preferredTime: string
  remainingTime: number // in minutes
  priority: 'normal' | 'urgent' | 'complex'
  status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
  creator: string // 开单人 (远程销售/驻店销售)
  remark?: string // 备注
  homeSurveyFiles: UploadedFile[] // HOME测量单文件
  auditStatus: 'pending' | 'approved' | 'rejected' // 审核状态
}

// Mock data for orders
const MOCK_MEASUREMENT_ORDERS: MeasurementOrder[] = [
  {
    id: '1',
    leadId: 'lead-1',
    salesNo: 'XS2024010001',
    measurementNo: 'CL2024010001-A',
    customerName: '王先生',
    customerPhone: '13800138000',
    projectAddress: '朝阳区',
    category: '窗帘',
    preferredTime: '明日14:00',
    remainingTime: 210, // 3h 30m
    priority: 'urgent',
    status: ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT,
    creator: '张三 (驻店)',
    remark: '客户要求尽快上门',
    homeSurveyFiles: [
      { id: 'f1', name: 'HOME测量单-王先生-窗帘.pdf', url: '#' },
      { id: 'f2', name: '测量现场照片1.jpg', url: '#' }
    ],
    auditStatus: 'approved' // 初始审核状态为待审核
  },
  {
    id: '2',
    leadId: 'lead-2',
    salesNo: 'XS2024010002',
    measurementNo: 'CL2024010002-A',
    customerName: '李女士',
    customerPhone: '13900139000',
    projectAddress: '海淀区',
    category: '墙布',
    preferredTime: '后天10:00',
    remainingTime: 45, // 45m (warning)
    priority: 'normal',
    status: ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT,
    creator: '李四 (远程)',
    remark: '需携带新款色卡',
    homeSurveyFiles: [
      { id: 'f3', name: 'HOME测量单-李女士-墙布.pdf', url: '#' }
    ],
    auditStatus: 'approved' // 初始审核状态为待审核
  }
]

// Extract all unique areas from mock data for the filter
const ALL_AREAS = Array.from(new Set(
  Object.values(MOCK_SURVEYORS).flat().map(s => s.area)
)).sort()

const ALL_CATEGORIES = [
  { value: 'all', label: '全部品类' },
  { value: 'curtain', label: '窗帘' },
  { value: 'wallpaper', label: '墙布' },
  { value: 'wallpanel', label: '墙咔' },
]

export function MeasurementPendingAssignmentView() {
  const [orders, setOrders] = useState<MeasurementOrder[]>(MOCK_MEASUREMENT_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<MeasurementOrder | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  
  // Preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [currentPreviewFile, setCurrentPreviewFile] = useState<UploadedFile | null>(null)
  
  // Filters for surveyors
  const [surveyorCityFilter, setSurveyorCityFilter] = useState('all')
  const [surveyorCategoryFilter, setSurveyorCategoryFilter] = useState('all')

  // Filter logic for surveyors
  const filteredSurveyors = Object.entries(MOCK_SURVEYORS).reduce((acc, [category, surveyors]) => {
    // Filter by category
    if (surveyorCategoryFilter !== 'all' && category !== surveyorCategoryFilter) {
      return acc
    }

    // Filter surveyors by city/area
    const filteredList = surveyors.filter(s => 
      surveyorCityFilter === 'all' || s.area === surveyorCityFilter
    )

    if (filteredList.length > 0) {
      acc[category] = filteredList
    }
    return acc
  }, {} as Record<string, typeof MOCK_SURVEYORS['curtain']>)

  // Format remaining time
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `剩余${h}小时${m}分钟`
  }

  // Get status color based on remaining time
  const getStatusColor = (minutes: number) => {
    if (minutes > 120) return 'text-green-600 bg-green-50'
    if (minutes > 60) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const handleAssign = (order: MeasurementOrder) => {
    setSelectedOrder(order)
    setIsAssignModalOpen(true)
  }

  // 查看HOME测量单
  const handleViewHomeSurvey = (order: MeasurementOrder) => {
    setSelectedOrder(order)
    setIsAuditModalOpen(true)
  }

  // 处理审核结果
  const handleAuditResult = (result: 'approve' | 'reject') => {
    // 这里可以添加API调用，实际处理审核结果
    if (selectedOrder) {
      if (result === 'approve') {
        // 确认审核通过，更新订单审核状态为approved
        toast.success('HOME测量单审核通过，现在可以进行分配')
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, auditStatus: 'approved' } 
            : order
        ))
      } else {
        // 驳回审核，返回待测量状态
        toast.error('HOME测量单审核驳回，订单已返回待测量状态')
        // 从列表中移除订单（模拟返回待测量状态）
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id))
      }
    }
    setIsAuditModalOpen(false)
  }

  // 处理文件预览
  const handlePreviewFile = (file: UploadedFile) => {
    setCurrentPreviewFile(file)
    setIsPreviewModalOpen(true)
  }
  
  // 备注编辑模态框状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<MeasurementOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')
  
  // 打开备注编辑模态框
  const openRemarkModal = (order: MeasurementOrder) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark || '')
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

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area (Top) */}
      <div className="grid grid-cols-3 gap-4">
        <PaperCard className="bg-green-50 border-green-100">
          <PaperCardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600">正常状态 (&gt;2h)</div>
              <div className="text-2xl font-bold text-green-700">5</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700">✓</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard className="bg-orange-50 border-orange-100">
          <PaperCardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-600">紧急状态 (1-2h)</div>
              <div className="text-2xl font-bold text-orange-700">2</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700">!</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard className="bg-red-50 border-red-100">
          <PaperCardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600">超期预警 (&lt;1h)</div>
              <div className="text-2xl font-bold text-red-700">1</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center text-red-700">⚠</div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Order List Area (Middle - Blue Area) */}
      <PaperCard className="border-blue-200 shadow-sm ring-1 ring-blue-100 flex-1">
        <div className="p-4 border-b border-blue-100 bg-blue-50/30 flex justify-between items-center">
            <div className="flex gap-4">
                <PaperInput placeholder="搜索销售单/测量单号" className="w-64 bg-white" />
                <PaperInput placeholder="客户姓名/电话" className="w-48 bg-white" />
                <PaperButton variant="outline" className="bg-white hover:bg-gray-50">查询</PaperButton>
            </div>
            <div className="text-sm text-blue-600 font-medium">
                待分配测量订单: {orders.length}
            </div>
        </div>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>销售单编号</PaperTableCell>
              <PaperTableCell>测量单编号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>产品信息</PaperTableCell>
              <PaperTableCell>开单人</PaperTableCell>
              <PaperTableCell>预约偏好</PaperTableCell>
              <PaperTableCell>时效状态</PaperTableCell>
              <PaperTableCell>优先级</PaperTableCell>
              <PaperTableCell>HOME测量单</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.map(order => (
                <PaperTableRow key={order.id}>
                  <PaperTableCell className="font-mono text-xs">{order.salesNo}</PaperTableCell>
                  <PaperTableCell className="font-mono text-xs">{order.measurementNo}</PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.projectAddress}</div>
                  </PaperTableCell>
                  <PaperTableCell>{order.category}</PaperTableCell>
                  <PaperTableCell className="text-sm text-gray-700">{order.creator}</PaperTableCell>
                  <PaperTableCell>{order.preferredTime}</PaperTableCell>
                  <PaperTableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.remainingTime)}`}>
                      {formatTime(order.remainingTime)}
                    </span>
                  </PaperTableCell>
                  <PaperTableCell>
                      {order.priority === 'urgent' && <PaperBadge variant="error">紧急</PaperBadge>}
                      {order.priority === 'complex' && <PaperBadge variant="warning">复杂</PaperBadge>}
                      {order.priority === 'normal' && <PaperBadge variant="default">普通</PaperBadge>}
                  </PaperTableCell>
                  <PaperTableCell>
                    <PaperButton 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleViewHomeSurvey(order)}
                    >
                      查看附件
                    </PaperButton>
                  </PaperTableCell>
                  <PaperTableCell className="max-w-[150px]">
                    <div 
                      className="truncate text-xs text-gray-500 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      title={order.remark}
                      onDoubleClick={() => openRemarkModal(order)}
                    >
                        {order.remark || '- 双击添加备注'}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <PaperButton 
                      size="sm" 
                      onClick={() => handleAssign(order)}
                      disabled={order.auditStatus !== 'approved'}
                      className={order.auditStatus === 'approved' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                    >
                      分配测量师
                    </PaperButton>
                  </PaperTableCell>
                </PaperTableRow>
              ))}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination 
              currentPage={1}
              totalPages={1}
              totalItems={orders.length}
              itemsPerPage={10}
              onPageChange={() => {}}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 3. Surveyor Resource Panel (Bottom - Orange Area) */}
      <PaperCard className="border-orange-200 shadow-sm ring-1 ring-orange-100">
        <PaperCardHeader className="pb-4 border-b border-orange-100 bg-orange-50/30">
          <PaperCardTitle className="text-base flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              可用测量师资源
            </span>
            <div className="flex items-center gap-3">
              <select 
                className="text-sm border border-orange-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                value={surveyorCityFilter}
                onChange={(e) => setSurveyorCityFilter(e.target.value)}
              >
                <option value="all">全部区域</option>
                {ALL_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <select 
                className="text-sm border border-orange-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                value={surveyorCategoryFilter}
                onChange={(e) => setSurveyorCategoryFilter(e.target.value)}
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <span className="text-sm font-normal text-gray-500 pl-2 border-l border-orange-200">
                {Object.values(filteredSurveyors).flat().length}人在线
              </span>
            </div>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(filteredSurveyors).map(([category, surveyors]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center bg-gray-50 p-2 rounded">
                  {category === 'curtain' ? '📋 窗帘师傅' : category === 'wallpaper' ? '🧱 墙布师傅' : '☕ 墙咔师傅'}
                  <span className="ml-2 text-gray-500 font-normal text-xs">({surveyors.length}人)</span>
                </h4>
                <div className="grid gap-3">
                  {surveyors.map(surveyor => (
                    <div key={surveyor.id} className="border rounded-lg p-3 text-sm hover:shadow-md transition-shadow bg-white group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{surveyor.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {surveyor.area}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">单数</div>
                            <div className="font-medium text-gray-700">{surveyor.count}</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">准时</div>
                            <div className="font-medium text-gray-700">{surveyor.onTime}</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">接单</div>
                            <div className="font-medium text-gray-700">{surveyor.accept}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-auto flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">手动分配测量师</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-500">订单编号:</span> {selectedOrder.salesNo}</div>
                        <div><span className="text-gray-500">客户:</span> {selectedOrder.customerName}</div>
                        <div><span className="text-gray-500">商品类别:</span> {selectedOrder.category}</div>
                        <div><span className="text-gray-500">预约时间:</span> {selectedOrder.preferredTime}</div>
                        <div className="col-span-2"><span className="text-gray-500">地址:</span> {selectedOrder.projectAddress}</div>
                    </div>
                </div>

                {/* Recommended Surveyors */}
                <div>
                    <h4 className="font-medium mb-3">推荐测量师 ({selectedOrder.category})</h4>
                    <div className="space-y-2">
                        {MOCK_SURVEYORS.curtain.map((s, idx) => (
                            <label key={s.id} className="flex items-center p-3 border rounded hover:bg-blue-50 cursor-pointer group">
                                <input type="radio" name="surveyor" className="mr-3" defaultChecked={idx === 0} />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{s.name} <span className="text-green-600 text-xs ml-2">推荐度: {95 - idx * 5}%</span></span>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span>{s.area}</span>
                                            <span>|</span>
                                            <span>准时{s.onTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                        <label className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                             <input type="radio" name="surveyor" className="mr-3" />
                             <span className="text-gray-600">手动选择其他测量师</span>
                        </label>
                    </div>
                </div>

                {/* Remark */}
                <div>
                    <h4 className="font-medium mb-2">分配备注</h4>
                    <textarea 
                        className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="请输入分配备注信息..."
                    ></textarea>
                </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setIsAssignModalOpen(false)}>取消</PaperButton>
                <PaperButton variant="primary" onClick={() => {
                    toast.success('分配成功');
                    setIsAssignModalOpen(false);
                }}>确认分配</PaperButton>
            </div>
          </div>
        </div>
      )}

      {/* HOME测量单审核弹窗 */}
      {isAuditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-auto flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">HOME测量单审核</h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-500">订单编号:</span> {selectedOrder.salesNo}</div>
                        <div><span className="text-gray-500">客户:</span> {selectedOrder.customerName}</div>
                        <div><span className="text-gray-500">商品类别:</span> {selectedOrder.category}</div>
                        <div><span className="text-gray-500">预约时间:</span> {selectedOrder.preferredTime}</div>
                        <div className="col-span-2"><span className="text-gray-500">地址:</span> {selectedOrder.projectAddress}</div>
                    </div>
                </div>

                {/* HOME测量单附件列表 */}
                <div>
                    <h4 className="font-medium mb-3">HOME测量单附件</h4>
                    <div className="space-y-2">
                        {selectedOrder.homeSurveyFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                <div className="flex items-center">
                                    <span className="mr-2 text-blue-500">📄</span>
                                    <span className="text-sm text-gray-800">{file.name}</span>
                                </div>
                                <PaperButton 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handlePreviewFile(file)}
                                >
                                  查看
                                </PaperButton>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 审核意见 */}
                <div>
                    <h4 className="font-medium mb-2">审核意见</h4>
                    <textarea 
                        className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="请输入审核意见..."
                    ></textarea>
                </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
                <PaperButton 
                  variant="outline" 
                  onClick={() => handleAuditResult('reject')}
                >
                  驳回
                </PaperButton>
                <PaperButton 
                  variant="primary" 
                  onClick={() => handleAuditResult('approve')}
                >
                  确认
                </PaperButton>
            </div>
          </div>
        </div>
      )}

      {/* 文件预览弹窗 */}
      {isPreviewModalOpen && currentPreviewFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] overflow-auto flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">文件预览</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{currentPreviewFile.name}</span>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
              </div>
            </div>
            
            <div className="p-6 flex justify-center items-center min-h-[500px]">
              {/* 根据文件类型显示不同的预览内容 */}
              {currentPreviewFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="relative w-full h-[70vh]">
                  <Image 
                    src={currentPreviewFile.url} 
                    alt={currentPreviewFile.name} 
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              ) : currentPreviewFile.name.match(/\.pdf$/i) ? (
                // PDF预览
                <iframe 
                  src={currentPreviewFile.url} 
                  title={currentPreviewFile.name} 
                  className="w-full h-[70vh] border border-gray-200 rounded"
                ></iframe>
              ) : (
                // 其他文件类型，显示下载链接
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">无法直接预览此文件</h4>
                  <p className="text-gray-600 mb-4">文件类型: {currentPreviewFile.name.split('.').pop()?.toUpperCase()}</p>
                  <a 
                    href={currentPreviewFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <span className="mr-2">⬇️</span> 下载文件
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 备注编辑模态框 */}
      {isRemarkModalOpen && selectedOrderForRemark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-auto flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">编辑备注</h3>
              <button onClick={() => setIsRemarkModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-500">订单编号:</span> {selectedOrderForRemark.salesNo}</div>
                        <div><span className="text-gray-500">客户:</span> {selectedOrderForRemark.customerName}</div>
                        <div><span className="text-gray-500">商品类别:</span> {selectedOrderForRemark.category}</div>
                        <div><span className="text-gray-500">预约时间:</span> {selectedOrderForRemark.preferredTime}</div>
                    </div>
                </div>

                {/* Remark */}
                <div>
                    <h4 className="font-medium mb-2">备注内容</h4>
                    <textarea 
                        className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="请输入备注信息..."
                        value={remarkValue}
                        onChange={(e) => setRemarkValue(e.target.value)}
                    ></textarea>
                </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setIsRemarkModalOpen(false)}>取消</PaperButton>
                <PaperButton variant="primary" onClick={saveRemark}>确认保存</PaperButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
