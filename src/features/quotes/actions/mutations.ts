'use server';

import { QuoteService } from '@/services/quote.service';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { products } from '@/shared/api/schema/catalogs';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { auth } from '@/shared/lib/auth';
import {
    createQuoteSchema,
    updateQuoteSchema,
    createQuoteRoomSchema,
    updateQuoteRoomSchema,
    createQuoteItemSchema,
    updateQuoteItemSchema,
    deleteQuoteItemSchema,
    rejectQuoteDiscountSchema
} from './schema';
import { DiscountControlService } from '@/services/discount-control.service';
import { CurtainCalculator, WallpaperCalculator, type CurtainFormula, type WallpaperFormula } from '../logic/calculator';

// Helper to calculate item subtotal
// In real app, this should call the Calculation Engine
const calculateSubtotal = (price: number, quantity: number, processFee: number = 0) => {
    return (price * quantity) + processFee;
};

// Helper to update quote total
const updateQuoteTotal = async (quoteId: string) => {
    // 1. Fetch quote to get current discount settings and tenantId
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
    });

    if (!quote) return;

    // 2. Sum all items
    const items = await db.query.quoteItems.findMany({
        where: eq(quoteItems.quoteId, quoteId),
    });

    const total = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const discountRate = Number(quote.discountRate || 1);
    const discountAmount = Number(quote.discountAmount || 0);

    // 3. Calculate final amount
    const finalAmount = Math.max(0, (total * discountRate) - discountAmount);

    // 4. Check if approval is required based on recalculated rate
    const requiresApproval = await DiscountControlService.checkRequiresApproval(
        quote.tenantId,
        discountRate
    );

    await db.update(quotes)
        .set({
            totalAmount: total.toFixed(2),
            finalAmount: finalAmount.toFixed(2),
            approvalRequired: requiresApproval,
            updatedAt: new Date()
        })
        .where(eq(quotes.id, quoteId));
};

export const createQuote = createSafeAction(createQuoteSchema, async (data) => {
    const quoteNo = `QT${Date.now()}`;
    const [newQuote] = await db.insert(quotes).values({
        quoteNo,
        tenantId: '00000000-0000-0000-0000-000000000000', // FIXME: Use actual tenantId
        customerId: data.customerId,
        leadId: data.leadId,
        measureVariantId: data.measureVariantId,
        title: data.title,
        notes: data.notes,
        status: 'DRAFT',
    }).returning();

    // Set rootQuoteId to itself for the first version
    await db.update(quotes)
        .set({ rootQuoteId: newQuote.id })
        .where(eq(quotes.id, newQuote.id));

    // Update local object to match DB state
    newQuote.rootQuoteId = newQuote.id;

    revalidatePath('/quotes');
    return newQuote;
});

export const updateQuote = createSafeAction(updateQuoteSchema, async (data) => {
    const { id, ...updateData } = data;

    // 1. Fetch current quote to get tenantId and totalAmount
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
    });

    if (!quote) throw new Error('Quote not found');

    const totalAmount = Number(quote.totalAmount || 0);
    const newRate = updateData.discountRate !== undefined ? updateData.discountRate : Number(quote.discountRate || 1);
    const newDiscountAmount = updateData.discountAmount !== undefined ? updateData.discountAmount : Number(quote.discountAmount || 0);

    // 2. Validate minimum discount
    const validation = await DiscountControlService.validateMinimumDiscount(quote.tenantId, newRate);
    if (!validation.isValid) {
        throw new Error(validation.message);
    }

    // 3. Check if approval is required
    const requiresApproval = await DiscountControlService.checkRequiresApproval(quote.tenantId, newRate);

    // 4. Calculate final amount
    const finalAmount = Math.max(0, (totalAmount * newRate) - newDiscountAmount);

    await db.update(quotes)
        .set({
            ...updateData,
            discountRate: newRate.toString(),
            discountAmount: newDiscountAmount.toString(),
            finalAmount: finalAmount.toString(),
            approvalRequired: requiresApproval,
            // Reset approval status on any update
            approvedAt: null,
            approverId: null,
            rejectReason: null,
            updatedAt: new Date()
        })
        .where(eq(quotes.id, id));

    revalidatePath(`/quotes/${id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const createRoom = createSafeAction(createQuoteRoomSchema, async (data) => {
    const [newRoom] = await db.insert(quoteRooms).values({
        quoteId: data.quoteId,
        name: data.name,
        tenantId: '00000000-0000-0000-0000-000000000000', // FIXME
        measureRoomId: data.measureRoomId,
    }).returning();

    revalidatePath(`/quotes/${data.quoteId}`);
    return newRoom;
});

export const updateRoom = createSafeAction(updateQuoteRoomSchema, async (data) => {
    const { id, ...updateData } = data;
    const [updated] = await db.update(quoteRooms)
        .set({
            ...updateData,
        })
        .where(eq(quoteRooms.id, id))
        .returning();

    revalidatePath(`/quotes/${updated.quoteId}`);
    return updated;
});

export const deleteRoom = createSafeAction(z.object({ id: z.string().uuid() }), async (data) => {
    const existing = await db.query.quoteRooms.findFirst({
        where: eq(quoteRooms.id, data.id)
    });

    if (!existing) throw new Error('Room not found');

    await db.delete(quoteRooms).where(eq(quoteRooms.id, data.id));
    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
});
export const createQuoteItem = createSafeAction(createQuoteItemSchema, async (data) => {
    let quantity = data.quantity;
    let warnings: string[] = [];
    let currentUnitPrice = data.unitPrice;
    let currentProductName = data.productName;
    const attributes = { ...(data.attributes as Record<string, unknown> || {}) };

    // Product Auto-fill Logic
    if (data.productId) {
        const product = await db.query.products.findFirst({
            where: eq(products.id, data.productId)
        });

        if (product) {
            // Auto-fill basic info
            if (!currentUnitPrice && product.unitPrice) currentUnitPrice = Number(product.unitPrice);
            if (!currentProductName) currentProductName = product.name;

            // Auto-fill attributes from specs
            const specs = (product.specs as Record<string, unknown>) || {};
            if (specs.fabricWidth && !attributes.fabricWidth) attributes.fabricWidth = specs.fabricWidth;
            if (specs.rollLength && !attributes.rollLength) attributes.rollLength = specs.rollLength;
            if (specs.patternRepeat && !attributes.patternRepeat) attributes.patternRepeat = specs.patternRepeat;
            if (specs.material && !attributes.material) attributes.material = specs.material;
        }
    }

    // Calculation Logic
    if (data.category === 'CURTAIN' && data.width && data.height) {
        const calcParams = {
            measuredWidth: data.width,
            measuredHeight: data.height,
            foldRatio: data.foldRatio || 2,
            fabricWidth: (attributes.fabricWidth as number) || 280, // Default fallback
            formula: ((attributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
            sideLoss: attributes.sideLoss as number,
            bottomLoss: attributes.bottomLoss as number,
            headerLoss: attributes.headerLoss as number
        };

        const result = CurtainCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    } else if ((data.category === 'WALLPAPER' || data.category === 'WALLCLOTH') && data.width && data.height) {
        const calcParams = {
            measuredWidth: data.width,
            measuredHeight: data.height,
            productWidth: (attributes.fabricWidth as number) || (data.category === 'WALLPAPER' ? 53 : 280),
            rollLength: (attributes.rollLength as number) || 1000,
            patternRepeat: (attributes.patternRepeat as number) || 0,
            formula: (data.category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula
        };

        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    const subtotal = calculateSubtotal(currentUnitPrice, quantity, data.processFee);

    // Store warnings in attributes if any
    const finalAttributes = warnings.length > 0
        ? { ...attributes, _warnings: warnings }
        : attributes;

    const [newItem] = await db.insert(quoteItems).values({
        ...data,
        productName: currentProductName,
        unitPrice: currentUnitPrice.toString(),
        quantity: quantity.toString(),
        subtotal: subtotal.toString(),
        width: data.width?.toString(),
        height: data.height?.toString(),
        foldRatio: data.foldRatio?.toString(),
        processFee: data.processFee?.toString(),
        attributes: finalAttributes,
        tenantId: '00000000-0000-0000-0000-000000000000', // FIXME
    }).returning();

    await updateQuoteTotal(data.quoteId);

    revalidatePath(`/quotes/${data.quoteId}`);
    return newItem;
});

export const updateQuoteItem = createSafeAction(updateQuoteItemSchema, async (data) => {
    // Manually extract productId and productName if they might exist in raw data but not in schema
    // or just assume standard updateData. We check schema.ts first.
    const { id, ...updateData } = data;
    const rawData = data as Record<string, unknown>; // Use Record instead of any
    const productId = rawData.productId as string | undefined;
    const productNameFromUI = rawData.productName as string | undefined;

    // Fetch existing item
    const existing = await db.query.quoteItems.findFirst({
        where: eq(quoteItems.id, id)
    });

    if (!existing) throw new Error('Item not found');

    // Initialize variables from existing item
    const category = existing.category;
    const width = updateData.width ?? Number(existing.width);
    const height = updateData.height ?? Number(existing.height);
    const foldRatio = updateData.foldRatio ?? Number(existing.foldRatio) ?? 2;
    const attributes = { ...(existing.attributes as Record<string, unknown> || {}) }; // Use const for base attributes
    let unitPrice = Number(existing.unitPrice);
    let productName = existing.productName;

    let quantity = updateData.quantity ?? Number(existing.quantity);
    let warnings: string[] = [];

    // Product Auto-fill Logic (if productId is updated or already present)
    const currentProductId = productId ?? existing.productId;
    if (currentProductId) {
        const product = await db.query.products.findFirst({
            where: eq(products.id, currentProductId)
        });

        if (product) {
            // Auto-fill basic info if not explicitly provided in updateData
            if (updateData.unitPrice === undefined && product.unitPrice) unitPrice = Number(product.unitPrice);
            if (productNameFromUI === undefined) productName = product.name;

            // Auto-fill attributes from specs if not explicitly provided in updateData.attributes
            const specs = (product.specs as Record<string, unknown>) || {};
            const updateAttrs = (updateData.attributes as Record<string, unknown>) || {};

            const mutableAttrs = attributes as Record<string, unknown>;
            if (specs.fabricWidth && mutableAttrs.fabricWidth === undefined && updateAttrs.fabricWidth === undefined) mutableAttrs.fabricWidth = specs.fabricWidth;
            if (specs.rollLength && mutableAttrs.rollLength === undefined && updateAttrs.rollLength === undefined) mutableAttrs.rollLength = specs.rollLength;
            if (specs.patternRepeat && mutableAttrs.patternRepeat === undefined && updateAttrs.patternRepeat === undefined) mutableAttrs.patternRepeat = specs.patternRepeat;
            if (specs.material && mutableAttrs.material === undefined && updateAttrs.material === undefined) mutableAttrs.material = specs.material;
        }
    }

    // Merge updateData attributes last to ensure explicit overrides
    const mergedAttributes = { ...attributes, ...(updateData.attributes as Record<string, unknown> || {}) };

    // Trigger Calculation if dimensions changed
    if (category === 'CURTAIN' && width && height) {
        const calcParams = {
            measuredWidth: width,
            measuredHeight: height,
            foldRatio: foldRatio,
            fabricWidth: (mergedAttributes.fabricWidth as number) || 280,
            formula: ((mergedAttributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
            sideLoss: mergedAttributes.sideLoss as number,
            bottomLoss: mergedAttributes.bottomLoss as number,
            headerLoss: mergedAttributes.headerLoss as number
        };
        const result = CurtainCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    } else if ((category === 'WALLPAPER' || category === 'WALLCLOTH') && width && height) {
        const calcParams = {
            measuredWidth: width,
            measuredHeight: height,
            productWidth: (mergedAttributes.fabricWidth as number) || (category === 'WALLPAPER' ? 53 : 280),
            rollLength: (mergedAttributes.rollLength as number) || 1000,
            patternRepeat: (mergedAttributes.patternRepeat as number) || 0,
            formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula
        };
        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    // Apply unitPrice from updateData if provided, otherwise use the potentially auto-filled unitPrice
    const finalUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : unitPrice;
    const fee = updateData.processFee ?? Number(existing.processFee || 0);
    const subtotal = calculateSubtotal(finalUnitPrice, quantity, fee);

    const finalAttributes = warnings.length > 0
        ? { ...mergedAttributes, _warnings: warnings }
        : mergedAttributes;

    await db.update(quoteItems)
        .set({
            ...updateData,
            productId: productId ?? existing.productId,
            productName: productNameFromUI ?? productName,
            unitPrice: finalUnitPrice.toString(),
            quantity: quantity.toString(),
            width: width.toString(),
            height: height.toString(),
            foldRatio: foldRatio.toString(),
            processFee: fee.toString(),
            subtotal: subtotal.toString(),
            attributes: finalAttributes
        })
        .where(eq(quoteItems.id, id));

    await updateQuoteTotal(existing.quoteId);

    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
});

export const deleteQuoteItem = createSafeAction(deleteQuoteItemSchema, async (data) => {
    const existing = await db.query.quoteItems.findFirst({ where: eq(quoteItems.id, data.id) });
    if (!existing) return { success: false };

    await db.delete(quoteItems).where(eq(quoteItems.id, data.id));
    await updateQuoteTotal(existing.quoteId);

    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
});

export const createNextVersion = createSafeAction(z.object({ quoteId: z.string() }), async (data) => {
    const userId = '00000000-0000-0000-0000-000000000000';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const newQuote = await QuoteService.createNextVersion(data.quoteId, userId, tenantId);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${newQuote.id}`);
    revalidatePath(`/quotes/${data.quoteId}`);
    return newQuote;
});

export const submitQuote = createSafeAction(z.object({
    id: z.string().uuid(),
}), async (data) => {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) throw new Error('Unauthorized');

    await QuoteLifecycleService.submit(data.id, session.user.tenantId, session.user.id);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});



export const rejectQuote = createSafeAction(z.object({
    id: z.string().uuid(),
    rejectReason: z.string().min(1),
}), async (data) => {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) throw new Error('Unauthorized');

    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, data.id)
    });

    if (!quote) throw new Error('Quote not found');
    // if (quote.status !== 'SUBMITTED') throw new Error('Only SUBMITTED quotes can be rejected'); 
    // Relaxed check for now or ensure status flow is correct

    const [updated] = await db.update(quotes)
        .set({
            status: 'REJECTED',
            rejectReason: data.rejectReason,
            updatedAt: new Date()
        })
        .where(eq(quotes.id, data.id))
        .returning();

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return updated;
});

export const lockQuote = createSafeAction(z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    lockedBy: z.string().uuid().optional(),
}), async (data) => {
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, data.id)
    });

    if (!quote) throw new Error('Quote not found');
    if (quote.lockedAt) throw new Error('Quote is already locked');

    const [updated] = await db.update(quotes)
        .set({ lockedAt: new Date(), updatedAt: new Date() })
        .where(eq(quotes.id, data.id))
        .returning();

    revalidatePath(`/quotes/${data.id}`);
    return updated;
});

export const unlockQuote = createSafeAction(z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
}), async (data) => {
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, data.id)
    });

    if (!quote) throw new Error('Quote not found');

    const [updated] = await db.update(quotes)
        .set({ lockedAt: null, updatedAt: new Date() })
        .where(eq(quotes.id, data.id))
        .returning();

    revalidatePath(`/quotes/${data.id}`);
    return updated;
});

export const approveQuote = createSafeAction(z.object({
    id: z.string().uuid(),
}), async (data) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    // Check permission logic should be here or in service

    await QuoteLifecycleService.approve(data.id, session.user.id);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const rejectQuoteDiscount = createSafeAction(rejectQuoteDiscountSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await QuoteLifecycleService.reject(data.id, data.reason);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const convertQuoteToOrder = createSafeAction(z.object({
    quoteId: z.string().uuid()
}), async (data) => {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) throw new Error('Unauthorized');

    const order = await QuoteLifecycleService.convertToOrder(data.quoteId, session.user.tenantId, session.user.id);

    revalidatePath('/orders');
    revalidatePath(`/quotes/${data.quoteId}`);
    return order;
});
