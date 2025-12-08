export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data: Record<string, any> | null;
    new_data: Record<string, any> | null;
    changed_by: string | null;
    changed_at: string;
    request_context: Record<string, any> | null;
}

export interface AuditLogQueryParams {
    recordId?: string;
    tableName?: string;
    limit?: number;
    offset?: number;
}
