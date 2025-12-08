'use client'

import Image from 'next/image'
import React, { useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { ORDER_STATUS } from '@/constants/order-status'
import { useSalesOrders } from '@/hooks/useSalesOrders'
import { BaseOrder, UploadedFile } from '@/shared/types/order'
import { logger } from '@/utils/logger'

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

// 扩展BaseOrder，添加测量待分配订单特定的字段
interface MeasuringPendingAssignmentOrder extends BaseOrder {
  homeSurveyFiles: UploadedFile[] // HOME测量单文件
  auditStatus: 'pending' | 'approved' | 'rejected' // 审核状态
  category: string // 商品类别
  preferredTime: string // 预约时间
  creator: string // 开单人 (远程销售/驻店销售)
  remark?: string // 备注
  createDate: string // 创建日期
}

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

export function MeasuringPendingAssignmentView() {
  // Data fetching
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [searchTerm, setSearchTerm] = useState('')
  const { data: rawResponse, batchUpdateStatus, isBatchUpdating, refetch } = useSalesOrders(
    page,
    pageSize,
    ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT,
    searchTerm
  )
  // 使用类型断言确保orders是正确的类型
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = rawResponse as any
  const orders = (response?.data?.orders || []) as MeasuringPendingAssignmentOrder[]
  const total = response?.data?.total || 0

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Old state (kept for compatibility or future refactoring)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

  // Preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [currentPreviewFile, setCurrentPreviewFile] = useState<UploadedFile | null>(null)

  // Filters for surveyors
  const [surveyorCityFilter, setSurveyorCityFilter] = useState('all')
  const [surveyorCategoryFilter, setSurveyorCategoryFilter] = useState('all')

  // Handle bulk operations
  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return
    if (!confirm(`确定要批量更新 ${selectedIds.length} 个订单的状态吗？`)) return

    try {
      await batchUpdateStatus({ ids: selectedIds, status: newStatus })
      toast.success('批量更新成功')
      setSelectedIds([])
      refetch()
    } catch (error) {
      logger.error('Batch update failed')
      console.error(error)
      toast.error('批量更新失败')
    }
  }

  // Handle preview
  const handlePreview = (file: UploadedFile) => {
    setCurrentPreviewFile(file)
    setIsPreviewModalOpen(true)
  }

  // Helper to get surveyors based on category
  const getSurveyors = (category: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const surveyors = (MOCK_SURVEYORS as any)[category] || []
    if (surveyorCityFilter !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return surveyors.filter((s: any) => s.area === surveyorCityFilter)
    }
    return surveyors
  }

  // Get available surveyors based on current selection
  const getAvailableSurveyors = () => {
    if (surveyorCategoryFilter !== 'all') {
      return getSurveyors(surveyorCategoryFilter)
    }
    // Return all if no category selected
    return Object.values(MOCK_SURVEYORS).flat()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-paper-ink">测量待分配</h2>
          <p className="text-paper-ink-300">管理待分配测量的订单，指派测量师</p>
        </div>
        <div className="flex gap-2">
          <PaperButton 
            variant="outline" 
            onClick={() => handleBatchStatusUpdate(ORDER_STATUS.MEASURING_ASSIGNING)}
            disabled={selectedIds.length === 0 || isBatchUpdating}
          >
            批量分配
          </PaperButton>
          <PaperButton 
            variant="primary"
            onClick={() => refetch()}
          >
            刷新列表
          </PaperButton>
        </div>
      </div>

      <PaperCard>
        <PaperCardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <PaperInput 
              placeholder="搜索客户姓名/电话/单号..." 
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Add more filters here if needed */}
          </div>
        </PaperCardHeader>
        <PaperCardContent>
          <PaperTable>
            <PaperTableHeader>
              <PaperTableRow>
                <PaperTableCell className="w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(orders.map(o => o.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                  />
                </PaperTableCell>
                <PaperTableCell>订单号</PaperTableCell>
                <PaperTableCell>客户信息</PaperTableCell>
                <PaperTableCell>品类</PaperTableCell>
                <PaperTableCell>预约时间</PaperTableCell>
                <PaperTableCell>测量文件</PaperTableCell>
                <PaperTableCell>审核状态</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableRow>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={8} className="text-center py-8 text-paper-ink-300">
                    暂无待分配订单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                orders.map((order) => (
                  <PaperTableRow key={order.id}>
                    <PaperTableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, order.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== order.id))
                          }
                        }}
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="font-medium">{order.salesNo}</div>
                      <div className="text-xs text-paper-ink-300">{new Date(order.createDate).toLocaleDateString()}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div>{order.customerName}</div>
                      <div className="text-xs text-paper-ink-300">{order.projectAddress}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperBadge variant="outline">{order.category || '窗帘'}</PaperBadge>
                    </PaperTableCell>
                    <PaperTableCell>
                      {order.preferredTime || '待预约'}
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex gap-2">
                        {order.homeSurveyFiles?.map((file, idx) => (
                          <div 
                            key={idx} 
                            className="w-8 h-8 relative rounded overflow-hidden cursor-pointer border border-paper-border hover:border-paper-primary"
                            onClick={() => handlePreview(file)}
                          >
                            <Image 
                              src={file.url} 
                              alt="survey" 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {(!order.homeSurveyFiles || order.homeSurveyFiles.length === 0) && (
                          <span className="text-xs text-paper-ink-300">无文件</span>
                        )}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperBadge 
                        variant={
                          order.auditStatus === 'approved' ? 'success' : 
                          order.auditStatus === 'rejected' ? 'error' : 'warning'
                        }
                      >
                        {order.auditStatus === 'approved' ? '已通过' : 
                         order.auditStatus === 'rejected' ? '已驳回' : '待审核'}
                      </PaperBadge>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex gap-2">
                        <PaperButton 
                          size="sm" 
                          onClick={() => {
                            setIsAuditModalOpen(true)
                          }}
                        >
                          审核
                        </PaperButton>
                        <PaperButton 
                          size="sm" 
                          variant="outline"
                          disabled={order.auditStatus !== 'approved'}
                          onClick={() => {
                            setIsAssignModalOpen(true)
                          }}
                        >
                          分配
                        </PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
          
          <div className="mt-4">
            <PaperTablePagination 
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPage}
              totalItems={total}
              itemsPerPage={pageSize}
            />
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* Audit Modal (Simplified) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-md">
            <PaperCardHeader>
              <PaperCardTitle>审核测量单</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <p>确认审核通过该测量单？通过后可分配测量师。</p>
              <div className="flex justify-end gap-2 mt-4">
                <PaperButton variant="ghost" onClick={() => setIsAuditModalOpen(false)}>取消</PaperButton>
                <PaperButton variant="error" onClick={() => setIsAuditModalOpen(false)}>驳回</PaperButton>
                <PaperButton variant="success" onClick={() => setIsAuditModalOpen(false)}>通过</PaperButton>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
      )}

      {/* Assign Modal (Simplified) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-lg">
            <PaperCardHeader>
              <PaperCardTitle>分配测量师</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select 
                    className="border p-2 rounded"
                    value={surveyorCategoryFilter}
                    onChange={(e) => setSurveyorCategoryFilter(e.target.value)}
                  >
                    {ALL_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <select 
                    className="border p-2 rounded"
                    value={surveyorCityFilter}
                    onChange={(e) => setSurveyorCityFilter(e.target.value)}
                  >
                    <option value="all">全部区域</option>
                    {ALL_AREAS.map(area => (
                      <option key={area as string} value={area as string}>{area as string}</option>
                    ))}
                  </select>
                </div>

                <div className="border rounded max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-paper-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">姓名</th>
                        <th className="p-2 text-left">区域</th>
                        <th className="p-2 text-left">接单率</th>
                        <th className="p-2 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAvailableSurveyors().map((surveyor: any) => (
                        <tr key={surveyor.id} className="border-t hover:bg-paper-50">
                          <td className="p-2">{surveyor.name}</td>
                          <td className="p-2">{surveyor.area}</td>
                          <td className="p-2">{surveyor.accept}</td>
                          <td className="p-2">
                            <PaperButton size="sm" onClick={() => {
                              toast.success(`已分配给 ${surveyor.name}`)
                              setIsAssignModalOpen(false)
                            }}>分配</PaperButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <PaperButton variant="ghost" onClick={() => setIsAssignModalOpen(false)}>取消</PaperButton>
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
      )}

      {/* Image Preview Modal */}
      {isPreviewModalOpen && currentPreviewFile && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full p-4">
            <Image 
              src={currentPreviewFile.url} 
              alt="preview" 
              fill 
              className="object-contain"
            />
            <button 
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
