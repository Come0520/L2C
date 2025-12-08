'use client'

import { useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter, PaperDialogDescription } from '@/components/ui/paper-dialog'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// Mock data types
interface AssignmentInProgressOrder {
  id: string
  salesNo: string
  installNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  installer: string
  installerPhone: string
  assignedAt: string
  接单状态: 'pending' | 'viewed' | 'accepted' | 'rejected'
  remainingTime: number // minutes (countdown)
  creator: string
  remark?: string
  priority: 'normal' | 'urgent' | 'vip'
}

// Mock data
const MOCK_ORDERS: AssignmentInProgressOrder[] = [
  {
    id: '1',
    salesNo: 'XS2024010020',
    installNo: 'AZ2024010020-A',
    customerName: '赵先生',
    customerPhone: '13811112222',
    address: '北京市朝阳区建国路88号',
    category: '窗帘',
    installer: '安装师A',
    installerPhone: '13900001111',
    assignedAt: '2024-01-26 14:30',
    接单状态: 'pending',
    remainingTime: 300, // 5h
    creator: '李四 (远程)',
    priority: 'normal',
    remark: '客户要求尽快上门'
  },
  {
    id: '2',
    salesNo: 'XS2024010021',
    installNo: 'AZ2024010021-A',
    customerName: '钱女士',
    customerPhone: '13922223333',
    address: '北京市海淀区中关村大街',
    category: '墙布',
    installer: '安装师B',
    installerPhone: '13900002222',
    assignedAt: '2024-01-26 10:00',
    接单状态: 'viewed',
    remainingTime: 180, // 3h
    creator: '王五 (驻店)',
    priority: 'urgent',
    remark: '客户比较着急，请尽量准时'
  },
  {
    id: '3',
    salesNo: 'XS2024010022',
    installNo: 'AZ2024010022-A',
    customerName: '孙先生',
    customerPhone: '13733334444',
    address: '北京市丰台区总部基地',
    category: '墙咔',
    installer: '安装师C',
    installerPhone: '13900003333',
    assignedAt: '2024-01-26 09:00',
    接单状态: 'rejected',
    remainingTime: 60, // 1h
    creator: '赵六 (远程)',
    priority: 'vip',
    remark: 'VIP客户，注意服务态度'
  }
]

// Mock installer status data
const MOCK_INSTALLER_STATUS = [
  { id: '1', name: '安装师A', status: 'online', currentOrders: 3, area: '上海市-普陀区', category: '窗帘' },
  { id: '2', name: '安装师B', status: 'busy', currentOrders: 5, area: '上海市-静安区', category: '墙布' },
  { id: '3', name: '安装师C', status: 'offline', currentOrders: 0, area: '上海市-徐汇区', category: '墙咔' },
  { id: '4', name: '安装师D', status: 'online', currentOrders: 2, area: '上海市-黄浦区', category: '窗帘' },
  { id: '5', name: '安装师E', status: 'busy', currentOrders: 4, area: '上海市-长宁区', category: '墙布' }
]

export function InstallingAssignmentInProgressView() {
  const supabase = createClient()
  const [orders] = useState<AssignmentInProgressOrder[]>(MOCK_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<AssignmentInProgressOrder | null>(null)
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [isReallocateDialogOpen, setIsReallocateDialogOpen] = useState(false)
  const [reassignReason, setReassignReason] = useState('')
  const [selectedInstaller, setSelectedInstaller] = useState<string>('')
  const [reallocateReason, setReallocateReason] = useState('')

  // 备注编辑弹窗状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [selectedOrderForRemark, setSelectedOrderForRemark] = useState<AssignmentInProgressOrder | null>(null)
  const [remarkValue, setRemarkValue] = useState('')

  // 打开备注编辑弹窗
  const openRemarkModal = (order: AssignmentInProgressOrder) => {
    setSelectedOrderForRemark(order)
    setRemarkValue(order.remark || '')
    setIsRemarkModalOpen(true)
  }

  // 保存备注
  const saveRemark = () => {
    if (!selectedOrderForRemark) return
    // 这里可以添加API调用，实际保存备注
    setIsRemarkModalOpen(false)
    setSelectedOrderForRemark(null)
    setRemarkValue('')
  }

  // Helper functions
  const get接单状态Badge = (status: AssignmentInProgressOrder['接单状态']) => {
    switch (status) {
      case 'pending':
        return <PaperBadge className="bg-gray-50 text-gray-700 border-gray-200">待响应</PaperBadge>
      case 'viewed':
        return <PaperBadge className="bg-blue-50 text-blue-700 border-blue-200">已查看</PaperBadge>
      case 'accepted':
        return <PaperBadge className="bg-green-50 text-green-700 border-green-200">已接单</PaperBadge>
      case 'rejected':
        return <PaperBadge className="bg-red-50 text-red-700 border-red-200">已拒单</PaperBadge>
      default:
        return null
    }
  }

  const formatRemainingTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `剩余${h}小时${m}分钟`
  }

  const getTimeStatusColor = (minutes: number) => {
    if (minutes > 240) return 'text-green-600' // > 4h
    if (minutes > 120) return 'text-orange-600' // 2-4h
    return 'text-red-600 font-bold' // < 2h
  }

  const markAccepted = async (order: AssignmentInProgressOrder) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: ORDER_STATUS.INSTALLING_PENDING_VISIT })
      .eq('id', order.id)

    if (error) {
      logger.error('更新订单状态失败', { resourceType: 'order', resourceId: order.id, details: { error } })
      toast.error('更新失败，请重试')
      return
    }
    toast.success('已标记接单，订单进入待上门')
  }

  // Handle reassign order
  const handleReassignOrder = (order: AssignmentInProgressOrder) => {
    setSelectedOrder(order)
    setReassignReason('')
    setIsReassignDialogOpen(true)
  }

  const confirmReassignOrder = async () => {
    if (!selectedOrder || !reassignReason.trim()) return

    try {
      // Update order status to pending assignment and record reason
      const { error } = await supabase
        .from('orders')
        .update({
          status: ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT,
          reassignment_reason: reassignReason,
          reassigned_at: new Date().toISOString(),
          installer_id: null,
          installer_name: null
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success('重新派单成功！订单已回到待分配状态')
      setIsReassignDialogOpen(false)
      setSelectedOrder(null)
      setReassignReason('')
      // Refresh orders list in parent or refetch
    } catch (error) {
      logger.error('重新派单失败', { resourceType: 'order', resourceId: selectedOrder?.id, details: { error } })
      toast.error('重新派单失败,请重试')
    }
  }

  // Handle reallocate order
  const handleReallocateOrder = (order: AssignmentInProgressOrder) => {
    setSelectedOrder(order)
    setSelectedInstaller('')
    setReallocateReason('')
    setIsReallocateDialogOpen(true)
  }

  const confirmReallocateOrder = async () => {
    if (!selectedInstaller) {
      toast.error('请选择安装师')
      return
    }
    if (!reallocateReason.trim()) {
      toast.error('请输入重新分配理由')
      return
    }

    try {
      // Update order with new installer
      const { error } = await supabase
        .from('orders')
        .update({
          installer_name: selectedInstaller,
          reallocation_reason: reallocateReason,
          reallocated_at: new Date().toISOString()
          // installer_id would need to be looked up from installer name
        })
        .eq('id', selectedOrder!.id)

      if (error) throw error

      toast.success('重新分配成功！已更换安装师')
      setIsReallocateDialogOpen(false)
      setSelectedOrder(null)
      setSelectedInstaller('')
      setReallocateReason('')
      // Refresh orders list
    } catch (error) {
      logger.error('重新分配失败', { resourceType: 'order', resourceId: selectedOrder?.id, details: { error } })
      toast.error('重新分配失败,请重试')
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Top Statistics Card */}
      <PaperCard className="bg-blue-50 border-blue-100">
        <PaperCardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-blue-600">分配中订单统计</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {orders.length} 个订单正在分配中
              </div>
              {/* 预警提示 */}
              {(() => {
                const urgentOrders = orders.filter(o => o.remainingTime <= 120); // 2小时内
                const veryUrgentOrders = orders.filter(o => o.remainingTime <= 60); // 1小时内
                if (veryUrgentOrders.length > 0) {
                  return (
                    <div className="flex items-center gap-1 text-red-600 text-sm mt-1 font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      紧急：{veryUrgentOrders.length} 个订单即将超时
                    </div>
                  );
                } else if (urgentOrders.length > 0) {
                  return (
                    <div className="flex items-center gap-1 text-orange-600 text-sm mt-1 font-medium">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      警告：{urgentOrders.length} 个订单接近超时
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-blue-700">待响应</div>
                <div className="text-lg font-bold">{orders.filter(o => o.接单状态 === 'pending').length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-blue-700">已接单</div>
                <div className="text-lg font-bold">{orders.filter(o => o.接单状态 === 'accepted').length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-blue-700">已拒单</div>
                <div className="text-lg font-bold">{orders.filter(o => o.接单状态 === 'rejected').length}</div>
              </div>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 2. Order List Area */}
      <PaperCard className="border-blue-200 shadow-sm ring-1 ring-blue-100 flex-1">
        <div className="p-4 border-b border-blue-100 bg-blue-50/30 flex justify-between items-center">
          <div className="flex gap-4">
            <PaperInput placeholder="搜索销售单/安装单号" className="w-64 bg-white" />
            <PaperInput placeholder="客户姓名/电话" className="w-48 bg-white" />
            <PaperButton
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              查询
            </PaperButton>
          </div>
        </div>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>订单编号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>产品信息</PaperTableCell>
              <PaperTableCell>开单人</PaperTableCell>
              <PaperTableCell>分配信息</PaperTableCell>
              <PaperTableCell>接单状态</PaperTableCell>
              <PaperTableCell>时效状态</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.map(order => (
                <PaperTableRow key={order.id} className={order.priority === 'vip' ? 'bg-yellow-50/30' : ''}>
                  <PaperTableCell>
                    <div className="font-mono text-xs text-gray-900">{order.salesNo}</div>
                    <div className="font-mono text-xs text-gray-500">{order.installNo}</div>
                    {order.priority === 'vip' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">VIP</span>}
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div>{order.category}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm text-gray-700">{order.creator}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="font-medium">{order.installer}</div>
                    <div className="text-xs text-gray-500">{order.installerPhone}</div>
                    <div className="text-xs text-gray-500 mt-1">{order.assignedAt}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="mt-1">{get接单状态Badge(order.接单状态)}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className={`text-sm font-medium ${getTimeStatusColor(order.remainingTime)}`}>
                      {formatRemainingTime(order.remainingTime)}
                    </div>
                  </PaperTableCell>
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
                    <div className="flex flex-col gap-2">
                      <PaperButton size="small" variant="primary" className="h-7 text-xs" onClick={() => markAccepted(order)}>标记已接单</PaperButton>
                      <PaperButton size="small" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleReassignOrder(order)}>重新派单</PaperButton>
                      <PaperButton size="small" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleReallocateOrder(order)}>重新分配</PaperButton>
                    </div>
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
            onPageChange={() => { }}
          />
        </PaperCardContent>
      </PaperCard>

      {/* 3. Installer Status Panel */}
      <PaperCard className="border-orange-200 shadow-sm ring-1 ring-orange-100">
        <PaperCardHeader className="pb-4 border-b border-orange-100 bg-orange-50/30">
          <PaperCardTitle className="text-base flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              安装师实时状态监控
            </span>
            <div className="text-sm font-normal text-gray-500">
              {MOCK_INSTALLER_STATUS.filter(s => s.status === 'online').length}人在线
            </div>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {MOCK_INSTALLER_STATUS.map(installer => (
              <div key={installer.id} className={`border rounded-lg p-3 text-sm hover:shadow-md transition-shadow ${installer.status === 'online' ? 'bg-green-50 border-green-100' : installer.status === 'busy' ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900">{installer.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${installer.status === 'online' ? 'bg-green-100 text-green-700' : installer.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {installer.status === 'online' ? '在线' : installer.status === 'busy' ? '忙碌' : '离线'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 bg-white/70 p-2 rounded">
                  <div className="text-center">
                    <div className="text-gray-400 scale-90">当前订单</div>
                    <div className="font-medium text-gray-700">{installer.currentOrders}</div>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-gray-400 scale-90">区域</div>
                    <div className="font-medium text-gray-700 truncate max-w-[80px]">{installer.area}</div>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-gray-400 scale-90">品类</div>
                    <div className="font-medium text-gray-700">{installer.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 4. Reassign Order Dialog */}
      <PaperDialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>确认重新派单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            您确定要将订单 {selectedOrder?.installNo} 重新派单吗？订单将回到安装中-待分配状态。
          </PaperDialogDescription>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">重新派单理由</label>
            <textarea
              className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="请输入重新派单的理由"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
            ></textarea>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmReassignOrder}
            disabled={!reassignReason.trim()}
          >
            确认重新派单
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 5. Reallocate Order Dialog */}
      <PaperDialog open={isReallocateDialogOpen} onOpenChange={setIsReallocateDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>重新分配安装师</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为订单 {selectedOrder?.installNo} 选择新的安装师并填写重新分配理由。
          </PaperDialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择安装师</label>
              <select
                className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedInstaller}
                onChange={(e) => setSelectedInstaller(e.target.value)}
              >
                <option value="">请选择安装师</option>
                {MOCK_INSTALLER_STATUS.map(installer => (
                  <option key={installer.id} value={installer.name}>
                    {installer.name} ({installer.status === 'online' ? '在线' : installer.status === 'busy' ? '忙碌' : '离线'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">重新分配理由</label>
              <textarea
                className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="请输入重新分配的理由"
                value={reallocateReason}
                onChange={(e) => setReallocateReason(e.target.value)}
              ></textarea>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setIsReallocateDialogOpen(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={confirmReallocateOrder}
            disabled={!selectedInstaller || !reallocateReason.trim()}
          >
            确认重新分配
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 6. Remark Edit Modal */}
      <PaperDialog open={isRemarkModalOpen} onOpenChange={setIsRemarkModalOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>编辑备注</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为订单 {selectedOrderForRemark?.installNo} 编辑备注内容。
          </PaperDialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注内容</label>
              <PaperInput
                type="textarea"
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                placeholder="请输入备注内容..."
                className="w-full h-32 text-sm"
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
    </div>
  )
}
