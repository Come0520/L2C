import { createClient } from '@/lib/supabase/server'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'APPROVE' | 'REJECT' | 'SUBMIT'

export interface AuditLogEntry {
    userId: string
    action: AuditAction
    entityType: string
    entityId?: string
    details?: Record<string, any>
    ipAddress?: string
}

export const auditService = {
    /**
     * Set the current user ID for database triggers in the current transaction.
     * Use this when performing operations as a service role or when you need to explicitly set the actor.
     * Note: This must be called within the same transaction or connection session.
     * For Supabase client (REST), this requires an RPC call that sets the config.
     */
    async setContext(userId: string) {
        const supabase = await createClient()
        return supabase.rpc('set_audit_context', { p_user_id: userId })
    },

    async log(entry: AuditLogEntry) {
        const supabase = await createClient()

        try {
            const { error } = await supabase.from('audit_logs').insert({
                user_id: entry.userId,
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId,
                details: entry.details,
                ip_address: entry.ipAddress
            })

            if (error) {
                console.error('Failed to log audit entry:', error)
            }
        } catch (e) {
            console.error('Error logging audit entry:', e)
        }
    }
}
