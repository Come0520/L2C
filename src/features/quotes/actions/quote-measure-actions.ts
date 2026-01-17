'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureItems, measureSheets } from '@/shared/api/schema/service';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { eq, and, desc } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { mapMeasureItemToQuoteItem } from '../config/measure-mapping';
import { revalidatePath } from 'next/cache';
import { MeasureMatcherService } from '../services/measure-matcher.service';

// Schema for fetching tasks
const getTasksSchema = z.object({
    customerId: z.string().uuid(),
});

// Schema for importing items
const importItemsSchema = z.object({
    quoteId: z.string().uuid(),
    measureItemIds: z.array(z.string().uuid()),
});

export const getMeasureTasksByCustomer = createSafeAction(getTasksSchema, async (data) => {
    // 1. Fetch COMPLETED measure tasks for this customer
    // Using simple db.select for robustness if relation setup is unknown
    // 2. Fetch Tasks
    const tasks = await db.query.measureTasks.findMany({
        where: and(
            eq(measureTasks.customerId, data.customerId),
            eq(measureTasks.status, 'COMPLETED')
        ),
        orderBy: [desc(measureTasks.updatedAt)],
    });

    // 3. Fetch Items for these tasks manually (since relations might be tricky)
    // Actually, measureTasks -> (one-to-many) -> measureSheets -> (one-to-many) -> measureItems

    const tasksWithItems = await Promise.all(tasks.map(async (task) => {
        const sheets = await db.query.measureSheets.findMany({
            where: eq(measureSheets.taskId, task.id),
            orderBy: [desc(measureSheets.createdAt)],
            limit: 1
        });

        const latestSheet = sheets[0];
        let taskItems: any[] = [];

        if (latestSheet) {
            taskItems = await db.query.measureItems.findMany({
                where: eq(measureItems.sheetId, latestSheet.id)
            });
        }

        return {
            ...task,
            items: taskItems
        };
    }));

    return tasksWithItems;
});


export const importMeasureItemsToQuote = createSafeAction(importItemsSchema, async (data) => {
    // 1. Fetch selected measure items
    const selectedItems = await db.query.measureItems.findMany({
        //@ts-ignore - 'inArray' logic needed but let's stick to basic for now or loop
        where: (items, { inArray }) => inArray(items.id, data.measureItemIds)
    });

    if (!selectedItems.length) return { success: false, message: 'No items found' };

    // 2. Map to Quote Items
    const quoteId = data.quoteId;
    const mappedItems = selectedItems.map(item => {
        const draft = mapMeasureItemToQuoteItem(item as any);
        return {
            quoteId,
            tenantId: item.tenantId, // Assuming tenantId exists
            category: 'CURTAIN_FABRIC', // Default category, might need UI selection
            productName: `${draft.roomName} 窗帘 (待选品)`,
            unitPrice: '0',
            quantity: '0', // Need calcs
            subtotal: '0',
            width: draft.width.toString(),
            height: draft.height.toString(),
            roomName: draft.roomName,
            attributes: draft.attributes,
            remark: draft.remark
        };
    });

    // 3. Insert
    await db.insert(quoteItems).values(mappedItems);

    revalidatePath(`/quotes/${quoteId}`);
    return { success: true, count: mappedItems.length };
});
