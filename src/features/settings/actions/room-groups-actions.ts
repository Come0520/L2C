'use server';

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { QuoteConfigService, RoomGroup } from '@/services/quote-config.service';

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

    await QuoteConfigService.updateRoomGroups(session.user.tenantId, groups);
}
