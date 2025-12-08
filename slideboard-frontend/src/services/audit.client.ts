import { AuditLogEntry } from '@/lib/audit'

export const auditClientService = {
    async log(entry: Omit<AuditLogEntry, 'userId' | 'ipAddress'>) {
        const response = await fetch('/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        })
        if (!response.ok) throw new Error('Failed to log audit')
        return response.json()
    },

    async getLogs(params: { entityType?: string; userId?: string; limit?: number; offset?: number }) {
        const searchParams = new URLSearchParams()
        if (params.entityType) searchParams.set('entityType', params.entityType)
        if (params.userId) searchParams.set('userId', params.userId)
        if (params.limit) searchParams.set('limit', params.limit.toString())
        if (params.offset) searchParams.set('offset', params.offset.toString())

        const response = await fetch(`/api/audit/list?${searchParams.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch logs')
        return response.json()
    }
}
