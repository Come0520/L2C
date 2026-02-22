/**
 * 渠道来源 API
 * 
 * GET /api/miniprogram/channels
 * 返回渠道层级树结构，用于新建客户/线索时选择来源
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getMiniprogramUser } from '../auth-utils';

/**
 * GET - 获取渠道树
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        // 1. 获取所有活跃渠道
        const allChannels = await db.query.channels.findMany({
            where: and(
                eq(channels.tenantId, user.tenantId),
                eq(channels.status, 'ACTIVE')
            ),
            orderBy: [asc(channels.name)],
            columns: {
                id: true,
                name: true,
                parentId: true,
                hierarchyLevel: true,
            }
        });

        // 2. 获取所有联系人
        const allContacts = await db.query.channelContacts.findMany({
            where: eq(channelContacts.tenantId, user.tenantId),
            orderBy: [asc(channelContacts.name)],
            columns: {
                id: true,
                name: true,
                channelId: true,
            }
        });

        // 3. 内存组装树结构
        const contactsMap = new Map<string, typeof allContacts>();
        allContacts.forEach(contact => {
            if (!contact.channelId) return;
            const list = contactsMap.get(contact.channelId) || [];
            list.push(contact);
            contactsMap.set(contact.channelId, list);
        });

        const level1Channels = allChannels.filter(c => !c.parentId);

        const result = level1Channels.map(parent => {
            const children = allChannels.filter(c => c.parentId === parent.id);

            const childrenWithContacts = children.map(child => ({
                id: child.id,
                name: child.name,
                level: child.hierarchyLevel,
                contacts: contactsMap.get(child.id) || []
            }));

            return {
                id: parent.id,
                name: parent.name,
                level: parent.hierarchyLevel,
                children: childrenWithContacts
            };
        });

        return apiSuccess(result);
    } catch (error) {
        logger.error('Get Channels Error:', error);
        return apiError('获取渠道失败', 500);
    }
}
