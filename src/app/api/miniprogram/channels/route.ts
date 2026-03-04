/**
 * 渠道来源 API
 *
 * GET /api/miniprogram/channels
 * 返回渠道层级树结构（一、二级渠道 + 渠道联系人），用于新建客户/线索时选择来源渠道。
 * 渠道数据变更频率低，采用 3 分钟内存缓存提升重复查询性能。
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiServerError, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { withMiniprogramAuth } from '../auth-utils';
import { CacheService } from '@/shared/services/miniprogram/cache.service';

export const GET = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    if (!user || !user.tenantId) {
      return apiUnauthorized('未授权');
    }

    // 缓存策略：渠道树变更频率极低，适合中长期缓存
    const cacheKey = `miniprogram:channels:${user.tenantId}`;

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. 获取所有活跃渠道
        const allChannels = await db.query.channels.findMany({
          where: and(eq(channels.tenantId, user.tenantId), eq(channels.status, 'ACTIVE')),
          orderBy: [asc(channels.name)],
          columns: {
            id: true,
            name: true,
            parentId: true,
            hierarchyLevel: true,
          },
        });

        // 2. 获取所有联系人
        const allContacts = await db.query.channelContacts.findMany({
          where: eq(channelContacts.tenantId, user.tenantId),
          orderBy: [asc(channelContacts.name)],
          columns: {
            id: true,
            name: true,
            channelId: true,
          },
        });

        // 3. 内存组装树结构
        const contactsMap = new Map<string, typeof allContacts>();
        allContacts.forEach((contact) => {
          if (!contact.channelId) return;
          const list = contactsMap.get(contact.channelId) || [];
          list.push(contact);
          contactsMap.set(contact.channelId, list);
        });

        const level1Channels = allChannels.filter((c) => !c.parentId);

        return level1Channels.map((parent) => {
          const children = allChannels.filter((c) => c.parentId === parent.id);

          const childrenWithContacts = children.map((child) => ({
            id: child.id,
            name: child.name,
            level: child.hierarchyLevel,
            contacts: contactsMap.get(child.id) || [],
          }));

          return {
            id: parent.id,
            name: parent.name,
            level: parent.hierarchyLevel,
            children: childrenWithContacts,
          };
        });
      },
      180000
    ); // 3 分钟缓存 —— 渠道树低频变更

    const response = apiSuccess(result);
    response.headers.set('Cache-Control', 'private, max-age=180');
    return response;
  } catch (error) {
    logger.error('[Channels] 获取渠道树失败', { route: 'channels', error });
    return apiServerError('获取渠道失败');
  }
});
