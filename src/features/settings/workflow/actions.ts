'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { updateWorkflowConfigSchema, WorkflowConfig } from './schema';

/**
 * 获取租户工作流配�?
 */
export async function getWorkflowConfig(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const settings = (tenant?.settings || {}) as { workflowConfig?: WorkflowConfig };
    return settings.workflowConfig || {
        quoteCreationMode: 'REQUIRE_LEAD',
        measurementTrigger: 'FROM_LEAD',
        allowDirectOrderWithoutMeasure: false
    };
}

/**
 * 更新租户工作流配�?
 */
export const updateWorkflowConfig = createSafeAction(updateWorkflowConfigSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.CONFIG_MANAGE);

    const tenantId = session.user.tenantId;

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const currentSettings = (tenant?.settings || {}) as { workflowConfig?: WorkflowConfig };
    const newSettings = {
        ...currentSettings,
        workflowConfig: data.config
    };

    await db.update(tenants)
        .set({ settings: newSettings, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

    revalidatePath('/settings');
    return { success: true };
});
