'use server';

/**
 * 师傅管理模块 - Admin 后台
 *
 * 安全措施：
 * - Zod 校验：id=UUID、phone=手机号正则、name≤50字、avatarUrl=URL格式
 * - 分页防护：pageSize 上限 100，search 长度上限 100
 * - 敏感字段排除：getWorkerById 不返回 passwordHash
 * - 自禁保护：管理员不能禁用自己
 * - 多租户隔离：所有查询带 tenantId
 * - 审计日志：AuditService.log 含 oldValues/newValues
 */

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { createSafeAction } from '@/shared/lib/server-action';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Session } from 'next-auth';

// ========== 常量 ==========

/** 分页最大每页条数 */
const MAX_PAGE_SIZE = 100;

/** 搜索关键词最大长度 */
const MAX_SEARCH_LENGTH = 100;

// ========== Zod Schema（严格校验） ==========

/**
 * 分页参数校验
 * - page: 正整数
 * - pageSize: 1~100 之间（防 DoS）
 * - search: 可选，最长 100 字符，自动 trim
 */
const getWorkersParamsSchema = z.object({
    page: z.number().int().min(1, '页码必须 ≥ 1'),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE, `每页最多 ${MAX_PAGE_SIZE} 条`),
    search: z.string().trim().max(MAX_SEARCH_LENGTH, `搜索关键词最长 ${MAX_SEARCH_LENGTH} 字符`).optional(),
});

/**
 * 更新师傅参数校验（严格模式）
 * - id: 必须 UUID 格式（防路径注入）
 * - name: 最长 50 字符
 * - phone: 手机号正则
 * - avatarUrl: 合法 URL 或空
 */
const updateWorkerSchema = z.object({
    id: z.string().uuid('无效的用户 ID 格式'),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().url('头像必须为有效 URL').optional().or(z.literal('')),
    name: z.string().min(1, '姓名不能为空').max(50, '姓名最长 50 字符').optional(),
    phone: z.string().regex(/^1\d{10}$/, '手机号格式不正确').optional(),
});

// ========== 安全查询字段白名单 ==========

/**
 * 对外返回的安全字段（排除 passwordHash、wechatOpenId 等敏感信息）
 */
const SAFE_WORKER_COLUMNS = {
    id: true,
    name: true,
    phone: true,
    avatarUrl: true,
    isActive: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const;

// ========== 查询 Action ==========

/**
 * 获取师傅列表（分页+搜索）
 * 安全特性：分页上限防护、tenantId 隔离、敏感字段排除
 */
export async function getWorkers(
    params: { page: number; pageSize: number; search?: string },
    session: Session
) {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    // Zod 校验分页参数
    const parsed = getWorkersParamsSchema.safeParse(params);
    if (!parsed.success) {
        throw new Error(`参数校验失败: ${parsed.error.issues[0]?.message}`);
    }

    const { page, pageSize, search } = parsed.data;
    const offset = (page - 1) * pageSize;

    const conditions = [
        eq(users.tenantId, session.user.tenantId),
        eq(users.role, 'WORKER')
    ];

    if (search) {
        conditions.push(like(users.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const data = await db.query.users.findMany({
        where: whereClause,
        orderBy: [desc(users.createdAt)],
        limit: pageSize,
        offset: offset,
        columns: SAFE_WORKER_COLUMNS,
    });

    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

    return {
        data,
        total: Number(countResult?.count || 0)
    };
}

/**
 * 获取师傅详情
 * 安全特性：tenantId 双重过滤、敏感字段排除（不返回 passwordHash）
 */
export async function getWorkerById(id: string, session: Session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const worker = await db.query.users.findFirst({
        where: and(
            eq(users.id, id),
            eq(users.tenantId, session.user.tenantId)
        ),
        columns: {
            ...SAFE_WORKER_COLUMNS,
            email: true,
            permissions: true,
        },
    });

    if (!worker) throw new Error('未找到该师傅');
    return worker;
}

// ========== 写入 Action ==========

const updateWorkerActionInternal = createSafeAction(updateWorkerSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const { id, ...updates } = data;

    // 安全检查 1：自禁保护 — 不允许禁用自己的账号
    if (updates.isActive === false && id === session.user.id) {
        throw new Error('不能禁用自己的账号');
    }

    // 查询旧值用于审计日志
    const oldWorker = await db.query.users.findFirst({
        where: and(eq(users.id, id), eq(users.tenantId, session.user.tenantId)),
        columns: { name: true, phone: true, isActive: true, avatarUrl: true },
    });

    // 安全检查 2：确认目标存在且属于同一租户
    if (!oldWorker) throw new Error('未找到该师傅');

    const [updated] = await db.update(users)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(and(
            eq(users.id, id),
            eq(users.tenantId, session.user.tenantId)
        ))
        .returning();

    // 审计日志（含旧值/新值对比）
    await AuditService.log(db, {
        action: updates.isActive !== undefined
            ? (updates.isActive ? 'ENABLE_WORKER' : 'DISABLE_WORKER')
            : 'UPDATE_WORKER',
        tableName: 'users',
        recordId: id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: oldWorker as Record<string, unknown>,
        newValues: updates as Record<string, unknown>,
    });

    revalidatePath('/admin/settings/workers');
    return { success: true, data: updated };
});

export async function updateWorker(params: z.infer<typeof updateWorkerSchema>) {
    return updateWorkerActionInternal(params);
}
