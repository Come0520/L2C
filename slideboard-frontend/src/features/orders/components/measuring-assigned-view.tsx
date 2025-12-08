'use client'

import React, { useState, useEffect } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { measurementService } from '@/services/measurements.client'

// Mock data types
interface AssignedOrder {
  id: string
  salesNo: string
  surveyNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  assignedSurveyor: string
  assignedAt: string
  assignmentDuration: number // minutes
  surveyorStatus: 'pending_response' | 'viewed' | 'accepted' | 'rejected'
  surveyorResponseTime?: number // minutes
  rejectReason?: string
  lastCommunication?: string
  lastCommunicationTime?: string
  creator: string
}



// Mock surveyor tracking data
const MOCK_SURVEYOR_TRACKING = [
  { id: '1', name: '吴师傅', status: 'online', lastActive: '2分钟前', pendingCount: 1, avgResponse: '8分钟', acceptRate: '95%', rating: 4.8 },
  { id: '2', name: '张师傅', status: 'busy', lastActive: '15分钟前', pendingCount: 1, avgResponse: '12分钟', acceptRate: '88%', rating: 4.7 },
  { id: '3', name: '李师傅', status: 'offline', lastActive: '1小时前', pendingCount: 0, avgResponse: '15分钟', acceptRate: '92%', rating: 4.9 },
]

export function MeasuringAssignedView() {
  const [orders, setOrders] = useState<AssignedOrder[]>([])
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AssignedOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从后端获取测量中-分配中的订单
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await measurementService.getMeasurements(1, 10, ORDER_STATUS.MEASURING_ASSIGNING)
        if (data && data.measurements) {
          // ... (rest of the code is same as before, just updating the status constant)
          const formattedOrders = data.measurements.map((measurement) => ({
            id: measurement.id,
            salesNo: measurement.quoteNo || '',
            surveyNo: measurement.id || '',
            customerName: measurement.customerName || '',
            customerPhone: '',
            address: measurement.projectAddress || '',
            category: '窗帘',
            assignedSurveyor: measurement.surveyorName || '',
            assignedAt: measurement.createdAt ? new Date(measurement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            assignmentDuration: measurement.createdAt ? Math.floor((Date.now() - new Date(measurement.createdAt).getTime()) / (1000 * 60)) : 0,
            surveyorStatus: 'pending_response' as const,
            creator: measurement.createdBy || '',
            lastCommunication: '已发送接单提醒短信'
          }))
          setOrders(formattedOrders)
        }
      } catch {
        // ...
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Helper functions for status colors and text
  const getSurveyorStatusBadge = (status: AssignedOrder['surveyorStatus']) => {
    switch (status) {
      case 'pending_response':
        return <PaperBadge className="bg-blue-50 text-blue-700 border-blue-200">待响应</PaperBadge>
      case 'viewed':
        return <PaperBadge className="bg-orange-50 text-orange-700 border-orange-200">已查看</PaperBadge>
      case 'accepted':
        return <PaperBadge className="bg-green-50 text-green-700 border-green-200">已接单</PaperBadge>
      case 'rejected':
        return <PaperBadge className="bg-red-50 text-red-700 border-red-200">已拒单</PaperBadge>
      default:
        return null
    }
  }

  const getDurationColor = (minutes: number) => {
    if (minutes <= 60) return 'text-green-600'
    if (minutes <= 120) return 'text-orange-600'
    if (minutes <= 180) return 'text-red-600'
    return 'text-red-800 font-bold'
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
  }

  // 重新派单处理
  const handleReassign = async () => {
    if (!selectedOrder) return

    try {
      // 调用后端API重新派单
      const updatedMeasurement = await measurementService.updateMeasurement(selectedOrder.id, {
        status: ORDER_STATUS.MEASURING_ASSIGNING
      })

      if (updatedMeasurement && updatedMeasurement.id) {
        // 从列表中移除该订单
        setOrders(prev => prev.filter(order => order.id !== selectedOrder.id))
        toast.success('重新派单成功')
      } else {
        toast.error('重新派单失败')
      }
    } catch {
      // 错误处理
      toast.error('重新派单失败，请重试')
    } finally {
      setReassignModalOpen(false)
    }
  }





  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area (Top) - Simplified for this view */}
      <div className="grid grid-cols-4 gap-4">
        <PaperCard className="bg-blue-50 border-blue-100">
          <PaperCardContent className="p-4">
            <div className="text-sm text-blue-600">分配中订单</div>
            <div className="text-2xl font-bold text-blue-700">{orders.length}</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard className="bg-green-50 border-green-100">
          <PaperCardContent className="p-4">
            <div className="text-sm text-green-600">正常 (1h内)</div>
            <div className="text-2xl font-bold text-green-700">
              {orders.filter(o => o.assignmentDuration <= 60).length}
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard className="bg-orange-50 border-orange-100">
          <PaperCardContent className="p-4">
            <div className="text-sm text-orange-600">关注 (1-2h)</div>
            <div className="text-2xl font-bold text-orange-700">
              {orders.filter(o => o.assignmentDuration > 60 && o.assignmentDuration <= 120).length}
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard className="bg-red-50 border-red-100">
          <PaperCardContent className="p-4">
            <div className="text-sm text-red-600">超时 (&gt;2h)</div>
            <div className="text-2xl font-bold text-red-700">
              {orders.filter(o => o.assignmentDuration > 120).length}
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 2. Order List Area */}
      <PaperCard className="border-blue-200 shadow-sm ring-1 ring-blue-100 flex-1">
        <div className="p-4 border-b border-blue-100 bg-blue-50/30 flex justify-between items-center">
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
              <PaperTableCell>沟通状态</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {isLoading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center py-8">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center py-8">
                    暂无数据
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map(order => (
                  <PaperTableRow key={order.id}>
                    <PaperTableCell>
                      <div className="font-mono text-xs text-gray-900">{order.salesNo}</div>
                      <div className="font-mono text-xs text-gray-500">{order.surveyNo}</div>
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
                      <div className="font-medium">{order.assignedSurveyor}</div>
                      <div className="text-xs text-gray-500">{order.assignedAt}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      {getSurveyorStatusBadge(order.surveyorStatus)}
                      {order.surveyorStatus === 'rejected' && (
                        <div className="text-xs text-red-500 mt-1 max-w-[120px] truncate" title={order.rejectReason}>
                          原因: {order.rejectReason}
                        </div>
                      )}
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className={`text-sm font-medium ${getDurationColor(order.assignmentDuration)}`}>
                        {formatDuration(order.assignmentDuration)}
                      </div>
                      {order.assignmentDuration > 180 && <span className="text-xs text-red-600 font-bold">⚠️ 已超时</span>}
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="text-xs text-gray-600 max-w-[150px] truncate" title={order.lastCommunication}>
                        {order.lastCommunication || '-'}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-col gap-2">
                        {order.surveyorStatus === 'rejected' ? (
                            <PaperButton
                            size="small"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => { setSelectedOrder(order); setReassignModalOpen(true) }}
                          >
                            拒单处理
                          </PaperButton>
                        ) : (
                          <PaperButton
                            size="small"
                            variant="outline"
                            onClick={() => { setSelectedOrder(order); setReassignModalOpen(true) }}
                          >
                            重新派单
                          </PaperButton>
                        )}
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
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

      {/* 3. Surveyor Tracking Panel */}
      <PaperCard className="border-indigo-200 shadow-sm ring-1 ring-indigo-100">
        <PaperCardHeader className="pb-4 border-b border-indigo-100 bg-indigo-50/30">
          <PaperCardTitle className="text-base flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
              测量师实时状态监控
            </span>
            <PaperButton variant="ghost" size="small" className="h-8 text-indigo-600 hover:bg-indigo-50">刷新</PaperButton>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_SURVEYOR_TRACKING.map(surveyor => (
              <div key={surveyor.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{surveyor.name}</span>
                    <span className={`w-2 h-2 rounded-full ${surveyor.status === 'online' ? 'bg-green-500' : surveyor.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                    <span className="text-xs text-gray-500">{surveyor.status === 'online' ? '在线' : surveyor.status === 'busy' ? '忙碌' : '离线'}</span>
                  </div>
                  <div className="text-xs text-gray-400">活跃: {surveyor.lastActive}</div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>待接单:</span>
                    <span className="font-medium text-blue-600">{surveyor.pendingCount}单</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平均响应:</span>
                    <span className="font-medium">{surveyor.avgResponse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>接单率:</span>
                    <span className="font-medium text-green-600">{surveyor.acceptRate}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <PaperButton size="small" variant="outline" className="flex-1 text-xs h-8">发提醒</PaperButton>
                  <PaperButton size="small" variant="outline" className="flex-1 text-xs h-8">详情</PaperButton>
                </div>
              </div>
            ))}
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* Reassign Modal */}
      {reassignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[500px]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">重新派单</h3>
              <button onClick={() => setReassignModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <div><span className="text-gray-500">订单:</span> {selectedOrder.salesNo}</div>
                <div><span className="text-gray-500">当前测量师:</span> {selectedOrder.assignedSurveyor}</div>
                {selectedOrder.rejectReason && (
                  <div className="text-red-600"><span className="text-gray-500">拒单原因:</span> {selectedOrder.rejectReason}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">重新派单原因</label>
                <div className="space-y-2">
                  {['测量师长时间未响应', '测量师拒单', '客户要求更换', '其他原因'].map(reason => (
                    <label key={reason} className="flex items-center space-x-2">
                      <input type="radio" name="reassignReason" className="text-blue-600" />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">备注说明</label>
                <textarea className="w-full border rounded p-2 h-20 text-sm" placeholder="请输入详细说明..."></textarea>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <PaperButton variant="outline" onClick={() => setReassignModalOpen(false)}>取消</PaperButton>
              <PaperButton variant="primary" onClick={handleReassign}>确认重新派单</PaperButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
