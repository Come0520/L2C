import { db } from '../api/db';
import type { DB, DbTransaction } from '../api/db';
import { auditLogs } from '../api/schema/audit';
import { InferInsertModel } from 'drizzle-orm';

export type CreateAuditLogParams = InferInsertModel<typeof auditLogs>;

export class AuditService {
  /**
   * 记录审计日志（主方法）
   * @param dbOrTx - 数据库连接或事务对象
   * @param params - 审计日志参数
   */
  static async log(
    dbOrTx: DB | DbTransaction,
    params: {
      tableName: string;
      recordId: string;
      action: string;
      userId?: string;
      tenantId?: string;
      changedFields?: Record<string, unknown>;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      details?: Record<string, unknown>;
      traceId?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ) {
    try {
      // __PLATFORM__ 不是合法 UUID，跳过审计日志写入
      if (params.tenantId === '__PLATFORM__') return;
      let tenantId = params.tenantId;
      let traceId = params.traceId;
      let userAgent = params.userAgent;
      let ipAddress = params.ipAddress;

      // 从 HTTP 请求头中提取元数据（在 Next.js 请求上下文中自动补全）
      if (!tenantId || !traceId || !userAgent || !ipAddress) {
        try {
          const { headers } = await import('next/headers');
          const headerList = await headers();
          if (!tenantId) tenantId = headerList.get('x-tenant-id') || undefined;
          if (!traceId) traceId = headerList.get('x-trace-id') || undefined;
          if (!userAgent) userAgent = headerList.get('user-agent') || undefined;
          if (!ipAddress) ipAddress = headerList.get('x-forwarded-for') || undefined;
        } catch {
          // 非请求上下文（如后台任务），忽略此错误
        }
      }

      await dbOrTx.insert(auditLogs).values({
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
   * @param paramsList - 审计日志参数列表
   */
  static async logBatch(paramsList: CreateAuditLogParams[]) {
    if (paramsList.length === 0) return;
    try {
      await db.insert(auditLogs).values(paramsList);
    } catch (error) {
      console.error('Failed to write batch audit logs:', error);
    }
  }

  /**
   * 向后兼容方法：直接传参形式记录审计日志
   * 对应旧版 @/shared/lib/audit-service 的 AuditService.record()
   * 内部委托给 log()，无需修改调用方逻辑，仅需更新 import 路径
   *
   * @param params - 审计日志参数
   * @param tx - 可选事务对象
   */
  static async record(
    params: {
      tenantId: string;
      userId?: string;
      tableName: string;
      recordId: string;
      action: string;
      changedFields?: Record<string, unknown>;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
    tx?: DB | DbTransaction
  ): Promise<void> {
    const runner = tx ?? db;
    await AuditService.log(runner, params);
  }

  /**
   * 向后兼容方法：从 Session 中便捷记录审计日志
   * 对应旧版 @/shared/lib/audit-service 的 AuditService.recordFromSession()
   * 内部委托给 log()，无需修改调用方逻辑，仅需更新 import 路径
   *
   * @param session - 用户 Session 对象
   * @param tableName - 被操作的数据表名
   * @param recordId - 被操作的记录 ID
   * @param action - 操作类型（CREATE / UPDATE / DELETE 等）
   * @param diff - 变更前后的数据对比
   * @param tx - 可选事务对象
   */
  static async recordFromSession(
    session: { user?: { tenantId?: string; id?: string } } | null,
    tableName: string,
    recordId: string,
    action: string,
    diff?: {
      old?: Record<string, unknown>;
      new?: Record<string, unknown>;
      changed?: Record<string, unknown>;
    },
    tx?: DB | DbTransaction
  ): Promise<void> {
    if (!session?.user?.tenantId) return;
    const runner = tx ?? db;
    await AuditService.log(runner, {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      tableName,
      recordId,
      action,
      oldValues: diff?.old,
      newValues: diff?.new,
      changedFields: diff?.changed,
    });
  }
}

/**
 * 向后兼容：独立函数形式的审计日志
 * 对应旧版 @/shared/lib/audit-service 的 logAuditEvent()
 * 内部委托给 AuditService.log()，仅需更新 import 路径
 *
 * @param txOrDb - 事务或数据库连接
 * @param params - 审计日志参数
 */
export async function logAuditEvent(
  txOrDb: DB | DbTransaction,
  params: {
    tenantId: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    tableName?: string;
    details?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }
): Promise<void> {
  await AuditService.log(txOrDb, {
    tenantId: params.tenantId,
    userId: params.userId,
    tableName: params.tableName ?? params.resourceType ?? 'unknown',
    recordId: params.resourceId ?? 'unknown',
    action: params.action,
    newValues: params.details ?? params.newValues,
    oldValues: params.oldValues,
  });
}
