'use server';

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { QuoteConfigService, RoomGroup } from '@/services/quote-config.service';
import { AuditService } from '@/shared/services/audit-service';
import { db } from '@/shared/api/db';
import { z } from 'zod';


const roomGroupSchema = z.object({
    label: z.string().min(1, '分组名称必填'),
    items: z.array(z.string()),
    hasCustom: z.boolean().optional(),
});

const roomGroupsSchema = z.array(roomGroupSchema);

/**
 * 获取当前租户的空间分组配置
 * @returns 空间分组配置数组
 */
export async function getRoomGroups(): Promise<RoomGroup[]> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权：请先登录');
    }

    return QuoteConfigService.getRoomGroups(session.user.tenantId);
}

/**
 * 更新当前租户的空间分组配置
 * @param groups 新的空间分组配置
 */
export async function updateRoomGroups(groups: RoomGroup[]): Promise<void> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权：请先登录');
    }

    // 权限校验：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    // 输入校验
    const validated = roomGroupsSchema.safeParse(groups);
    if (!validated.success) {
        throw new Error('输入数据格式错误：' + validated.error.message);
    }

    // 获取旧配置以记录审计日志
    const oldGroups = await QuoteConfigService.getRoomGroups(session.user.tenantId);

    await QuoteConfigService.updateRoomGroups(session.user.tenantId, validated.data);

    // 记录审计日志
    // 记录审计日志
    await AuditService.log(db, {
        tableName: 'tenants',
        recordId: session.user.tenantId,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: { roomGroups: oldGroups },
        newValues: { roomGroups: validated.data },
        changedFields: { roomGroups: validated.data }
    });

}
