'use server';

/**
 * 款式模板管理 Server Actions
 * 仅 SUPER_ADMIN 可操作，供平台管理后台使用
 */

import { db } from '@/shared/api/db';
import { aiCurtainStyleTemplates } from '@/shared/api/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { z } from 'zod';

// ==================== 输入验证 ====================

const templateSchema = z.object({
  name: z.string().min(1, '款式名称不能为空').max(50),
  category: z.enum(['track', 'roman_pole', 'roman_blind', 'roller', 'venetian']),
  promptFragment: z.string().min(1, 'AI Prompt 片段不能为空'),
  thumbnailUrl: z.string().url().optional().nullable(),
  referenceImageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.number().int().min(0).max(1).default(1),
});

// ==================== 权限检查 ====================

/** 验证是否为 SUPER_ADMIN */
async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: 仅超级管理员可操作');
  }
  return session;
}

// ==================== 查询（公开，管理页使用） ====================

/**
 * 获取所有款式模板列表（按 sortOrder 排序）
 * 平台管理页使用，包含禁用的款式
 */
export async function getAllTemplates() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  return db.query.aiCurtainStyleTemplates.findMany({
    orderBy: [asc(aiCurtainStyleTemplates.sortOrder)],
  });
}

// ==================== 增删改 ====================

/**
 * 创建新款式模板
 * @param input 款式信息
 */
export async function createTemplate(input: z.infer<typeof templateSchema>) {
  const session = await requireSuperAdmin();
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  return db.insert(aiCurtainStyleTemplates).values({
    ...parsed.data,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  });
}

/**
 * 更新款式模板
 * @param id 模板 ID
 * @param input 更新内容（部分字段）
 */
export async function updateTemplate(id: string, input: Partial<z.infer<typeof templateSchema>>) {
  const session = await requireSuperAdmin();

  await db
    .update(aiCurtainStyleTemplates)
    .set({
      ...input,
      updatedBy: session.user.id,
    })
    .where(eq(aiCurtainStyleTemplates.id, id));

  revalidatePath('/platform/ai-templates');
}

/**
 * 切换款式启用/禁用状态
 * @param id 模板 ID
 * @param isActive 1=启用，0=禁用
 */
export async function toggleTemplateStatus(id: string, isActive: 0 | 1) {
  await requireSuperAdmin();

  await db
    .update(aiCurtainStyleTemplates)
    .set({ isActive })
    .where(eq(aiCurtainStyleTemplates.id, id));

  revalidatePath('/platform/ai-templates');
}

/**
 * 删除款式模板
 * @param id 模板 ID
 */
export async function deleteTemplate(id: string) {
  await requireSuperAdmin();

  await db.delete(aiCurtainStyleTemplates).where(eq(aiCurtainStyleTemplates.id, id));
  revalidatePath('/platform/ai-templates');
}
