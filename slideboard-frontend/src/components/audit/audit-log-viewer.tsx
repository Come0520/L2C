'use client'

import { useState, useEffect, useCallback } from 'react'

import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { auditClientService } from '@/services/audit.client'

interface AuditLogViewerProps {
    entityType?: string
    userId?: string
}

export function AuditLogViewer({ entityType, userId }: AuditLogViewerProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true)
            const { data } = await auditClientService.getLogs({ entityType, userId })
            setLogs(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [entityType, userId])

    useEffect(() => {
        loadLogs()
    }, [loadLogs])

    if (loading) return <div>Loading logs...</div>

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>Audit Logs</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <PaperTable>
                    <PaperTableHeader>
                        <PaperTableCell>Time</PaperTableCell>
                        <PaperTableCell>User</PaperTableCell>
                        <PaperTableCell>Action</PaperTableCell>
                        <PaperTableCell>Entity</PaperTableCell>
                        <PaperTableCell>Details</PaperTableCell>
                    </PaperTableHeader>
                    <PaperTableBody>
                        {logs.map((log) => (
                            <PaperTableRow key={log.id}>
                                <PaperTableCell>{new Date(log.created_at).toLocaleString()}</PaperTableCell>
                                <PaperTableCell>{log.user?.name || 'Unknown'}</PaperTableCell>
                                <PaperTableCell>{log.action}</PaperTableCell>
                                <PaperTableCell>{log.entity_type} / {log.entity_id}</PaperTableCell>
                                <PaperTableCell>
                                    <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(log.details, null, 2)}</pre>
                                </PaperTableCell>
                            </PaperTableRow>
                        ))}
                    </PaperTableBody>
                </PaperTable>
            </PaperCardContent>
        </PaperCard>
    )
}
