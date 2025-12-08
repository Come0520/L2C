
export interface BatchOperationResult {
    successCount: number;
    failureCount: number;
    errors: { id: string; error: string }[];
}

export const batchService = {
    /**
     * Bulk update status for leads
     */
    async bulkUpdateLeadsStatus(leadIds: string[], status: string): Promise<BatchOperationResult> {
        const res = await fetch('/api/batch/leads/status', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ids: leadIds, status }),
        })
        if (!res.ok) {
            const errText = await res.text()
            return { successCount: 0, failureCount: leadIds.length, errors: leadIds.map((id) => ({ id, error: errText })) }
        }
        return await res.json()
    },

    /**
     * Bulk update status for orders
     */
    async bulkUpdateOrdersStatus(orderIds: string[], status: string): Promise<BatchOperationResult> {
        const res = await fetch('/api/batch/orders/status', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ids: orderIds, status }),
        })
        if (!res.ok) {
            const errText = await res.text()
            return { successCount: 0, failureCount: orderIds.length, errors: orderIds.map((id) => ({ id, error: errText })) }
        }
        return await res.json()
    },

    /**
     * Export data to CSV
     * This returns the raw CSV string. Frontend should handle the download.
     */
    async exportData(resource: 'leads' | 'orders' | 'sales_orders', ids?: string[], format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<{ blob: Blob; filename: string }> {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const url = new URL('/api/batch/export', origin)
        url.searchParams.set('resource', resource)
        url.searchParams.set('format', format)
        if (ids && ids.length > 0) url.searchParams.set('ids', ids.join(','))
        const res = await fetch(url.toString(), { method: 'GET' })
        if (!res.ok) throw new Error('Failed to export data')
        
        const blob = await res.blob()
        const contentDisposition = res.headers.get('content-disposition')
        let filename = `${resource}_export_${Date.now()}.${format}`
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="([^"]+)"/)
            if (match && match[1]) {
                filename = match[1]
            }
        }
        
        return { blob, filename }
    }
};
