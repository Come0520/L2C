import { db } from '../api/db';
import type { DB, Transaction } from '../api/db';
import { auditLogs } from '../api/schema/audit';
import { InferInsertModel } from 'drizzle-orm';

export type CreateAuditLogParams = InferInsertModel<typeof auditLogs>;

export class AuditService {
    /**
     * 记录审计日志
     * @param params 审计日志参数
     */
    static async log(
        db: DB | Transaction,
        params: {
            tableName: string;
            recordId: string;
            action: 'CREATE' | 'UPDATE' | 'DELETE';
            userId?: string;
            tenantId?: string; // Optional in params, will fetch if missing
            changedFields?: Record<string, any>;
            oldValues?: Record<string, any>;
            newValues?: Record<string, any>;
        }
    ) {
        try {
            let tenantId = params.tenantId;

            // If tenantId is not passed, try to get it from headers (Server Actions context)
            if (!tenantId) {
                const { headers } = await import('next/headers');
                const headerList = await headers(); // Await the headers() call
                tenantId = headerList.get('x-tenant-id') || undefined;
            }

            if (!tenantId) {
                console.warn('Audit log missing tenantId for', params.tableName, params.recordId);
                // Depending on strictness, we might want to throw or just log a warning.
                // For now, allow it but it might fail RLS if configured strictly or default to something.
                // However, our schema enforces tenant_id NOT NULL. 
                // We should probably throw if we can't find it, or let the DB error out.
            }

            await db.insert(auditLogs).values({
                tableName: params.tableName,
                recordId: params.recordId,
                action: params.action,
                userId: params.userId ? params.userId : undefined,
                tenantId: tenantId!, // Assert non-null if we are confident, or let DB throw
                changedFields: params.changedFields,
                oldValues: params.oldValues,
                newValues: params.newValues,
            });
        } catch (error) {
            console.error('Audit log failed:', error);
        }
    }

    /**
     * 批量记录审计日志
     * @param paramsList 审计日志参数列表
     */
    static async logBatch(paramsList: CreateAuditLogParams[]) {
        if (paramsList.length === 0) return;
        try {
            await db.insert(auditLogs).values(paramsList);
        } catch (error) {
            console.error('Failed to write batch audit logs:', error);
        }
    }
}
