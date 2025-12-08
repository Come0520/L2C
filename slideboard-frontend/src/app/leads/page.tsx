'use client'

import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { BatchActionBar } from '@/components/ui/batch-action-bar'
import { toast } from '@/components/ui/toast'
import { AppointmentReminders } from '@/features/leads/components/dashboard/appointment-reminders'
import { LeadStatsCards } from '@/features/leads/components/dashboard/lead-stats-cards'
import { LeadDedupeDialog } from '@/features/leads/components/dedupe/lead-dedupe-dialog'
import { LeadImportDialog } from '@/features/leads/components/import/lead-import-dialog'
import { LeadFilters } from '@/features/leads/components/list/lead-filters'
import { LeadTable } from '@/features/leads/components/list/lead-table'
import { mockLeads } from '@/features/leads/utils/mock-data'
import { useLeads } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'
import { batchService } from '@/services/batch.client'
import { leadService } from '@/services/leads.client'
import { notificationService } from '@/services/notifications'
import { LeadItem } from '@/shared/types/lead'
import type { Notification } from '@/shared/types/notification'

// import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
// import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav'
// import { PaperButton } from '@/components/ui/paper-button'
// import type { LeadImportRow } from '@/services/leads.client'
// import type { LeadDuplicateRecord } from '@/types/lead'

// 动态导入重型组件
const AppointmentCalendar = dynamic(() => import('@/features/leads/components/appointment-calendar'))
const LeadDialogs = dynamic(() => import('@/features/leads/components/list/lead-dialogs').then(mod => ({ default: mod.LeadDialogs })))
const LeadDetailDrawer = dynamic(() => import('@/features/leads/components/detail/lead-detail-drawer').then(mod => ({ default: mod.LeadDetailDrawer })))
const CreateLeadDialog = dynamic(() => import('@/features/leads/components/create-lead-dialog'))
const ReassignModal = dynamic(() => import('@/components/ui/reassign-modal').then(mod => ({ default: mod.ReassignModal })))

type LeadTag = LeadItem['businessTags'][number]

// type LeadImportPreviewRow = LeadImportRow & { referrer_name?: string }

export default function LeadsPage() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [tag, setTag] = useState<LeadTag | ''>('')
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  const [owner, setOwner] = useState('')
  const [designer, setDesigner] = useState('')
  const [shoppingGuide, setShoppingGuide] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // 对话框状态
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [confirmTrackingDialogOpen, setConfirmTrackingDialogOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [currentLead, setCurrentLead] = useState<LeadItem | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createLeadDialogOpen, setCreateLeadDialogOpen] = useState(false)
  const [dedupeDialogOpen, setDedupeDialogOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // const [importPreview, setImportPreview] = useState<LeadImportPreviewRow[]>([])
  // const [importing, setImporting] = useState(false)
  // const [importSummary, setImportSummary] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  // 当前用户角色（模拟）
  const currentUserRole = 'sales_manager'
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  // 集成 Supabase 数据钩子
  const { data: serverData, isLoading, error, refetch } = useLeads(currentPage, itemsPerPage, {
    searchTerm,
    status,
    businessTags: tag ? [tag] : [], // 转换单个标签为数组
    customerLevel: level,
    source,
    owner,
    dateRange: { start: dateStart, end: dateEnd }
  })



  // 本地过滤逻辑 (用于 Mock 数据回退)
  const mockFiltered = mockLeads.filter((l) => {
    const matchSearch = l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.leadNumber.includes(searchTerm) ||
      l.requirements.join('，').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = status ? l.status === status : true
    const matchTag = tag ? l.businessTags.includes(tag) : true
    const matchLevel = level ? l.customerLevel === level : true
    const matchSource = source ? l.source.includes(source) : true
    const matchOwner = owner ? l.currentOwner.name.includes(owner) : true
    const matchDesigner = designer ? l.designer?.name?.includes(designer) : true
    const matchShoppingGuide = shoppingGuide ? l.shoppingGuide?.name?.includes(shoppingGuide) : true
    return matchSearch && matchStatus && matchTag && matchLevel && matchSource && matchOwner && matchDesigner && matchShoppingGuide
  })

  // 决定使用哪份数据 (如果有服务器数据则使用，否则使用本地 Mock)
  const useServerData = !!serverData && !error

  // 修复 filtered 变量缺失问题
  // 注意：使用服务端数据时，filtered 仅包含当前页数据，因为是分页获取的
  const filtered = useServerData ? serverData.data : mockFiltered

  const totalItems = useServerData ? serverData.total : mockFiltered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const pageData = useServerData
    ? serverData.data
    : mockFiltered.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)

  // 预加载下一页数据
  useEffect(() => {
    if (useServerData && currentPage < totalPages) {
      // 预加载下一页数据
      queryClient.prefetchQuery({
        queryKey: ['leads', currentPage + 1, itemsPerPage, searchTerm, status, tag, level, source, owner, designer, shoppingGuide, dateStart, dateEnd],
        queryFn: () => leadService.getLeads(
          currentPage + 1,
          itemsPerPage,
          {
            searchTerm,
            status,
            businessTags: tag ? [tag] : [],
            customerLevel: level,
            source,
            owner,
            dateRange: { start: dateStart, end: dateEnd }
          }
        )
      })
    }
  }, [queryClient, useServerData, currentPage, totalPages, itemsPerPage, searchTerm, status, tag, level, source, owner, designer, shoppingGuide, dateStart, dateEnd])

  // 移除了未使用的用户加载逻辑

  // 处理操作按钮点击
  const handleAction = async (action: string, lead: LeadItem) => {
    setCurrentLead(lead)

    // 操作确认对话框
    const showConfirm = (message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (window.confirm(message)) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    }

    // 操作结果通知
    const showNotification = (message: string, isSuccess: boolean) => {
      if (isSuccess) {
        toast.success(`成功: ${message}`)
      } else {
        toast.error(`失败: ${message}`)
      }
    }

    switch (action) {
      case 'followUp':
      case 'add_followup':
        setFollowUpDialogOpen(true)
        break
      case 'assign':
        setAssignmentDialogOpen(true)
        break
      case 'confirmTracking':
      case 'confirm_track':
        setConfirmTrackingDialogOpen(true)
        break
      case 'appointment':
        setFollowUpDialogOpen(true)
        break
      case 'view':
        setDetailDrawerOpen(true)
        break
      case 'confirm_plan':
        // 处理方案确认
        // 状态流转前验证
        if (!lead.quoteDetails?.versions?.length) {
          showNotification('请先创建设计方案', false)
          return
        }

        if (await showConfirm('确定要确认该设计方案吗？')) {
          try {
            await leadService.updateLeadStatus(lead.id, 'PENDING_PUSH')
            await queryClient.invalidateQueries({ queryKey: ['leads'] })
            showNotification('方案确认成功', true)
          } catch (_) {
            showNotification(`方案确认失败: ${(error as Error).message}`, false)
          }
        }
        break
      case 'reject_plan':
        // 处理方案驳回
        // 状态流转前验证 - 要求填写驳回原因
        const rejectReason = prompt('请输入驳回原因:')
        if (!rejectReason) {
          showNotification('请填写驳回原因', false)
          return
        }

        if (await showConfirm(`确定要驳回该设计方案吗？\n驳回原因: ${rejectReason}`)) {
          try {
            await leadService.updateLeadStatus(lead.id, 'MEASURING_PENDING_CONFIRMATION')
            await queryClient.invalidateQueries({ queryKey: ['leads'] })
            showNotification('方案驳回成功', true)
          } catch (_) {
            showNotification(`方案驳回失败: ${(error as Error).message}`, false)
          }
        }
        break
      case 'update_plan':
        // 处理方案更新
        setDetailDrawerOpen(true)
        break
      case 'copyLink':
        try {
          const origin = window.location.origin
          const link = `${origin}/leads/${lead.id}`
          await navigator.clipboard.writeText(link)
          toast.success('链接已复制到剪贴板')
        } catch (_) {
          toast.error('复制链接失败')
        }
        break
      default:
        void action
    }
  }

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case 'create':
        setCreateLeadDialogOpen(true)
        break
      case 'import':
        setImportDialogOpen(true)
        break
      case 'dedupe':
        setDedupeDialogOpen(true)
        // ; (async () => {
        //   const groups = await leadService.findDuplicateGroups()
        //   setDuplicateGroups(groups)
        // })()
        break
      case 'batch_assign':
        setIsReassignOpen(true)
        break
      case 'export_csv':
      case 'export_excel':
      case 'export_pdf':
        (async () => {
          try {
            const ids = pageData.map(l => l.id)
            const format = action.replace('export_', '') as 'csv' | 'excel' | 'pdf'
            const { blob, filename } = await batchService.exportData('leads', ids, format)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(`已导出当前页线索为${format.toUpperCase()}格式`)
          } catch (_e) {
            toast.error('导出失败')
          }
        })()
        break
      default:
        void action
    }
  }

  const closeImportDialog = () => {
    setImportDialogOpen(false)
  }



  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">线索管理</h1>
            <p className="text-ink-500 mt-1">支持列表与看板视图、详情抽屉与转化分析</p>
          </div>
          <div>
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={async () => {
                setNotificationsOpen(true)
                const list = await notificationService.getNotifications()
                setNotifications(list as Notification[])
              }}>通知中心</button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="p-6">
            <nav className="flex space-x-4 border-b border-gray-200">
              <Link href="/leads" className={cn("px-3 py-2 text-sm font-medium border-b-2", pathname === '/leads' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}>列表视图</Link>
              <Link href="/leads/kanban" className={cn("px-3 py-2 text-sm font-medium border-b-2", pathname === '/leads/kanban' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}>看板视图</Link>
              <Link href="/leads/analytics" className={cn("px-3 py-2 text-sm font-medium border-b-2", pathname === '/leads/analytics' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300")}>转化分析</Link>
            </nav>
          </div>
        </div>

        {/* 预约日历区域 */}
        <AppointmentCalendar />

        {/* 统计卡片区域 */}
        <LeadStatsCards useServerData={useServerData} filteredLeads={mockFiltered} />

        {/* 预约提醒区域 */}
        <AppointmentReminders leads={filtered} onFollowUp={(lead) => handleAction('followUp', lead)} />

        {/* 筛选卡片 */}
        <LeadFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          status={status} setStatus={setStatus}
          tag={tag} setTag={setTag}
          level={level} setLevel={setLevel}
          source={source} setSource={setSource}
          owner={owner} setOwner={setOwner}
          designer={designer} setDesigner={setDesigner}
          shoppingGuide={shoppingGuide} setShoppingGuide={setShoppingGuide}
          dateStart={dateStart} setDateStart={setDateStart}
          dateEnd={dateEnd} setDateEnd={setDateEnd}
        />

        {/* 线索列表 */}
        <LeadTable
          leads={pageData}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onAction={handleAction}
          isLoading={isLoading}
          currentUserRole={currentUserRole}
          onToolbarAction={handleToolbarAction}
          selectedIds={selectedLeads}
          onSelectionChange={setSelectedLeads}
        />
        <BatchActionBar
          selectedCount={selectedLeads.length}
          actions={[
            {
              id: 'export',
              label: '导出所选',
              variant: 'outline',
              onClick: async () => {
                try {
                  const { blob, filename } = await batchService.exportData('leads', selectedLeads, 'csv')
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = filename
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  toast.success('导出成功')
                  setSelectedLeads([])
                } catch {
                  toast.error('导出失败')
                }
              }
            },
            {
              id: 'batch_assign',
              label: '批量分配',
              variant: 'primary',
              onClick: () => setIsReassignOpen(true)
            },
          ]}
          onClearSelection={() => setSelectedLeads([])}
        />
      </div>

      {/* 对话框集合 */}
      <LeadDialogs
        currentLead={currentLead}
        followUpDialogOpen={followUpDialogOpen}
        setFollowUpDialogOpen={setFollowUpDialogOpen}
        assignmentDialogOpen={assignmentDialogOpen}
        setAssignmentDialogOpen={setAssignmentDialogOpen}
        confirmTrackingDialogOpen={confirmTrackingDialogOpen}
        setConfirmTrackingDialogOpen={setConfirmTrackingDialogOpen}
      />

      {isReassignOpen && (
        <ReassignModal
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          items={pageData}
          users={[]}
          itemType="线索"
          title="批量分配线索"
          getDisplayName={(item) => {
            const leadItem = item as LeadItem;
            return `${leadItem.customerName} · ${leadItem.leadNumber}`;
          }}
          onReassign={async (itemIds, userId) => {
            for (const id of itemIds) {
              try {
                await fetch('/api/assignment/reassign', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ resourceType: 'lead', resourceId: id, assigneeId: userId })
                })
              } catch (_) {
                void id
              }
            }
            toast.success('批量分配已完成')
          }}
        />
      )}

      <LeadImportDialog isOpen={importDialogOpen} onClose={closeImportDialog} />

      <LeadDedupeDialog isOpen={dedupeDialogOpen} onClose={() => setDedupeDialogOpen(false)} />

      {/* 详情抽屉 */}
      <LeadDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        lead={currentLead}
      />

      {notificationsOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-end z-50">
          <div className="bg-white rounded-l-lg p-6 w-full max-w-md h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">通知中心</div>
              <button onClick={() => setNotificationsOpen(false)} className="text-ink-500">✕</button>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 && (
                <div className="text-ink-500">暂无通知</div>
              )}
              {notifications.map(n => (
                <div key={n.id} className="border border-paper-300 rounded p-3">
                  <div className="flex justify-between">
                    <div className="font-medium">{n.title || '系统消息'}</div>
                    <div className="text-ink-500 text-sm">{new Date(n.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="text-ink-600 text-sm mt-1">{n.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateLeadDialog
        isOpen={createLeadDialogOpen}
        onClose={() => setCreateLeadDialogOpen(false)}
        onSuccess={() => {
          refetch()
        }}
      />
    </DashboardLayout>
  )
}
