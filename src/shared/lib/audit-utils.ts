/**
 * 审计工具函数
 * 用于记录操作日志和追踪变更
 */

/**
 * 审计日志参数类型
 */
interface AuditLogParams {
    tenantId: string;
    operatorId: string;
    module: string;
    action: string;
    entityId: string;
    details?: Record<string, unknown>;
}

/**
 * 记录审计日志
 * @param params - 审计日志参数
 */
export async function logAudit(params: AuditLogParams) {
    console.log('Audit log simulated:', params);
    return { success: true };
}

/**
 * 变更记录类型
 */
interface ChangeRecord {
    old: unknown;
    new: unknown;
}

/**
 * 追踪对象变更
 * @param oldValues - 旧值对象
 * @param newValues - 新值对象
 * @returns 变更记录
 */
export function trackChanges(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
): Record<string, ChangeRecord> {
    const changes: Record<string, ChangeRecord> = {};
    for (const key in newValues) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
            changes[key] = { old: oldValues[key], new: newValues[key] };
        }
    }
    return changes;
}
