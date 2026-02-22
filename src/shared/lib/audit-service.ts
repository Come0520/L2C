import { db, type Transaction } from '@/shared/api/db';
import { auditLogs } from '@/shared/api/schema';

/**
 * 审计日志服务
 * 用于记录系统关键操作变更
 */
export class AuditService {
    /**
     * 记录操作日志
     */
    /**
     * 记录操作日志
     */
    static async record(params: {
        tenantId: string;
        userId?: string;
        tableName: string;
        recordId: string;
        action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | string;
        changedFields?: Record<string, unknown>;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
    }, tx?: Transaction) { // 使用可选的 tx 参数
        try {
            const runner = tx || db;
            await runner.insert(auditLogs).values({
                tenantId: params.tenantId,
                userId: params.userId,
                tableName: params.tableName,
                recordId: params.recordId,
                action: params.action,
                changedFields: params.changedFields,
                oldValues: params.oldValues,
                newValues: params.newValues,
            });
        } catch (error) {
            console.error('AuditService.record failed:', error);
            // 审计日志失败不应阻断主业务流程，仅作为警告
        }
    }

    /**
     * 从 Session 中便捷记录
     */
    static async recordFromSession(
        session: { user?: { tenantId?: string; id?: string } } | null,
        tableName: string,
        recordId: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        diff?: {
            old?: Record<string, unknown>;
            new?: Record<string, unknown>;
            changed?: Record<string, unknown>;
        },
        tx?: Transaction
    ) {
        if (!session?.user?.tenantId) return;

        await this.record({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            tableName,
            recordId,
            action,
            oldValues: diff?.old,
            newValues: diff?.new,
            changedFields: diff?.changed,
        }, tx);
    }
}
