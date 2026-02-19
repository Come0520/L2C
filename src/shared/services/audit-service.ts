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
            action: string;
            userId?: string;
            tenantId?: string; // Optional in params, will fetch if missing
            changedFields?: Record<string, any>;
            oldValues?: Record<string, any>;
            newValues?: Record<string, any>;
            details?: Record<string, any>;
            traceId?: string;
            userAgent?: string;
            ipAddress?: string;
        }
    ) {
        try {
            let tenantId = params.tenantId;
            let traceId = params.traceId;
            let userAgent = params.userAgent;
            let ipAddress = params.ipAddress;

            // Header metadata extraction
            if (!tenantId || !traceId || !userAgent || !ipAddress) {
                try {
                    const { headers } = await import('next/headers');
                    const headerList = await headers();
                    if (!tenantId) tenantId = headerList.get('x-tenant-id') || undefined;
                    if (!traceId) traceId = headerList.get('x-trace-id') || undefined;
                    if (!userAgent) userAgent = headerList.get('user-agent') || undefined;
                    if (!ipAddress) ipAddress = headerList.get('x-forwarded-for') || undefined;
                } catch {
                    // Not in a request context (e.g. background job)
                }
            }

            await db.insert(auditLogs).values({
                tableName: params.tableName,
                recordId: params.recordId,
                action: params.action,
                userId: params.userId || undefined,
                tenantId: tenantId!,
                changedFields: params.changedFields,
                oldValues: params.oldValues,
                newValues: params.newValues,
                details: params.details,
                traceId,
                userAgent,
                ipAddress,
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
