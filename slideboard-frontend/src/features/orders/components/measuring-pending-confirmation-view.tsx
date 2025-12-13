'use client'

import React, { useState, useMemo, useCallback, useDeferredValue } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_PERMISSIONS } from '@/constants/measurement-status'

// Mock Data Types
interface MeasurementRoom {
  name: string
  length: number
  width: number
  height: number
  windows: string
  doors: string
  features: string[] // e.g. "AC position", "Gas meter"
  remark: string
}

interface MeasurementData {
  rooms: MeasurementRoom[]
  photos: string[]
  completedAt: string
  qualityScore?: {
    integrity: number
    accuracy: number
    photos: number
    standard: number
    total: number
    level: string
  }
}

interface PendingConfirmationOrder {
  id: string
  salesNo: string
  surveyNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  surveyor: string
  surveyorPhone: string
  apptTime: string
  completedAt: string // Measurement completed time
  remainingTime: number // minutes (48h countdown)
  status: typeof MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION
  data: MeasurementData
  history: {
    date: string
    surveyor: string
    status: string
    remark?: string
  }[]
}

// 生成更多模拟数据用于测试分页和虚拟滚动
const generateMockOrders = (count: number): PendingConfirmationOrder[] => {
  const orders: PendingConfirmationOrder[] = []
  const categories = ['窗帘', '墙布', '地板', '瓷砖', '门窗']
  const surveyors = ['吴师傅', '郑师傅', '张师傅', '李师傅', '王师傅']
  // 固定状态枚举
  
  for (let i = 1; i <= count; i++) {
    const remainingTime = Math.floor(Math.random() * (48 * 60)) // 0-48小时
    const qualityScore = 3 + Math.random() * 2 // 3-5分
    
    orders.push({
          id: `order-${i}`,
          salesNo: `XS202401${String(i).padStart(4, '0')}`,
          surveyNo: `CL202401${String(i).padStart(4, '0')}-A`,
          customerName: `客户${i}`,
          customerPhone: `13${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
          address: `北京市朝阳区建国路${i}号SOHO现代城${String.fromCharCode(65 + Math.floor(i / 20))}座${String(i).padStart(3, '0')}室`,
          category: categories[Math.floor(Math.random() * categories.length)]!,
          surveyor: surveyors[Math.floor(Math.random() * surveyors.length)]!,
          surveyorPhone: `139${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          apptTime: `2024-01-${String(10 + Math.floor(Math.random() * 20)).padStart(2, '0')} ${String(Math.floor(Math.random() * 12 + 8)).padStart(2, '0')}:00`,
          completedAt: `${String(Math.floor(Math.random() * 12 + 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          remainingTime,
          status: MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION,
          data: {
            completedAt: `2024-01-${String(10 + Math.floor(Math.random() * 20)).padStart(2, '0')} ${String(Math.floor(Math.random() * 12 + 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            rooms: [
              {
                name: '客厅',
                length: 3000 + Math.random() * 3000,
                width: 2500 + Math.random() * 2500,
                height: 2700 + Math.random() * 500,
                windows: `${Math.floor(Math.random() * 2000 + 1000)}mm×${Math.floor(Math.random() * 2000 + 1000)}mm`,
                doors: `${Math.floor(Math.random() * 1000 + 800)}mm×${Math.floor(Math.random() * 500 + 2000)}mm`,
                features: ['空调位置', '燃气表位置'],
                remark: '墙面平整度良好'
              }
            ],
            photos: Array(Math.floor(Math.random() * 4 + 2)).fill('/placeholder-photo.jpg'),
            qualityScore: {
              integrity: Math.floor(qualityScore * 10) / 10,
              accuracy: Math.floor(qualityScore * 10) / 10,
              photos: Math.floor(qualityScore * 10) / 10,
              standard: Math.floor(qualityScore * 10) / 10,
              total: Math.floor(qualityScore * 10) / 10,
              level: qualityScore >= 4.5 ? '优秀' : qualityScore >= 4 ? '良好' : qualityScore >= 3.5 ? '一般' : '较差'
            }
          },
          history: []
        })
  }
  return orders
}


// 表格行组件 - 使用React.memo优化
const OrderTableRow = React.memo(({
  order,
  getTimeStatusColor,
  formatRemainingTime,
  openDetail,
  setIsRejectModalOpen,
  setSelectedOrder,
  canConfirm,
  canReject
}: {
  order: PendingConfirmationOrder;
  getTimeStatusColor: (minutes: number) => string;
  formatRemainingTime: (minutes: number) => string;
  openDetail: (order: PendingConfirmationOrder) => void;
  setIsRejectModalOpen: (open: boolean) => void;
  setSelectedOrder: (order: PendingConfirmationOrder) => void;
  canConfirm: boolean;
  canReject: boolean;
}) => {
  return (
    <PaperTableRow key={order.id} className="content-visibility auto">
      <PaperTableCell>
        <div className="font-mono text-xs text-gray-900">{order.surveyNo}</div>
        <div className="font-mono text-xs text-gray-500">{order.salesNo}</div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="text-sm font-medium">{order.customerName}</div>
        <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
      </PaperTableCell>
      <PaperTableCell>{order.category}</PaperTableCell>
      <PaperTableCell>
        <div className="font-medium">{order.surveyor}</div>
        <div className="text-xs text-gray-500">{order.surveyorPhone}</div>
      </PaperTableCell>
      <PaperTableCell>{order.completedAt}</PaperTableCell>
      <PaperTableCell>
        <div className={`text-sm font-medium ${getTimeStatusColor(order.remainingTime)}`}>
        {formatRemainingTime(order.remainingTime)}
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">{order.data.qualityScore?.total}</span>
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="flex space-x-2">
            {canConfirm && <PaperButton size="small" onClick={() => openDetail(order)}>审核确认</PaperButton>}
            {canReject && <PaperButton size="small" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setSelectedOrder(order); setIsRejectModalOpen(true); }}>驳回</PaperButton>}
            {!canConfirm && !canReject && <span className="text-sm text-gray-500">无操作权限</span>}
        </div>
      </PaperTableCell>
    </PaperTableRow>
  )
});
OrderTableRow.displayName = 'OrderTableRow';

export function MeasuringPendingConfirmationView() {
  // 模拟当前用户角色，实际应从认证系统获取
  const currentUserRole = 'SALES_STORE' // 可以替换为其他角色进行测试
  
  // 生成更多模拟数据用于测试分页和虚拟滚动
  const allOrders = useMemo(() => generateMockOrders(100), [])
  const [orders] = useState<PendingConfirmationOrder[]>(allOrders)
  const [selectedOrder, setSelectedOrder] = useState<PendingConfirmationOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  
  // 权限检查函数
  const canConfirm = MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canConfirm?.includes(currentUserRole) || false
  const canReject = MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canReject?.includes(currentUserRole) || false

  // Helper functions
  const formatRemainingTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `剩余${h}小时${m}分钟`
  }

  const getTimeStatusColor = (minutes: number) => {
    if (minutes > 24 * 60) return 'text-green-600' // > 24h
    if (minutes > 12 * 60) return 'text-orange-600' // 12-24h
    return 'text-red-600 font-bold' // < 12h
  }

  const openDetail = (order: PendingConfirmationOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  // 搜索和过滤
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.surveyNo.includes(searchTerm) || 
        order.salesNo.includes(searchTerm)
      const matchesCustomer = !customerSearch || 
        order.customerName.includes(customerSearch) || 
        order.customerPhone.includes(customerSearch)
      return matchesSearch && matchesCustomer
    })
  }, [orders, searchTerm, customerSearch])

  // 分页数据
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, currentPage, itemsPerPage])

  // 使用useDeferredValue优化大数据渲染
  const deferredPaginatedOrders = useDeferredValue(paginatedOrders)

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleCustomerSearch = useCallback((value: string) => {
    setCustomerSearch(value);
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">正常状态 (&gt;24h)</div>
                <div className="text-3xl font-bold text-green-700">
                  {orders.filter(o => o.remainingTime > 24 * 60).length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600/80 font-medium">
              时效正常，按序处理
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">紧急状态 (12-24h)</div>
                <div className="text-3xl font-bold text-orange-700">
                  {orders.filter(o => o.remainingTime > 12 * 60 && o.remainingTime <= 24 * 60).length}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="text-2xl">!</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600/80 font-medium">
              请优先处理，即将超时
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">超期预警 (&lt;12h)</div>
                <div className="text-3xl font-bold text-red-700">
                  {orders.filter(o => o.remainingTime <= 12 * 60).length}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600/80 font-medium">
              需立即处理，已通知主管
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Order List Area */}
      {!isDetailOpen && (
        <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10 flex-1">
            <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent p-4 flex justify-between items-center">
                <div className="flex gap-4">
                    <PaperInput 
                      placeholder="搜索销售单/测量单号" 
                      className="w-64 bg-white/50" 
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <PaperInput 
                      placeholder="客户姓名/电话" 
                      className="w-48 bg-white/50" 
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                    />
                    <PaperButton variant="outline">查询</PaperButton>
                </div>
            </PaperTableToolbar>
            <PaperCardContent className="p-0">
              <PaperTable>
                <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
                  <PaperTableCell>测量单号</PaperTableCell>
                  <PaperTableCell>客户信息</PaperTableCell>
                  <PaperTableCell>品类</PaperTableCell>
                  <PaperTableCell>测量师</PaperTableCell>
                  <PaperTableCell>完成时间</PaperTableCell>
                  <PaperTableCell>确认时效</PaperTableCell>
                  <PaperTableCell>质量评分</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {deferredPaginatedOrders.map(order => (
                    <OrderTableRow
                      key={order.id}
                      order={order}
                      getTimeStatusColor={getTimeStatusColor}
                      formatRemainingTime={formatRemainingTime}
                      openDetail={openDetail}
                      setIsRejectModalOpen={setIsRejectModalOpen}
                      setSelectedOrder={setSelectedOrder}
                      canConfirm={canConfirm}
                      canReject={canReject}
                    />
                  ))}
                </PaperTableBody>
              </PaperTable>
              <PaperTablePagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
                  totalItems={filteredOrders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
              />
            </PaperCardContent>
        </PaperCard>
      )}

      {/* 3. Detail/Audit View */}
      {isDetailOpen && selectedOrder && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header / Back Button */}
            <div className="flex justify-between items-center">
                <PaperButton variant="outline" onClick={() => setIsDetailOpen(false)}>← 返回列表</PaperButton>
                <div className="flex gap-3">
                    {canReject && <PaperButton variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsRejectModalOpen(true)}>驳回测量单</PaperButton>}
                    {canConfirm && <PaperButton variant="primary" onClick={() => { toast.success('确认成功'); setIsDetailOpen(false); }}>确认测量单</PaperButton>}
                    {!canConfirm && !canReject && <span className="text-sm text-gray-500">无操作权限</span>}
                </div>
            </div>

            {/* Basic Info */}
            <PaperCard>
                <PaperCardHeader className="bg-gray-50 border-b">
                    <PaperCardTitle className="text-base">测量基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                    <div className="grid grid-cols-3 gap-6 text-sm">
                        <div><span className="text-gray-500">测量单编号:</span> {selectedOrder.surveyNo}</div>
                        <div><span className="text-gray-500">测量师:</span> {selectedOrder.surveyor}</div>
                        <div><span className="text-gray-500">完成时间:</span> {selectedOrder.data.completedAt}</div>
                        <div className="col-span-3"><span className="text-gray-500">客户地址:</span> {selectedOrder.address}</div>
                        <div><span className="text-gray-500">测量品类:</span> {selectedOrder.category}</div>
                        <div><span className="text-gray-500">预约时间:</span> {selectedOrder.apptTime}</div>
                        <div><span className="text-gray-500">实际完成:</span> {selectedOrder.data.completedAt}</div>
                    </div>
                </PaperCardContent>
            </PaperCard>

            {/* Measurement Data Detail */}
            <PaperCard>
                <PaperCardHeader className="bg-gray-50 border-b">
                    <PaperCardTitle className="text-base">测量数据详情</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6 space-y-6">
                    {selectedOrder.data.rooms.map((room, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50/50">
                            <h4 className="font-bold text-gray-800 mb-3">【{room.name}】</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div><span className="text-gray-500">长度:</span> {room.length}mm</div>
                                <div><span className="text-gray-500">宽度:</span> {room.width}mm</div>
                                <div><span className="text-gray-500">高度:</span> {room.height}mm</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div><span className="text-gray-500">窗户:</span> {room.windows}</div>
                                <div><span className="text-gray-500">门:</span> {room.doors}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                {room.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="text-gray-700">{feature}</div>
                                ))}
                            </div>
                            <div className="text-sm bg-yellow-50 p-2 rounded text-yellow-800 border border-yellow-100">
                                <span className="font-medium">备注:</span> {room.remark}
                            </div>
                        </div>
                    ))}
                </PaperCardContent>
            </PaperCard>

             {/* Photos */}
             <PaperCard>
                <PaperCardHeader className="bg-gray-50 border-b flex flex-row justify-between items-center">
                    <PaperCardTitle className="text-base">现场照片 (共{selectedOrder.data.photos.length}张)</PaperCardTitle>
                    <PaperButton size="small" variant="ghost">展开全部</PaperButton>
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                    <div className="grid grid-cols-6 gap-4">
                        {selectedOrder.data.photos.map((_, idx) => (
                            <div key={idx} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer hover:opacity-80">
                                照片 {idx + 1}
                            </div>
                        ))}
                    </div>
                </PaperCardContent>
            </PaperCard>

            {/* Audit Checklist & History */}
            <div className="grid grid-cols-2 gap-6">
                <PaperCard>
                    <PaperCardHeader className="bg-gray-50 border-b">
                        <PaperCardTitle className="text-base">测量单审核清单</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent className="p-6">
                        <div className="space-y-3">
                            {['测量数据完整性', '空间信息准确性', '障碍物标识', '特殊要求记录', '现场照片完整', '测量精度检查', '产品规格匹配', '安装条件评估'].map((item, idx) => (
                                <label key={idx} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">{item}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                             <label className="block text-sm font-medium mb-2">审核意见</label>
                             <textarea className="w-full border rounded p-2 h-20 text-sm" placeholder="请输入审核意见（选填）..."></textarea>
                        </div>
                    </PaperCardContent>
                </PaperCard>

                <div className="flex flex-col gap-6">
                    {/* Quality Score */}
                    <PaperCard>
                        <PaperCardHeader className="bg-gray-50 border-b">
                            <PaperCardTitle className="text-base">测量质量评分</PaperCardTitle>
                        </PaperCardHeader>
                        <PaperCardContent className="p-6">
                             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>数据完整性: <span className="font-bold">{selectedOrder.data.qualityScore?.integrity}</span>/5.0</div>
                                <div>照片质量: <span className="font-bold">{selectedOrder.data.qualityScore?.photos}</span>/5.0</div>
                                <div>测量精度: <span className="font-bold">{selectedOrder.data.qualityScore?.accuracy}</span>/5.0</div>
                                <div>记录规范: <span className="font-bold">{selectedOrder.data.qualityScore?.standard}</span>/5.0</div>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                                 <div>
                                     <div className="text-sm text-blue-800">综合评分</div>
                                     <div className="text-2xl font-bold text-blue-700">{selectedOrder.data.qualityScore?.total} <span className="text-sm font-normal text-blue-600">({selectedOrder.data.qualityScore?.level})</span></div>
                                 </div>
                             </div>
                        </PaperCardContent>
                    </PaperCard>

                    {/* History */}
                    <PaperCard className="flex-1">
                        <PaperCardHeader className="bg-gray-50 border-b">
                            <PaperCardTitle className="text-base">测量历史记录</PaperCardTitle>
                        </PaperCardHeader>
                        <PaperCardContent className="p-6">
                            <div className="space-y-4">
                                {selectedOrder.history.length > 0 ? selectedOrder.history.map((h, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm">
                                        <div className="w-24 text-gray-500 text-xs pt-1">{h.date}</div>
                                        <div className="flex-1 pb-4 border-l-2 border-gray-200 pl-4 relative">
                                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                                            <div className="font-medium">{h.surveyor} <span className={`text-xs px-1.5 py-0.5 rounded ${h.status === '驳回' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{h.status}</span></div>
                                            {h.remark && <div className="text-gray-500 mt-1">{h.remark}</div>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-gray-500 text-center py-4">暂无历史记录</div>
                                )}
                            </div>
                        </PaperCardContent>
                    </PaperCard>
                </div>
            </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[500px]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">驳回测量单</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">驳回原因 <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                        {['测量数据不完整', '测量数据不准确', '现场照片缺失', '特殊要求未记录', '产品规格不匹配', '安装条件不满足', '其他原因'].map(reason => (
                            <label key={reason} className="flex items-center space-x-2">
                                <input type="radio" name="rejectReason" className="text-red-600" />
                                <span className="text-sm text-gray-700">{reason}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">详细说明</label>
                    <textarea className="w-full border rounded p-2 h-20 text-sm" placeholder="请详细说明驳回原因，以便测量师重新测量..."></textarea>
                </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
                <PaperButton variant="outline" onClick={() => setIsRejectModalOpen(false)}>取消</PaperButton>
                <PaperButton variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600" onClick={() => { toast.info('已驳回'); setIsRejectModalOpen(false); setIsDetailOpen(false); }}>确认驳回</PaperButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
