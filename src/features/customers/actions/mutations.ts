'use server';

import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { customerSchema, updateCustomerSchema, mergeCustomersSchema } from '../schemas';
import { revalidatePath } from 'next/cache';
import { CustomerService } from '@/services/customer.service';
import { auth } from '@/shared/lib/auth';

// Zod schemas for Addresses (define here or import if centralized)
const addressSchema = z.object({
    label: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    community: z.string().optional(),
    address: z.string().min(1, '地址不能为空'),
    isDefault: z.boolean().default(false),
});

const createAddressSchema = addressSchema.extend({
    customerId: z.string(),
});

const updateAddressSchema = addressSchema.partial().extend({
    id: z.string(),
});

/**
 * 创建客户
 * 
 * @param input - 客户表单数据
 * @param userId - 操作用户 ID
 * @param tenantId - 租户 ID
 * @returns 新创建的客户
 */
export async function createCustomer(input: z.infer<typeof customerSchema>, userId: string, tenantId: string) {
    const data = customerSchema.parse(input);

    try {
        // 将渠道来源和带单人存储到 preferences JSON 字段
        const preferences: Record<string, unknown> = {};
        if (data.source) preferences.source = data.source;
        if (data.referrerName) preferences.referrerName = data.referrerName;

        const result = await CustomerService.createCustomer({
            name: data.name,
            phone: data.phone,
            phoneSecondary: data.phoneSecondary ?? null,
            wechat: data.wechat ?? null,
            gender: data.gender ?? null,
            level: data.level ?? 'D',
            notes: data.notes ?? null,
            tags: data.tags ?? null,
            type: data.type ?? 'INDIVIDUAL',
            preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
        } as typeof customers.$inferInsert, tenantId, userId, data.address ? { address: data.address } : undefined);

        if (result.isDuplicate) {
            throw new Error(`手机号 ${data.phone} 已存在 (客户编号: ${result.customer.customerNo})`);
        }

        revalidatePath('/customers');
        return result.customer;
    } catch (e: any) {
        throw e;
    }
}

export async function updateCustomer(input: z.infer<typeof updateCustomerSchema>, userId?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const { id, data } = updateCustomerSchema.parse(input);

    // 安全检查：验证客户属于当前租户
    const existingCustomer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, id),
            eq(customers.tenantId, session.user.tenantId)
        ),
    });
    if (!existingCustomer) throw new Error('客户不存在或无权操作');

    const [updated] = await db.update(customers)
        .set(data)
        .where(and(
            eq(customers.id, id),
            eq(customers.tenantId, session.user.tenantId)
        ))
        .returning();

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return updated;
}

export async function addCustomerAddress(input: z.infer<typeof createAddressSchema>, tenantId: string) {
    const data = createAddressSchema.parse(input);

    return await db.transaction(async (tx) => {
        if (data.isDefault) {
            // Unset other defaults
            await tx.update(customerAddresses)
                .set({ isDefault: false })
                .where(eq(customerAddresses.customerId, data.customerId));
        }

        const [newAddr] = await tx.insert(customerAddresses).values({
            tenantId,
            customerId: data.customerId,
            label: data.label,
            province: data.province,
            city: data.city,
            district: data.district,
            community: data.community,
            address: data.address,
            isDefault: data.isDefault,
        }).returning();

        return newAddr;
    }).then((res) => {
        revalidatePath(`/customers/${data.customerId}`);
        return res;
    });
}

export async function updateCustomerAddress(input: z.infer<typeof updateAddressSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const { id, ...data } = updateAddressSchema.parse(input);

    return await db.transaction(async (tx) => {
        // 安全检查：验证地址属于当前租户
        const addr = await tx.query.customerAddresses.findFirst({
            where: and(
                eq(customerAddresses.id, id),
                eq(customerAddresses.tenantId, session.user.tenantId)
            )
        });
        if (!addr) throw new Error('地址不存在或无权操作');

        if (data.isDefault) {
            await tx.update(customerAddresses)
                .set({ isDefault: false })
                .where(eq(customerAddresses.customerId, addr.customerId));
        }

        const [updated] = await tx.update(customerAddresses)
            .set(data)
            .where(and(
                eq(customerAddresses.id, id),
                eq(customerAddresses.tenantId, session.user.tenantId)
            ))
            .returning();

        return updated;
    }).then((res) => {
        return res;
    });
}

export async function deleteCustomerAddress(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 安全检查：验证地址属于当前租户
    const existingAddr = await db.query.customerAddresses.findFirst({
        where: and(
            eq(customerAddresses.id, id),
            eq(customerAddresses.tenantId, session.user.tenantId)
        ),
    });
    if (!existingAddr) throw new Error('地址不存在或无权操作');

    await db.delete(customerAddresses)
        .where(and(
            eq(customerAddresses.id, id),
            eq(customerAddresses.tenantId, session.user.tenantId)
        ));
}

export async function setDefaultAddress(id: string, customerId: string) {
    await db.transaction(async (tx) => {
        await tx.update(customerAddresses)
            .set({ isDefault: false })
            .where(eq(customerAddresses.customerId, customerId));

        await tx.update(customerAddresses)
            .set({ isDefault: true })
            .where(eq(customerAddresses.id, id));
    });
    revalidatePath(`/customers/${customerId}`);
}

export async function mergeCustomersAction(input: z.infer<typeof mergeCustomersSchema>, userId: string) {
    const data = mergeCustomersSchema.parse(input);
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized');

    const result = await CustomerService.mergeCustomers(
        data.targetCustomerId,
        data.sourceCustomerIds,
        data.fieldPriority,
        tenantId,
        userId
    );

    revalidatePath('/customers');
    revalidatePath(`/customers/${data.targetCustomerId}`);
    data.sourceCustomerIds.forEach(id => {
        revalidatePath(`/customers/${id}`);
    });

    return result;
}

export async function previewMergeAction(sourceId: string, targetId: string) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized');

    return await CustomerService.previewMerge(targetId, sourceId, tenantId);
}
