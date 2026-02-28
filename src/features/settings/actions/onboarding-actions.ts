'use server';

/**
 * 新租户初始化引导 Server Actions（模版选择制）
 *
 * 流程：选规模 → 选模版 → 创建角色 → 去邀请
 * 模版定义在 onboarding-templates.ts 中，此文件只包含 async 函数。
 */

import { db } from '@/shared/api/db';
import { tenants, tenantProfiles } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';
import {
  getTemplatesForSize as getTemplates,
  findTemplateById,
  type ProfileTemplate,
  type TeamSizeValue,
} from '@/features/settings/lib/onboarding-templates';

/**
 * 根据规模获取适用的模版列表
 */
export async function getTemplatesForSize(sizeValue: TeamSizeValue) {
  return getTemplates(sizeValue);
}

/**
 * 获取当前租户的 onboarding 状态
 */
export async function getOnboardingStatus(): Promise<{
  status: string;
  needsOnboarding: boolean;
}> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { status: 'unknown', needsOnboarding: false };
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId),
      columns: { onboardingStatus: true, status: true },
    });

    if (!tenant) {
      return { status: 'unknown', needsOnboarding: false };
    }

    const needsOnboarding =
      tenant.status === 'active' &&
      tenant.onboardingStatus === 'pending' &&
      session.user.role === 'BOSS';

    return {
      status: tenant.onboardingStatus || 'pending',
      needsOnboarding,
    };
  } catch (error) {
    logger.error('获取 onboarding 状态失败:', error);
    return { status: 'unknown', needsOnboarding: false };
  }
}

/**
 * 提交模版选择并应用配置
 */
export async function applyTemplate(
  templateId: ProfileTemplate,
  teamSize: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
      return { success: false, error: '未登录或无租户信息' };
    }

    const template = findTemplateById(templateId);
    if (!template) {
      return { success: false, error: '无效的模版选择' };
    }

    const sessionTenantId = session.user.tenantId;
    const sessionUserId = session.user.id;

    await db.transaction(async (tx) => {
      await tx.insert(tenantProfiles).values({
        tenantId: sessionTenantId,
        submittedBy: sessionUserId,
        questionnaireRaw: { teamSize, templateId },
        recommendedTemplate: templateId,
        appliedTemplate: templateId,
        teamSize,
        collaborationMode: null,
        salesStructure: null,
        hasDedicatedFinance: false,
        hasDedicatedDispatch: false,
        hasDedicatedProcurement: false,
      } as typeof tenantProfiles.$inferInsert);

      await tx
        .update(tenants)
        .set({ onboardingStatus: 'completed', updatedAt: new Date() })
        .where(eq(tenants.id, sessionTenantId));
    });

    logger.info('新租户选择模版成功', {
      tenantId: session.user.tenantId,
      template: templateId,
    });

    return { success: true };
  } catch (error) {
    logger.error('应用模版失败:', error);
    return { success: false, error: '提交失败，请稍后重试' };
  }
}

/**
 * 跳过初始化引导
 */
export async function skipOnboarding(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    await db
      .update(tenants)
      .set({ onboardingStatus: 'skipped', updatedAt: new Date() })
      .where(eq(tenants.id, session.user.tenantId));

    logger.info('租户跳过初始化引导', { tenantId: session.user.tenantId });
    return { success: true };
  } catch (error) {
    logger.error('跳过引导失败:', error);
    return { success: false, error: '操作失败' };
  }
}
