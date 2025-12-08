import React from 'react'

import AssignmentDialog from '@/features/leads/components/assignment-dialog'
import ConfirmTrackingDialog from '@/features/leads/components/confirm-tracking-dialog'
import FollowUpDialog from '@/features/leads/components/follow-up-dialog'
import { leadService } from '@/services/leads.client'
import { LeadItem } from '@/types/lead'
import { FollowUpRecord } from '@/types/lead'

interface LeadDialogsProps {
    currentLead: LeadItem | null
    followUpDialogOpen: boolean
    setFollowUpDialogOpen: (open: boolean) => void
    assignmentDialogOpen: boolean
    setAssignmentDialogOpen: (open: boolean) => void
    confirmTrackingDialogOpen: boolean
    setConfirmTrackingDialogOpen: (open: boolean) => void
    onSaveFollowUp?: (record: Omit<FollowUpRecord, 'id' | 'createdAt' | 'createdBy'>) => void
}

export function LeadDialogs({
    currentLead,
    followUpDialogOpen,
    setFollowUpDialogOpen,
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    confirmTrackingDialogOpen,
    setConfirmTrackingDialogOpen,
    onSaveFollowUp
}: LeadDialogsProps) {
    if (!currentLead) return null

    return (
        <>
            {/* 跟进对话框 */}
            <FollowUpDialog
                isOpen={followUpDialogOpen}
                onClose={() => setFollowUpDialogOpen(false)}
                lead={{
                    id: currentLead.id,
                    customerName: currentLead.customerName,
                    phone: currentLead.phone,
                    requirements: currentLead.requirements,
                    leadNumber: currentLead.leadNumber,
                    projectAddress: currentLead.projectAddress,
                    customerLevel: currentLead.customerLevel,
                    status: currentLead.status,
                    source: currentLead.source,
                    createdAt: currentLead.createdAt,
                    lastFollowUpAt: currentLead.lastFollowUpAt
                }}
                onSave={(record) => {
                    if (onSaveFollowUp) {
                        onSaveFollowUp(record)
                    }
                    setFollowUpDialogOpen(false)
                }}
            />

            {/* 分配对话框 */}
            <AssignmentDialog
                isOpen={assignmentDialogOpen}
                onClose={() => setAssignmentDialogOpen(false)}
                lead={{
                    id: currentLead.id,
                    customerName: currentLead.customerName,
                    phone: currentLead.phone,
                    requirements: currentLead.requirements,
                    budgetMin: currentLead.budgetMin,
                    budgetMax: currentLead.budgetMax
                }}
                onAssign={async (data) => {
                    // 分配线索
                    await leadService.assignLead(data.leadId, data.assigneeId, data.reason)
                    // 分配后自动将状态设置为待跟踪
                    await leadService.updateLeadStatus(data.leadId, 'PENDING_FOLLOW_UP')
                    setAssignmentDialogOpen(false)
                }}
            />

            {/* 确认并跟踪对话框 */}
            <ConfirmTrackingDialog
                isOpen={confirmTrackingDialogOpen}
                onClose={() => setConfirmTrackingDialogOpen(false)}
                lead={{
                    id: currentLead.id,
                    customerName: currentLead.customerName,
                    phone: currentLead.phone,
                    requirements: currentLead.requirements,
                    budgetMin: currentLead.budgetMin,
                    budgetMax: currentLead.budgetMax
                }}
                onConfirm={() => setConfirmTrackingDialogOpen(false)}
            />
        </>
    )
}
