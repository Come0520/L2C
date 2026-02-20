'use server';

import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema/channels';
import { eq, and, desc, or, ilike, isNull } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { unstable_cache } from 'next/cache';

/**
 * 获取渠道列表（支持分页、搜索、类型过滤、层级过滤）
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannels(params: {
    query?: string,
    type?: string,
    parentId?: string | null,  // 支持层级过滤，null 表示查顶级
    page?: number,
    pageSize?: number
}) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: Add Permission Check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    const tenantId = session.user.tenantId;
    const { query, type, parentId, page = 1, pageSize = 20 } = params;

    // P3 Fix: Enforce pagination limits
    const limit = Math.min(Math.max(pageSize, 1), 100);

    let whereClause = eq(channels.tenantId, tenantId);

    // 搜索过滤
    if (query) {
        // M-05 Fix: Escape special characters for ILIKE to prevent excessive matching
        const escapedQuery = query.replace(/[%_]/g, '\\$&');
        whereClause = and(
            whereClause,
            or(
                ilike(channels.name, `%${escapedQuery}%`),
                ilike(channels.channelNo, `%${escapedQuery}%`),
                ilike(channels.phone, `%${escapedQuery}%`)
            )
        ) as typeof whereClause;
    }

    // 类型过滤
    if (type) {
        const validType = ['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY', 'DOUYIN', 'XIAOHONGSHU', 'STORE', 'OTHER'].includes(type);
        if (validType) {
            whereClause = and(whereClause, eq(channels.channelType, type as 'DECORATION_CO' | 'DESIGNER' | 'CROSS_INDUSTRY' | 'DOUYIN' | 'XIAOHONGSHU' | 'STORE' | 'OTHER')) as typeof whereClause;
        }
    }

    // 层级过滤
    if (parentId !== undefined) {
        if (parentId === null) {
            // 查顶级渠道
            whereClause = and(whereClause, isNull(channels.parentId)) as typeof whereClause;
        } else {
            // 查特定父级的子渠道
            whereClause = and(whereClause, eq(channels.parentId, parentId)) as typeof whereClause;
        }
    }

    const offsetValue = (page - 1) * pageSize;


    const data = await db.query.channels.findMany({
        where: whereClause,
        limit: limit,
        offset: offsetValue,
        orderBy: [desc(channels.createdAt)],
        with: {
            contacts: true,
            channelCategory: true,     // 关联渠道类型
            parent: true,       // 关联父级渠道
            children: true,     // 关联子级渠道
        }
    });

    // 获取总数
    const totalItems = await db.$count(channels, whereClause);
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data,
        totalPages,
        totalItems,
        currentPage: page,
        pageSize: limit
    };
}

/**
 * 构建渠道树形结构的缓存版本（按 tenantId 缓存）
 *
 * @description 使用 unstable_cache 缓存，tag: channel-tree-{tenantId}
 * 渠道树结构在短时间内变动极低，适合较长周期缓存。
 * 修改/创建/删除渠道时，通过 revalidateTag 失效。
 */
const getCachedChannelTree = (tenantId: string) =>
    unstable_cache(
        async () => {
            const allChannels = await db.query.channels.findMany({
                where: eq(channels.tenantId, tenantId),
                orderBy: [desc(channels.createdAt)],
                with: {
                    contacts: true,
                    channelCategory: true,
                    assignedManager: true,
                }
            });

            // 构建树形结构
            type ChannelWithChildren = typeof allChannels[0] & { children?: ChannelWithChildren[] };

            const channelMap = new Map<string, ChannelWithChildren>();
            const rootChannels: ChannelWithChildren[] = [];

            // 第一遍：创建所有节点的映射
            for (const channel of allChannels) {
                channelMap.set(channel.id, { ...channel, children: [] });
            }

            // 第二遍：构建树形关系
            for (const channel of allChannels) {
                const node = channelMap.get(channel.id)!;
                if (channel.parentId && channelMap.has(channel.parentId)) {
                    const parent = channelMap.get(channel.parentId)!;
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    rootChannels.push(node);
                }
            }

            return rootChannels;
        },
        [`channel-tree-${tenantId}`],
        { tags: [`channel-tree`, `channel-tree-${tenantId}`] }
    );

/**
 * 获取渠道树形结构（用于树形展示）
 *
 * 安全检查：自动从 session 获取 tenantId
 * 已使用 unstable_cache 缓存，tag: channel-tree / channel-tree-{tenantId}
 */
export async function getChannelTree() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: Add Permission Check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    return getCachedChannelTree(session.user.tenantId)();
}

/**
 * 根据 ID 获取渠道详情
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelById(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: Add Permission Check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    const tenantId = session.user.tenantId;

    return await db.query.channels.findFirst({
        where: and(eq(channels.id, id), eq(channels.tenantId, tenantId)),
        with: {
            contacts: true,
            assignedManager: true,
            parent: true,
            children: {
                with: {
                    contacts: true,
                }
            },
        }
    });
}

/**
 * 根据编号获取渠道
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelByCode(channelNo: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: Add Permission Check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    const tenantId = session.user.tenantId;

    return await db.query.channels.findFirst({
        where: and(eq(channels.channelNo, channelNo), eq(channels.tenantId, tenantId)),
    });
}

/**
 * 获取渠道联系人列表
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelContacts(channelId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: Add Permission Check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    const tenantId = session.user.tenantId;

    return await db.query.channelContacts.findMany({
        where: and(eq(channelContacts.channelId, channelId), eq(channelContacts.tenantId, tenantId)),
        orderBy: [desc(channelContacts.isMain), desc(channelContacts.createdAt)],
    });
}
