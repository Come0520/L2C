'use server';

import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema/channels';
import { eq, and, desc, or, ilike } from 'drizzle-orm';

export async function getChannels(params: { tenantId: string, query?: string, type?: string, page?: number, pageSize?: number }) {
    const { tenantId, query, type, page = 1, pageSize = 20 } = params;

    let whereClause = eq(channels.tenantId, tenantId);

    if (query) {
        whereClause = and(
            whereClause,
            or(
                ilike(channels.name, `%${query}%`),
                ilike(channels.code, `%${query}%`),
                ilike(channels.phone, `%${query}%`)
            )
        ) as any;
    }

    if (type) {
        whereClause = and(whereClause, eq(channels.channelType, type as any)) as any;
    }

    const offsetValue = (page - 1) * pageSize;

    const data = await db.query.channels.findMany({
        where: whereClause,
        limit: pageSize,
        offset: offsetValue,
        orderBy: [desc(channels.createdAt)],
        with: {
            contacts: true,
        }
    });

    // Get total count for pagination
    // Note: Drizzle doesn't support count() with query builder easily in one go with where clause reuse without raw sql or separate query
    // Simplified count query:
    const allMatching = await db.query.channels.findMany({
        where: whereClause,
        columns: { id: true }
    });
    const totalItems = allMatching.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        data,
        totalPages,
        totalItems,
        currentPage: page,
        pageSize
    };
}

export async function getChannelById(id: string, tenantId: string) {
    return await db.query.channels.findFirst({
        where: and(eq(channels.id, id), eq(channels.tenantId, tenantId)),
        with: {
            contacts: true,
            assignedManager: true,
        }
    });
}

export async function getChannelByCode(code: string, tenantId: string) {
    return await db.query.channels.findFirst({
        where: and(eq(channels.code, code), eq(channels.tenantId, tenantId)),
    });
}

export async function getChannelContacts(channelId: string, tenantId: string) {
    return await db.query.channelContacts.findMany({
        where: and(eq(channelContacts.channelId, channelId), eq(channelContacts.tenantId, tenantId)),
        orderBy: [desc(channelContacts.isMain), desc(channelContacts.createdAt)],
    });
}
