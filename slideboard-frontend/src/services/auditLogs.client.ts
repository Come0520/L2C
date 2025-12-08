import { createClient } from '@/lib/supabase/client';
import { AuditLog, AuditLogQueryParams } from '@/types/auditLogs';

export const auditLogsClient = {
    /**
     * Fetch audit logs for a specific record or table.
     */
    async getAuditLogs(params: AuditLogQueryParams): Promise<AuditLog[]> {
        const supabase = createClient();
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('changed_at', { ascending: false });

        if (params.tableName) {
            query = query.eq('table_name', params.tableName);
        }

        if (params.recordId) {
            query = query.eq('record_id', params.recordId);
        }

        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching audit logs:', error);
            throw new Error(`Failed to fetch audit logs: ${error.message}`);
        }

        return (data as unknown) as AuditLog[];
    },
};
