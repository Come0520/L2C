import { db } from '@/shared/api/db';
import { financeAuditLogs } from '@/shared/api/schema';

type AuditAction = 'CREATE' | 'UPDATE' | 'POST' | 'REVERSE' | 'CLOSE_PERIOD' | 'IMPORT';

interface AuditLogParams {
    tenantId: string;
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
}

/**
 * 写入财务审计日志（所有财务写操作均需调用）
 */
export async function writeFinanceAuditLog(params: AuditLogParams): Promise<void> {
    await db.insert(financeAuditLogs).values({
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.before ? JSON.stringify(params.before) : null,
        afterData: params.after ? JSON.stringify(params.after) : null,
        ipAddress: params.ipAddress ?? null,
    });
}
