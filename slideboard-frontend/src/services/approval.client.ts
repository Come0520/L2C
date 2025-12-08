import { CreateApprovalRequestParams } from '@/lib/approval'

export const approvalClientService = {
    async createRequest(params: CreateApprovalRequestParams) {
        const response = await fetch('/api/approvals/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })
        if (!response.ok) throw new Error('Failed to create request')
        return response.json()
    },

    async getInbox() {
        const response = await fetch('/api/approvals/inbox')
        if (!response.ok) throw new Error('Failed to fetch inbox')
        return response.json()
    },

    async action(requestId: string, action: 'approve' | 'reject', comment?: string) {
        const response = await fetch(`/api/approvals/${requestId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment })
        })
        if (!response.ok) throw new Error('Failed to perform action')
        return response.json()
    },

    async getFlows() {
        const response = await fetch('/api/approvals/flows')
        if (!response.ok) throw new Error('Failed to fetch flows')
        return response.json()
    }
}
