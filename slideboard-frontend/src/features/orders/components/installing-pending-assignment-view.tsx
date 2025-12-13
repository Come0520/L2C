'use client'

import React, { useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTimeEditComponent } from '@/components/ui/paper-date-time-picker'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// Mock data for installers
const MOCK_INSTALLERS = {
  curtain: [
    { id: '1', name: '安装师A', count: 120, onTime: '96%', accept: '98%', area: '上海市-普陀区' },
    { id: '2', name: '安装师B', count: 95, onTime: '94%', accept: '95%', area: '上海市-静安区' },
    { id: '3', name: '安装师C', count: 150, onTime: '97%', accept: '99%', area: '上海市-徐汇区' },
  ],
  wallpaper: [
    { id: '4', name: '安装师D', count: 130, onTime: '95%', accept: '96%', area: '上海市-黄浦区' },
    { id: '5', name: '安装师E', count: 110, onTime: '93%', accept: '94%', area: '上海市-长宁区' },
  ],
  wallpanel: [
    { id: '6', name: '安装师F', count: 100, onTime: '94%', accept: '97%', area: '上海市-虹口区' },
  ]
}

interface Order {
  id: string
  salesNo: string
  installNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  preferredTime: string
  remainingTime: number // in minutes
  priority: 'normal' | 'urgent' | 'complex'
  status: 'pending_assignment'
  creator: string // 开单人
  surveyorName: string // 之前的测量师姓名
  surveyorId: string // 之前的测量师ID
  remark?: string // 备注
}

// Mock data for orders
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    salesNo: 'XS2024010001',
    installNo: 'AZ2024010001-A',
    customerName: '王先生',
    customerPhone: '13800138000',
    address: '朝阳区',
    category: '窗帘',
    preferredTime: '明日14:00',
    remainingTime: 210, // 3h 30m
    priority: 'urgent',
    status: 'pending_assignment',
    creator: '张三 (驻店)',
    surveyorName: '安装师A', // 之前的测量师，同时也是安装师
    surveyorId: '1',
    remark: '客户要求尽快上门'
  },
  {
    id: '2',
    salesNo: 'XS2024010002',
    installNo: 'AZ2024010002-A',
    customerName: '李女士',
    customerPhone: '13900139000',
    address: '海淀区',
    category: '墙布',
    preferredTime: '后天10:00',
    remainingTime: 45, // 45m (warning)
    priority: 'normal',
    status: 'pending_assignment',
    creator: '李四 (远程)',
    surveyorName: '测量师X', // 之前的测量师，不是安装师
    surveyorId: '999',
    remark: '需携带新款安装工具'
  }
]

// Extract all unique areas from mock data for the filter
const ALL_AREAS = Array.from(new Set(
  Object.values(MOCK_INSTALLERS).flat().map(s => s.area)
)).sort()

const ALL_CATEGORIES = [
  { value: 'all', label: '全部品类' },
  { value: 'curtain', label: '窗帘' },
  { value: 'wallpaper', label: '墙布' },
  { value: 'wallpanel', label: '墙咔' },
]

export function InstallingPendingAssignmentView() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  
  // Filters for installers
  const [installerCityFilter, setInstallerCityFilter] = useState('all')
  const [installerCategoryFilter, setInstallerCategoryFilter] = useState('all')

  // Filter logic for installers
  const filteredInstallers = Object.entries(MOCK_INSTALLERS).reduce((acc, [category, installers]) => {
    // Filter by category
    if (installerCategoryFilter !== 'all' && category !== installerCategoryFilter) {
      return acc
    }

    // Filter installers by city/area
    const filteredList = installers.filter(s => 
      installerCityFilter === 'all' || s.area === installerCityFilter
    )

    if (filteredList.length > 0) {
      acc[category] = filteredList
    }
    return acc
  }, {} as Record<string, typeof MOCK_INSTALLERS['curtain']>)

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

  const handleAssign = (order: Order) => {
    setSelectedOrder(order)
    setIsAssignModalOpen(true)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const matchesSalesOrInstallNo = order.salesNo.includes(searchTerm) || order.installNo.includes(searchTerm)
    const matchesCustomer = order.customerName.includes(customerSearch) || order.customerPhone.includes(customerSearch)
    const matchesAddress = order.address.includes(addressSearch)
    return matchesSalesOrInstallNo && matchesCustomer && matchesAddress
  })

  // 备注编辑弹窗状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<Order | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // 打开备注编辑弹窗
  const openRemarkModal = (order: Order) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark || '')
    setIsRemarkModalOpen(true)
  }

  // 保存备注
  const saveRemark = () => {
    if (!selectedOrderForRemark) return
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrderForRemark.id) {
        return {
          ...order,
          remark: remarkValue
        }
      }
      return order
    }))
    setIsRemarkModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area (Top) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">正常状态 (&gt;2h)</div>
                <div className="text-3xl font-bold text-green-700 mt-1">5</div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">紧急状态 (1-2h)</div>
                <div className="text-3xl font-bold text-orange-700 mt-1">2</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="text-2xl">!</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">超期预警 (&lt;1h)</div>
                <div className="text-3xl font-bold text-red-700 mt-1">1</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Order List Area (Middle - Blue Area) */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10 flex-1">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent p-4 flex justify-between items-center">
            <div className="flex gap-4">
                <PaperInput 
                  placeholder="搜索销售单/安装单号" 
                  className="w-64 bg-white/50" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <PaperInput 
                  placeholder="客户姓名/电话" 
                  className="w-48 bg-white/50" 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <PaperInput 
                  placeholder="搜索地址" 
                  className="w-48 bg-white/50" 
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                />
                <PaperButton variant="outline">查询</PaperButton>
            </div>
            <div className="text-sm font-medium text-ink-600">
                待分配订单: {filteredOrders.length}
            </div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
              <PaperTableCell>销售单编号</PaperTableCell>
              <PaperTableCell>安装单编号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>产品信息</PaperTableCell>
              <PaperTableCell>开单人</PaperTableCell>
              <PaperTableCell>预约偏好</PaperTableCell>
              <PaperTableCell>时效状态</PaperTableCell>
              <PaperTableCell>优先级</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {filteredOrders.map(order => (
                <PaperTableRow key={order.id}>
                  <PaperTableCell className="font-mono text-xs">{order.salesNo}</PaperTableCell>
                  <PaperTableCell className="font-mono text-xs">{order.installNo}</PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                  </PaperTableCell>
                  <PaperTableCell>{order.category}</PaperTableCell>
                  <PaperTableCell className="text-sm text-gray-700">{order.creator}</PaperTableCell>
                  <PaperTableCell>
                    <PaperTimeEditComponent
                      value={order.preferredTime}
                      onChange={(newValue) => {
                        setOrders(prev => prev.map(o => {
                          if (o.id === order.id) {
                            return { ...o, preferredTime: newValue }
                          }
                          return o
                        }))
                      }}
                    />
                  </PaperTableCell>
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
                      size="small" 
                      onClick={() => handleAssign(order)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      分配
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

      {/* 3. Installer Resource Panel (Bottom - Orange Area) */}
      <PaperCard className="border-orange-200 shadow-sm ring-1 ring-orange-100">
        <PaperCardHeader className="pb-4 border-b border-orange-100 bg-orange-50/30">
          <PaperCardTitle className="text-base flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              可用安装师资源
            </span>
            <div className="flex items-center gap-3">
              <select 
                className="text-sm border border-orange-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                value={installerCityFilter}
                onChange={(e) => setInstallerCityFilter(e.target.value)}
              >
                <option value="all">全部区域</option>
                {ALL_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <select 
                className="text-sm border border-orange-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                value={installerCategoryFilter}
                onChange={(e) => setInstallerCategoryFilter(e.target.value)}
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <span className="text-sm font-normal text-gray-500 pl-2 border-l border-orange-200">
                {Object.values(filteredInstallers).flat().length}人在线
              </span>
            </div>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(filteredInstallers).map(([category, installers]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center bg-gray-50 p-2 rounded">
                  {category === 'curtain' ? '📋 窗帘安装师' : category === 'wallpaper' ? '🧱 墙布安装师' : '☕ 墙咔安装师'}
                  <span className="ml-2 text-gray-500 font-normal text-xs">({installers.length}人)</span>
                </h4>
                <div className="grid gap-3">
                  {installers.map(installer => (
                    <div key={installer.id} className="border rounded-lg p-3 text-sm hover:shadow-md transition-shadow bg-white group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{installer.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {installer.area}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">单数</div>
                            <div className="font-medium text-gray-700">{installer.count}</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">准时</div>
                            <div className="font-medium text-gray-700">{installer.onTime}</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-gray-400 scale-90">接单</div>
                            <div className="font-medium text-gray-700">{installer.accept}</div>
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
              <h3 className="text-lg font-bold">手动分配安装师</h3>
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
                        <div className="col-span-2"><span className="text-gray-500">地址:</span> {selectedOrder.address}</div>
                    </div>
                </div>

                {/* Recommended Installers */}
                <div>
                    <h4 className="font-medium mb-3">推荐安装师 ({selectedOrder.category})</h4>
                    <div className="space-y-2">
                        {/* 优先推荐之前的测量师（如果他也是安装师的话） */}
                        {(() => {
                          // 获取当前品类的安装师列表
                          const categoryInstallers = MOCK_INSTALLERS[selectedOrder.category as keyof typeof MOCK_INSTALLERS] || [];
                          // 检查之前的测量师是否是当前品类的安装师
                          const previousSurveyorAsInstaller = categoryInstallers.find(installer => installer.id === selectedOrder.surveyorId);
                          
                          if (previousSurveyorAsInstaller) {
                            return (
                              <label key="previous-surveyor" className="flex items-center p-3 border rounded hover:bg-blue-50 cursor-pointer group bg-green-50 border-green-200">
                                <input type="radio" name="installer" className="mr-3" defaultChecked />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{previousSurveyorAsInstaller.name} <span className="text-green-600 text-xs ml-2">推荐度: 100% <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded ml-1">原测量师</span></span></span>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                      <span>{previousSurveyorAsInstaller.area}</span>
                                      <span>|</span>
                                      <span>准时{previousSurveyorAsInstaller.onTime}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-green-700 mt-1">
                                    优先推荐：该安装师是之前的测量师，熟悉客户情况
                                  </div>
                                </div>
                              </label>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* 其他推荐安装师 */}
                        {(() => {
                          // 获取当前品类的安装师列表
                          const categoryInstallers = MOCK_INSTALLERS[selectedOrder.category as keyof typeof MOCK_INSTALLERS] || [];
                          // 过滤掉之前的测量师（如果他已经被优先推荐）
                          const otherInstallers = categoryInstallers.filter(installer => installer.id !== selectedOrder.surveyorId);
                          
                          return otherInstallers.map((s, idx) => (
                            <label key={s.id} className="flex items-center p-3 border rounded hover:bg-blue-50 cursor-pointer group">
                              <input type="radio" name="installer" className="mr-3" defaultChecked={!categoryInstallers.find(installer => installer.id === selectedOrder.surveyorId) && idx === 0} />
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
                          ));
                        })()}
                        
                        {/* 手动选择其他安装师选项 */}
                        <label className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                             <input type="radio" name="installer" className="mr-3" />
                             <span className="text-gray-600">手动选择其他安装师</span>
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
                <PaperButton variant="primary" onClick={async () => {
                    if (selectedOrder) {
                      try {
                        const { error } = await supabase
                          .from('orders')
                          .update({ status: ORDER_STATUS.INSTALLING_ASSIGNING })
                          .eq('id', selectedOrder.id)
                        if (error) throw error
                      } catch (error) {
                        logger.error('更新订单状态失败', { resourceType: 'order', resourceId: selectedOrder?.id, details: { error } })
                        toast.error('更新状态失败')
                        return
                      }
                    }
                    toast.success('分配成功');
                    setIsAssignModalOpen(false);
                }}>确认分配</PaperButton>
            </div>
          </div>
        </div>
      )}

      {/* Remark Edit Modal */}
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

                {/* Remark Edit */}
                <div>
                    <h4 className="font-medium mb-2">备注内容</h4>
                    <PaperInput
                      type="textarea"
                      value={remarkValue}
                      onChange={(e) => setRemarkValue(e.target.value)}
                      placeholder="请输入备注内容..."
                      className="w-full h-32 text-sm"
                    />
                </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setIsRemarkModalOpen(false)}>取消</PaperButton>
                <PaperButton variant="primary" onClick={saveRemark}>保存</PaperButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
