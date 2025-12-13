'use client'

import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { BatchActionBar } from '@/components/ui/batch-action-bar'
import { toast } from '@/components/ui/toast'
import { LeadsPageHeader } from '@/features/leads/components/dashboard/LeadsPageHeader'
import { LeadAssignmentController } from '@/features/leads/components/dialogs/LeadAssignmentController'
import { LeadFollowUpController } from '@/features/leads/components/dialogs/LeadFollowUpController'
import { LeadTrackingController } from '@/features/leads/components/dialogs/LeadTrackingController'
import { LeadFilters } from '@/features/leads/components/list/LeadFilters'
import { LeadTable } from '@/features/leads/components/list/LeadTable'
import { useLeadActions } from '@/features/leads/hooks/useLeadActions'
import { useLeadsFilters } from '@/features/leads/hooks/useLeadsFilters'
import { useLeads } from '@/hooks/useLeads'
import { batchService } from '@/services/batch.client'
import { leadService } from '@/services/leads.client'
import type { Notification } from '@/shared/types/notification'

// Dynamic imports
const AppointmentCalendar = dynamic(() => import('@/features/leads/components/AppointmentCalendar'))
const LeadStatsCards = dynamic(() => import('@/features/leads/components/dashboard/LeadStatsCards').then(mod => mod.LeadStatsCards))
const AppointmentReminders = dynamic(() => import('@/features/leads/components/dashboard/AppointmentReminders').then(mod => mod.AppointmentReminders))
const LeadDetailDrawer = dynamic(() => import('@/features/leads/components/detail/LeadDetailDrawer').then(mod => ({ default: mod.LeadDetailDrawer })))
const CreateLeadDialog = dynamic(() => import('@/features/leads/components/CreateLeadDialog'))
const ReassignModal = dynamic(() => import('@/components/ui/reassign-modal').then(mod => ({ default: mod.ReassignModal })))
const LeadImportDialog = dynamic(() => import('@/features/leads/components/import/LeadImportDialog').then(mod => ({ default: mod.LeadImportDialog })))
const LeadDedupeDialog = dynamic(() => import('@/features/leads/components/dedupe/LeadDedupeDialog').then(mod => ({ default: mod.LeadDedupeDialog })))

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const { filters, updateFilters } = useLeadsFilters()
  const { currentLead, handleAction, dialogStates, selection } = useLeadActions()

  // Dialog States (Additional)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createLeadDialogOpen, setCreateLeadDialogOpen] = useState(false)
  const [dedupeDialogOpen, setDedupeDialogOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isReassignOpen, setIsReassignOpen] = useState(false)

  // Current User Role (Should come from auth context in real app)
  const currentUserRole = 'sales_manager'

  // Data Fetching
  const { data: serverData, isLoading } = useLeads(filters.page, filters.pageSize, {
    searchTerm: filters.searchTerm,
    status: filters.status,
    businessTags: filters.tag ? [filters.tag] : [],
    customerLevel: filters.level,
    source: filters.source,
    owner: filters.owner,
    dateRange: { start: filters.dateStart, end: filters.dateEnd }
  })

  // Prefetching next page
  const totalPages = serverData ? Math.ceil(serverData.total / filters.pageSize) : 0

  useEffect(() => {
    if (serverData && filters.page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['leads', filters.page + 1, filters.pageSize, filters.searchTerm, filters.status, filters.tag, filters.level, filters.source, filters.owner, filters.dateStart, filters.dateEnd],
        queryFn: () => leadService.getLeads(
          filters.page + 1,
          filters.pageSize,
          {
            searchTerm: filters.searchTerm,
            status: filters.status,
            businessTags: filters.tag ? [filters.tag] : [],
            customerLevel: filters.level,
            source: filters.source,
            owner: filters.owner,
            dateRange: { start: filters.dateStart, end: filters.dateEnd }
          }
        )
      })
    }
  }, [queryClient, serverData, totalPages, filters])

  // Realtime Subscription - 监听线索变更
  useEffect(() => {
    console.log('🔴 Setting up Realtime subscription for leads...')

    const subscription = leadService.subscribeToLeads((payload) => {
      console.log('🔴 Received Realtime event:', payload.eventType, payload)

      // 自动刷新线索列表
      queryClient.invalidateQueries({ queryKey: ['leads'] })

      // 显示通知（可选）
      if (payload.eventType === 'INSERT') {
        toast.success('新线索已添加')
      } else if (payload.eventType === 'UPDATE') {
        toast.info('线索已更新')
      } else if (payload.eventType === 'DELETE') {
        toast.warning('线索已删除')
      }
    })

    return () => {
      console.log('🔴 Cleaning up Realtime subscription')
      subscription.unsubscribe()
    }
  }, [queryClient])


  const handleToolbarAction = (action: string) => {
    switch (action) {
      case 'import':
        setImportDialogOpen(true)
        break
      case 'create':
        setCreateLeadDialogOpen(true)
        break
      case 'dedupe':
        setDedupeDialogOpen(true)
        break
      default:
        console.warn('Unknown toolbar action:', action)
    }
  }

  // Derived Data
  const pageData = serverData?.data || []
  const totalItems = serverData?.total || 0

  return (
    <div className="space-y-6 p-6">
      <LeadsPageHeader
        onNotificationsClick={(list) => {
            setNotifications(list)
            setNotificationsOpen(true)
          }}
          onNotificationsOpenChange={setNotificationsOpen}
        />

        {/* 预约日历区域 */}
        <AppointmentCalendar />

        {/* 统计卡片区域 */}
        <LeadStatsCards useServerData={!!serverData} filteredLeads={[]} />

        {/* 预约提醒区域 */}
        <AppointmentReminders leads={pageData} onFollowUp={(lead) => handleAction('followUp', lead)} />

        {/* 筛选卡片 */}
        <LeadFilters />

        {/* 线索列表 */}
        <LeadTable
          leads={pageData}
          totalItems={totalItems}
          currentPage={filters.page}
          totalPages={totalPages}
          itemsPerPage={filters.pageSize}
          onPageChange={(page) => updateFilters({ page })}
          onItemsPerPageChange={(pageSize) => updateFilters({ pageSize, page: 1 })}
          onAction={handleAction}
          isLoading={isLoading}
          currentUserRole={currentUserRole}
          onToolbarAction={handleToolbarAction}
          selectedIds={selection.selectedLeads}
          onSelectionChange={selection.setSelectedLeads}
        />

        {/* 批量操作栏 */}
        <BatchActionBar
          selectedCount={selection.selectedLeads.length}
          actions={[
            {
              id: 'export',
              label: '导出所选',
              variant: 'outline',
              onClick: async () => {
                try {
                  const { blob, filename } = await batchService.exportData('leads', selection.selectedLeads, 'csv')
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = filename
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  toast.success('导出成功')
                  selection.setSelectedLeads([])
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
            }
          ]}
          onClearSelection={() => selection.setSelectedLeads([])}
        />

        {/* Dialogs and Drawers */}
        {currentLead && (
          <>
            <LeadDetailDrawer
              leadId={currentLead.id}
              open={dialogStates.detailDrawerOpen}
              onOpenChange={dialogStates.setDetailDrawerOpen}
            />
            <LeadAssignmentController
              lead={currentLead}
              isOpen={dialogStates.assignmentDialogOpen}
              onOpenChange={dialogStates.setAssignmentDialogOpen}
            />
            <LeadFollowUpController
              lead={currentLead}
              isOpen={dialogStates.followUpDialogOpen}
              onOpenChange={dialogStates.setFollowUpDialogOpen}
            />
            <LeadTrackingController
              lead={currentLead}
              isOpen={dialogStates.confirmTrackingDialogOpen}
              onOpenChange={dialogStates.setConfirmTrackingDialogOpen}
            />
          </>
        )}

        <CreateLeadDialog
          open={createLeadDialogOpen}
          onOpenChange={setCreateLeadDialogOpen}
          onSuccess={async () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); return Promise.resolve(); }}
        />

        <LeadImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onSuccess={async () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); return Promise.resolve(); }}
        />

        <LeadDedupeDialog
          open={dedupeDialogOpen}
          onOpenChange={setDedupeDialogOpen}
        />

        <ReassignModal
          open={isReassignOpen}
          onOpenChange={setIsReassignOpen}
          onSuccess={() => {
            // Implement batch reassign logic
            setIsReassignOpen(false)
            queryClient.invalidateQueries({ queryKey: ['leads'] })
          }}
          selectedIds={selection.selectedLeads}
        />
      </div>
  )
}
