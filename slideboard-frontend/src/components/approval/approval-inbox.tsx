'use client'

import { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { approvalClientService } from '@/services/approval.client'

export function ApprovalInbox() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInbox()
    }, [])

    const loadInbox = async () => {
        try {
            setLoading(true)
            const { data } = await approvalClientService.getInbox()
            setRequests(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        try {
            await approvalClientService.action(requestId, action)
            toast.success(`Request ${action}d`)
            loadInbox()
        } catch (_) {
            toast.error('Action failed')
        }
    }

    if (loading) return <div>Loading inbox...</div>

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>Approval Inbox</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <PaperTable>
                    <PaperTableHeader>
                        <PaperTableCell>Flow</PaperTableCell>
                        <PaperTableCell>Requester</PaperTableCell>
                        <PaperTableCell>Entity</PaperTableCell>
                        <PaperTableCell>Status</PaperTableCell>
                        <PaperTableCell>Actions</PaperTableCell>
                    </PaperTableHeader>
                    <PaperTableBody>
                        {requests.map((req) => (
                            <PaperTableRow key={req.id}>
                                <PaperTableCell>{req.flow?.name}</PaperTableCell>
                                <PaperTableCell>{req.requester?.name}</PaperTableCell>
                                <PaperTableCell>{req.entity_type} / {req.entity_id}</PaperTableCell>
                                <PaperTableCell>{req.status}</PaperTableCell>
                                <PaperTableCell>
                                    <div className="flex space-x-2">
                                        <PaperButton size="sm" onClick={() => handleAction(req.id, 'approve')}>Approve</PaperButton>
                                        <PaperButton size="sm" variant="outline" onClick={() => handleAction(req.id, 'reject')}>Reject</PaperButton>
                                    </div>
                                </PaperTableCell>
                            </PaperTableRow>
                        ))}
                    </PaperTableBody>
                </PaperTable>
            </PaperCardContent>
        </PaperCard>
    )
}
