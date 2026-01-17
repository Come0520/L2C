'use server';

import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { customerSchema, updateCustomerSchema, mergeCustomersSchema } from '../schemas';
import { revalidatePath } from 'next/cache';
import { CustomerService } from '@/services/customer.service';

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

export async function createCustomer(input: z.infer<typeof customerSchema>, userId: string, tenantId: string) {
    const data = customerSchema.parse(input);

    try {
        const result = await CustomerService.createCustomer({
            name: data.name,
            phone: data.phone,
            phoneSecondary: data.phoneSecondary ?? null,
            wechat: data.wechat ?? null,
            gender: data.gender ?? null,
            level: data.level as any ?? 'D',
            notes: data.notes ?? null,
            tags: data.tags ?? null,
            type: data.type ?? 'INDIVIDUAL',
        } as any, tenantId, userId, data.address ? { address: data.address } : undefined);

        if (result.isDuplicate) {
            throw new Error(`手机号 ${data.phone} 已存在 (客户编号: ${result.customer.customerNo})`);
        }

        revalidatePath('/customers');
        return result.customer;
    } catch (e: any) {
        throw e;
    }
}

export async function updateCustomer(input: z.infer<typeof updateCustomerSchema>, userId: string) {
    const { id, data } = updateCustomerSchema.parse(input);

    const [updated] = await db.update(customers)
        .set({
            ...data,
        })
        .where(eq(customers.id, id))
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
    const { id, ...data } = updateAddressSchema.parse(input);

    return await db.transaction(async (tx) => {
        const addr = await tx.query.customerAddresses.findFirst({
            where: eq(customerAddresses.id, id)
        });
        if (!addr) throw new Error('Address not found');

        if (data.isDefault) {
            await tx.update(customerAddresses)
                .set({ isDefault: false })
                .where(eq(customerAddresses.customerId, addr.customerId));
        }

        const [updated] = await tx.update(customerAddresses)
            .set(data)
            .where(eq(customerAddresses.id, id))
            .returning();

        return updated;
    }).then((res) => {
        return res;
    });
}

export async function deleteCustomerAddress(id: string) {
    await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
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
