'use client'

import Image from 'next/image'
import React, { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { StatefulButton } from '@/components/ui/stateful-button'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/utils/logger'

// Mock Data Types
interface InstallationRoom {
  name: string
  status: 'completed' | 'partially_completed' | 'failed'
  issues: string[]
  remark: string
  photos: string[]
  size: string
}

interface InstallationData {
  rooms: InstallationRoom[]
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
  installNo: string
  customerName: string
  customerPhone: string
  address: string
  category: string
  installer: string
  installerPhone: string
  apptTime: string
  completedAt: string // Installation completed time
  remainingTime: number // minutes (8h countdown)
  status: 'pending_confirmation'
  data: InstallationData
  history: {
    date: string
    installer: string
    status: string
    remark?: string
  }[]
}

// Mock Data
const MOCK_ORDERS: PendingConfirmationOrder[] = [
  {
    id: '1',
    salesNo: 'XS2024010030',
    installNo: 'AZ2024010030-A',
    customerName: '周先生',
    customerPhone: '13566667777',
    address: '北京市朝阳区建国路88号SOHO现代城A座1205室',
    category: '窗帘',
    installer: '安装师A',
    installerPhone: '13900001111',
    apptTime: '2024-01-15 14:00',
    completedAt: '16:30',
    remainingTime: 210, // 3.5h left (Urgent)
    status: 'pending_confirmation',
    data: {
      completedAt: '2024-01-15 16:30',
      rooms: [
        {
          name: '厨房空间',
          status: 'completed',
          issues: [],
          remark: '安装顺利，客户满意',
          photos: Array(3).fill('/placeholder-photo.jpg'),
          size: '3.2m × 2.8m'
        },
        {
          name: '卧室空间',
          status: 'completed',
          issues: [],
          remark: '安装顺利，客户满意',
          photos: Array(3).fill('/placeholder-photo.jpg'),
          size: '4.5m × 3.6m'
        }
      ],
      photos: Array(6).fill('/placeholder-photo.jpg'),
      qualityScore: {
        integrity: 4.0,
        accuracy: 3.5,
        photos: 5.0,
        standard: 4.0,
        total: 4.1,
        level: '良好'
      }
    },
    history: [
      { date: '2024-01-14 10:30', installer: '安装师B', status: '驳回', remark: '安装位置不准确，需要重新安装' },
      { date: '2024-01-15 14:00', installer: '安装师A', status: '待确认', remark: '用时2.5小时' }
    ]
  },
  {
    id: '2',
    salesNo: 'XS2024010031',
    installNo: 'AZ2024010031-A',
    customerName: '吴女士',
    customerPhone: '13688889999',
    address: '北京市海淀区万柳书院',
    category: '墙布',
    installer: '安装师C',
    installerPhone: '13900004444',
    apptTime: '2024-01-15 10:00',
    completedAt: '11:30',
    remainingTime: 30, // 0.5h left (Critical)
    status: 'pending_confirmation',
    data: {
      completedAt: '2024-01-15 11:30',
      rooms: [
        {
          name: '客厅',
          status: 'completed',
          issues: [],
          remark: '安装顺利，客户满意',
          photos: Array(4).fill('/placeholder-photo.jpg'),
          size: '6.8m × 4.2m'
        }
      ],
      photos: Array(4).fill('/placeholder-photo.jpg'),
      qualityScore: {
        integrity: 5.0,
        accuracy: 4.8,
        photos: 4.5,
        standard: 4.8,
        total: 4.8,
        level: '优秀'
      }
    },
    history: []
  }
]

export function InstallingPendingConfirmationView() {
  const supabase = createClient()
  const [orders] = useState<PendingConfirmationOrder[]>(MOCK_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<PendingConfirmationOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [currentRoomPhotos, setCurrentRoomPhotos] = useState<string[]>([])
  const [currentRoomName, setCurrentRoomName] = useState<string>('')
  const [isLargePhotoOpen, setIsLargePhotoOpen] = useState(false)
  const [currentLargePhotoIndex, setCurrentLargePhotoIndex] = useState(0)
  const [viewedPhotos, setViewedPhotos] = useState<Set<string>>(new Set())
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false)

  // Helper functions
  const openDetail = (order: PendingConfirmationOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
    // 重置查看状态
    setViewedPhotos(new Set())
    setIsConfirmEnabled(false)
  }

  // 检查所有照片是否都已查看
  useEffect(() => {
    if (selectedOrder) {
      const allPhotos = selectedOrder.data.rooms.flatMap(room => room.photos)
      const allViewed = allPhotos.every(photo => viewedPhotos.has(photo))
      setIsConfirmEnabled(allViewed)
    }
  }, [viewedPhotos, selectedOrder])

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">正常状态 (&gt;4h)</div>
                <div className="text-3xl font-bold text-green-700 mt-1">
                  {orders.filter(o => o.remainingTime > 240).length}
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
                <div className="text-sm font-medium text-ink-500 mb-1">紧急状态 (2-4h)</div>
                <div className="text-3xl font-bold text-orange-700 mt-1">
                  {orders.filter(o => o.remainingTime > 120 && o.remainingTime <= 240).length}
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
                <div className="text-sm font-medium text-ink-500 mb-1">超期预警 (&lt;2h)</div>
                <div className="text-3xl font-bold text-red-700 mt-1">
                  {orders.filter(o => o.remainingTime <= 120).length}
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
                    <PaperInput placeholder="搜索销售单/安装单号" className="w-64 bg-white/50" />
                    <PaperInput placeholder="客户姓名/电话" className="w-48 bg-white/50" />
                    <StatefulButton variant="outline" onClick={() => console.log('查询按钮点击')} status="idle">查询</StatefulButton>
                </div>
            </PaperTableToolbar>
            <PaperCardContent className="p-0">
            <PaperTable>
                <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
                <PaperTableCell>安装单号</PaperTableCell>
                <PaperTableCell>客户信息</PaperTableCell>
                <PaperTableCell>品类</PaperTableCell>
                <PaperTableCell>安装师</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                {orders.map(order => (
                    <PaperTableRow key={order.id}>
                    <PaperTableCell>
                        <div className="font-mono text-xs text-gray-900">{order.installNo}</div>
                        <div className="font-mono text-xs text-gray-500">{order.salesNo}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                        <div className="text-sm font-medium">{order.customerName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                    </PaperTableCell>
                    <PaperTableCell>{order.category}</PaperTableCell>
                    <PaperTableCell>
                        <div className="font-medium">{order.installer}</div>
                        <div className="text-xs text-gray-500">{order.installerPhone}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                        <StatefulButton size="sm" variant="primary" onClick={() => openDetail(order)} status="idle">
                            审核
                        </StatefulButton>
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
      )}

      {/* 3. Detail/Audit View */}
      {isDetailOpen && selectedOrder && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header / Back Button */}
            <div className="flex justify-between items-center">
                <StatefulButton variant="outline" onClick={() => setIsDetailOpen(false)} status="idle">← 返回列表</StatefulButton>
                <div className="flex gap-3">
                    <StatefulButton variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsRejectModalOpen(true)} status="idle">驳回安装单</StatefulButton>
                    <StatefulButton 
                        variant="primary" 
                        onClick={async () => { 
                            if (selectedOrder) {
                              try {
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ status: ORDER_STATUS.PENDING_RECONCILIATION })
                                  .eq('id', selectedOrder.id)
                                if (error) throw error
                              } catch (err) {
                                logger.error('更新订单状态失败', { resourceType: 'order', resourceId: selectedOrder.id, details: { err } })
                                toast.error('更新状态失败')
                                return
                              }
                            }
                            toast.success('确认成功，订单已转为待对账状态'); 
                            setIsDetailOpen(false); 
                        }}
                        disabled={!isConfirmEnabled}
                        className={isConfirmEnabled ? '' : 'opacity-50 cursor-not-allowed'}
                        status="idle"
                    >
                        确认无误
                    </StatefulButton>
                </div>
            </div>

            {/* Basic Info */}
            <PaperCard>
                <PaperCardHeader className="bg-gray-50 border-b">
                    <PaperCardTitle className="text-base">安装基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                    <div className="grid grid-cols-3 gap-6 text-sm">
                        <div><span className="text-gray-500">安装单编号:</span> {selectedOrder.installNo}</div>
                        <div><span className="text-gray-500">安装师:</span> {selectedOrder.installer}</div>
                        <div><span className="text-gray-500">完成时间:</span> {selectedOrder.data.completedAt}</div>
                        <div className="col-span-3"><span className="text-gray-500">客户地址:</span> {selectedOrder.address}</div>
                        <div><span className="text-gray-500">安装品类:</span> {selectedOrder.category}</div>
                        <div><span className="text-gray-500">预约时间:</span> {selectedOrder.apptTime}</div>
                        <div><span className="text-gray-500">实际完成:</span> {selectedOrder.data.completedAt}</div>
                    </div>
                </PaperCardContent>
            </PaperCard>

            {/* Installation Data Detail */}
            <PaperCard>
                <PaperCardHeader className="bg-gray-50 border-b">
                    <PaperCardTitle className="text-base">安装数据详情</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6 space-y-6">
                    {selectedOrder.data.rooms.map((room, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50/50">
                            <h4 className="font-bold text-gray-800 mb-3">【{room.name}】</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div><span className="text-gray-500">状态:</span> 
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${room.status === 'completed' ? 'bg-green-100 text-green-700' : room.status === 'partially_completed' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {room.status === 'completed' ? '已完成' : room.status === 'partially_completed' ? '部分完成' : '未完成'}
                                    </span>
                                </div>
                                <div><span className="text-gray-500">尺寸:</span> {room.size}</div>
                                <div className="text-right">
                                    <StatefulButton 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => {
                                            setCurrentRoomName(room.name);
                                            setCurrentRoomPhotos(room.photos);
                                            setIsPhotoModalOpen(true);
                                        }}
                                        status="idle"
                                    >
                                        查看照片 ({room.photos.length}张)
                                    </StatefulButton>
                                </div>
                            </div>
                            {room.issues.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-sm font-medium text-gray-700 mb-1">问题列表:</div>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                        {room.issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
                    <StatefulButton size="sm" variant="ghost" onClick={() => console.log('展开全部点击')} status="idle">展开全部</StatefulButton>
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
                        <PaperCardTitle className="text-base">安装单审核清单</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent className="p-6">
                        <div className="space-y-3">
                            {['安装完整性', '安装准确性', '现场清理', '客户满意度', '照片完整性', '安装标准', '产品保护', '安全规范'].map((item, idx) => (
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
                            <PaperCardTitle className="text-base">安装质量评分</PaperCardTitle>
                        </PaperCardHeader>
                        <PaperCardContent className="p-6">
                             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>完整性: <span className="font-bold">{selectedOrder.data.qualityScore?.integrity}</span>/5.0</div>
                                <div>照片质量: <span className="font-bold">{selectedOrder.data.qualityScore?.photos}</span>/5.0</div>
                                <div>准确性: <span className="font-bold">{selectedOrder.data.qualityScore?.accuracy}</span>/5.0</div>
                                <div>规范性: <span className="font-bold">{selectedOrder.data.qualityScore?.standard}</span>/5.0</div>
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
                            <PaperCardTitle className="text-base">安装历史记录</PaperCardTitle>
                        </PaperCardHeader>
                        <PaperCardContent className="p-6">
                            <div className="space-y-4">
                                {selectedOrder.history.length > 0 ? selectedOrder.history.map((h, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm">
                                        <div className="w-24 text-gray-500 text-xs pt-1">{h.date}</div>
                                        <div className="flex-1 pb-4 border-l-2 border-gray-200 pl-4 relative">
                                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                                            <div className="font-medium">{h.installer} <span className={`text-xs px-1.5 py-0.5 rounded ${h.status === '驳回' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{h.status}</span></div>
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
              <h3 className="text-lg font-bold">驳回安装单</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">驳回原因 <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                        {['安装不完整', '安装不准确', '现场照片缺失', '客户不满意', '未按规范操作', '产品损坏', '其他原因'].map(reason => (
                            <label key={reason} className="flex items-center space-x-2">
                                <input type="radio" name="rejectReason" className="text-red-600" />
                                <span className="text-sm text-gray-700">{reason}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">详细说明</label>
                    <textarea className="w-full border rounded p-2 h-20 text-sm" placeholder="请详细说明驳回原因，以便安装师重新安装..."></textarea>
                </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
                <StatefulButton onClick={() => setIsRejectModalOpen(false)} status="idle" variant="outline">取消</StatefulButton>
                <StatefulButton onClick={async () => { if (selectedOrder) { try { const { error } = await supabase.from('orders').update({ status: ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT }).eq('id', selectedOrder.id); if (error) throw error } catch (err) { logger.error('更新订单状态失败', { resourceType: 'order', resourceId: selectedOrder.id, details: { err } }); toast.error('更新状态失败'); return } } toast.error('已驳回'); setIsRejectModalOpen(false); setIsDetailOpen(false); }} status="idle" variant="primary" className="bg-red-600 hover:bg-red-700 text-white">确认驳回</StatefulButton>
            </div>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">{currentRoomName} - 安装照片</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 gap-4">
                {currentRoomPhotos.map((photo, idx) => (
                  <div 
                    key={idx} 
                    className={`aspect-square bg-gray-200 rounded flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity relative cursor-pointer ${viewedPhotos.has(photo) ? 'border-2 border-blue-500' : ''}`}
                    onClick={() => {
                      setCurrentLargePhotoIndex(idx);
                      setIsLargePhotoOpen(true);
                      // 标记照片为已查看
                      setViewedPhotos(prev => new Set(prev).add(photo));
                    }}
                  >
                    <Image 
                      src={photo} 
                      alt={`${currentRoomName} 照片 ${idx + 1}`} 
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                    {viewedPhotos.has(photo) && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        已查看
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {currentRoomPhotos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  该空间暂无照片
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Large Photo Preview Modal */}
      {isLargePhotoOpen && currentRoomPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative w-[90vw] max-w-6xl max-h-[90vh]">
            {/* Close Button */}
            <button 
              onClick={() => setIsLargePhotoOpen(false)} 
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10 bg-black/50 p-2 rounded-full"
            >
              ✕
            </button>
            
            {/* Navigation Buttons */}
            {currentLargePhotoIndex > 0 && (
              <button 
                onClick={() => setCurrentLargePhotoIndex(prev => prev - 1)} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl z-10 bg-black/50 p-2 rounded-full"
              >
                ◀
              </button>
            )}
            {currentLargePhotoIndex < currentRoomPhotos.length - 1 && (
              <button 
                onClick={() => setCurrentLargePhotoIndex(prev => prev + 1)} 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl z-10 bg-black/50 p-2 rounded-full"
              >
                ▶
              </button>
            )}
            
            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-10">
              {currentLargePhotoIndex + 1} / {currentRoomPhotos.length}
            </div>
            
            {/* Photo */}
            <div className="w-full h-full flex items-center justify-center">
              <Image 
                src={currentRoomPhotos[currentLargePhotoIndex] ?? '/placeholder-photo.jpg'} 
                alt={`${currentRoomName} 照片 ${currentLargePhotoIndex + 1}`} 
                width={1200} 
                height={800}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
