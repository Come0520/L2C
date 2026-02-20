'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { DEFAULT_QUOTE_MODE_CONFIG, type QuoteModeConfig } from '../lib/quote-mode-constants';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';


// 注意：use server 文件只能导出 async 函数
// 常量和类型需要直接从 quote-mode-constants.ts 导入



const quoteModeConfigSchema = z.object({
    defaultMode: z.enum(['QUICK', 'ADVANCED']),
    quickModeFields: z.array(z.string()),
    defaultValues: z.object({
        installPosition: z.string(),
        groundClearance: z.number(),
        foldRatio: z.number(),
    }),
});

/**
 * 获取租户的快速报价字段配置
 */
export async function getQuoteModeConfig(): Promise<{ data?: QuoteModeConfig; error?: string }> {
    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) {
            return { error: '未找到租户信息' };
        }

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { settings: true },
        });

        if (!tenant) {
            return { error: '租户不存在' };
        }

        // 从租户设置中获取配置，如果没有则使用系统默认
        const settings = tenant.settings as Record<string, unknown> | null;
        const quoteModeConfig = settings?.quoteModeConfig as QuoteModeConfig | undefined;

        return { data: quoteModeConfig ?? DEFAULT_QUOTE_MODE_CONFIG };
    } catch (error) {
        logger.error('[getQuoteModeConfig] Error:', error);
        return { error: '获取配置失败' };
    }
}

/**
 * 保存租户的快速报价字段配置
 */
export async function saveQuoteModeConfig(
    config: QuoteModeConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) {
            return { success: false, error: '未找到租户信息' };
        }

        // 输入校验
        const validated = quoteModeConfigSchema.safeParse(config);
        if (!validated.success) {
            return { success: false, error: '输入数据格式错误：' + validated.error.message };
        }

        // 权限校验：需要设置管理权限
        try {
            await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        } catch {
            return { success: false, error: '无权限执行此操作' };
        }

        const data = validated.data;

        await db.transaction(async (tx) => {
            // 获取当前租户设置
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { settings: true },
            });

            if (!tenant) {
                throw new Error('租户不存在');
            }

            // 合并现有设置和新配置
            const currentSettings = (tenant.settings as Record<string, unknown>) ?? {};
            const oldConfig = currentSettings.quoteModeConfig;
            const newSettings = {
                ...currentSettings,
                quoteModeConfig: data,
            };

            // 更新租户设置
            await tx
                .update(tenants)
                .set({ settings: newSettings })
                .where(eq(tenants.id, tenantId));

            // 记录审计日志
            await AuditService.log(tx, {
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                oldValues: { quoteModeConfig: oldConfig },
                newValues: { quoteModeConfig: data },
                changedFields: { quoteModeConfig: data }
            });
        });

        return { success: true };

    } catch (error) {
        logger.error('[saveQuoteModeConfig] Error:', error);
        return { success: false, error: '保存配置失败' };
    }
}
