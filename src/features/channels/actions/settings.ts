'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm'
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
import type { AttributionModel } from './schema';


/**
 * 渠道归因设置相关 Server Actions
 */

/** 归因设置类型（本地使用） */
interface AttributionSettings {
    attributionModel: AttributionModel;
}

/**
 * 获取归因设置
 */
export async function getAttributionSettings(): Promise<AttributionSettings> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { attributionModel: 'LAST_TOUCH' };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as Record<string, unknown>;
    const model = settings?.channelAttributionModel as AttributionModel;

    return {
        attributionModel: model || 'LAST_TOUCH'
    };
}

/**
 * 更新归因设置
 */
export async function updateAttributionSettingsAction(
    data: AttributionSettings
): Promise<{ success: boolean; error?: string; data?: { success: boolean } }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录' };
        }

        // 权限检查：需要设置管理权限
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

        // 验证输入
        if (!['FIRST_TOUCH', 'LAST_TOUCH'].includes(data.attributionModel)) {
            return { success: false, error: '无效的归因模型' };
        }


        // 获取当前设置
        const currentTenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
            columns: { settings: true }
        });

        const currentSettings = (currentTenant?.settings as Record<string, unknown>) || {};
        const model = currentSettings?.channelAttributionModel as AttributionModel; // Reuse for diff check

        // 合并新设置
        const newSettings = {
            ...currentSettings,
            channelAttributionModel: data.attributionModel
        };

        // 更新数据库
        await db.update(tenants)
            .set({ settings: newSettings, updatedAt: new Date() })
            .where(eq(tenants.id, session.user.tenantId));

        // P1 Fix: Audit Log
        if (data.attributionModel !== model) {
            await AuditService.log(db, {
                tableName: 'tenants',
                recordId: session.user.tenantId,
                action: 'UPDATE',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                newValues: { channelAttributionModel: data.attributionModel },
                oldValues: { channelAttributionModel: model },
                details: { reason: 'Update attribution settings' }
            });
        }

        return { success: true, data: { success: true } };
    } catch (error) {
        logger.error('更新归因设置失败:', { error });
        return { success: false, error: '更新失败' };
    }
}
