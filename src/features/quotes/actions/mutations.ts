
import { QuoteService } from '@/services/quote.service';
import { z } from 'zod';
// ... previous imports

import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { products } from '@/shared/api/schema/catalogs';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
    createQuoteSchema,
    updateQuoteSchema,
    createQuoteRoomSchema,
    createQuoteItemSchema,
    updateQuoteItemSchema,
    deleteQuoteItemSchema,
} from './schema';

// Helper to calculate item subtotal
// In real app, this should call the Calculation Engine
const calculateSubtotal = (price: number, quantity: number, processFee: number = 0) => {
    return (price * quantity) + processFee;
};

// Helper to update quote total
const updateQuoteTotal = async (quoteId: string) => {
    // Sum all items
    const items = await db.query.quoteItems.findMany({
        where: eq(quoteItems.quoteId, quoteId),
    });

    const total = items.reduce((acc, item) => acc + Number(item.subtotal), 0);

    await db.update(quotes)
        .set({
            totalAmount: total.toString(),
            // Simple logic: final = total - discount (if any)
            // This needs more complex logic from requirements later
            finalAmount: total.toString(),
            updatedAt: new Date()
        })
        .where(eq(quotes.id, quoteId));
};

export const createQuote = createSafeAction(createQuoteSchema, async (data) => {
    const quoteNo = `QT${Date.now()}`; // Simple generation

    const [newQuote] = await db.insert(quotes).values({
        quoteNo,
        tenantId: '00000000-0000-0000-0000-000000000000', // FIXME: Replace with actual tenantId
        customerId: data.customerId,
        leadId: data.leadId,
        measureVariantId: data.measureVariantId,
        title: data.title,
        notes: data.notes,
        status: 'DRAFT',
    }).returning();

    revalidatePath('/quotes');
    return newQuote;
});

export const updateQuote = createSafeAction(updateQuoteSchema, async (data) => {
    const { id, ...updateData } = data;

    await db.update(quotes)
        .set({
            ...updateData,
            discountRate: updateData.discountRate?.toString(),
            discountAmount: updateData.discountAmount?.toString(),
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

export const createQuoteItem = createSafeAction(createQuoteItemSchema, async (data) => {
    let quantity = data.quantity;
    let warnings: string[] = [];
    let unitPrice = data.unitPrice;
    let productName = data.productName;
    let attributes = { ...data.attributes };

    // Product Auto-fill Logic
    if (data.productId) {
        const product = await db.query.products.findFirst({
            where: eq(products.id, data.productId)
        });

        if (product) {
            // Auto-fill basic info
            if (!unitPrice && product.unitPrice) unitPrice = Number(product.unitPrice);
            if (!productName) productName = product.name;

            // Auto-fill attributes from specs
            const specs = product.specs as any || {};
            if (specs.fabricWidth && !attributes.fabricWidth) attributes.fabricWidth = specs.fabricWidth;
            if (specs.rollLength && !attributes.rollLength) attributes.rollLength = specs.rollLength;
            if (specs.patternRepeat && !attributes.patternRepeat) attributes.patternRepeat = specs.patternRepeat;
            if (specs.material && !attributes.material) attributes.material = specs.material;
        }
    }

    // Calculation Logic
    if (data.category === 'CURTAIN' && data.width && data.height) {
        const calcParams: any = {
            measuredWidth: data.width,
            measuredHeight: data.height,
            foldRatio: data.foldRatio || 2,
            fabricWidth: attributes.fabricWidth || 280, // Default fallback
            formula: attributes.formula || 'FIXED_HEIGHT',
            sideLoss: attributes.sideLoss,
            bottomLoss: attributes.bottomLoss,
            headerLoss: attributes.headerLoss
        };

        const { CurtainCalculator } = await import('../logic/calculator');
        const result = CurtainCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    } else if ((data.category === 'WALLPAPER' || data.category === 'WALLCLOTH') && data.width && data.height) {
        const calcParams: any = {
            measuredWidth: data.width,
            measuredHeight: data.height,
            productWidth: attributes.fabricWidth || (data.category === 'WALLPAPER' ? 53 : 280),
            rollLength: attributes.rollLength || 1000,
            patternRepeat: attributes.patternRepeat || 0,
            formula: data.category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH'
        };

        const { WallpaperCalculator } = await import('../logic/calculator');
        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    const subtotal = calculateSubtotal(unitPrice, quantity, data.processFee);

    // Store warnings in attributes if any
    const finalAttributes = warnings.length > 0
        ? { ...attributes, _warnings: warnings }
        : attributes;

    const [newItem] = await db.insert(quoteItems).values({
        ...data,
        productName,
        unitPrice: unitPrice.toString(),
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
    const { id, ...updateData } = data;

    // Fetch existing item
    const existing = await db.query.quoteItems.findFirst({
        where: eq(quoteItems.id, id)
    });

    if (!existing) throw new Error('Item not found');

    // Initialize variables from existing item
    const category = existing.category;
    let width = updateData.width ?? Number(existing.width);
    let height = updateData.height ?? Number(existing.height);
    let foldRatio = updateData.foldRatio ?? Number(existing.foldRatio) ?? 2;
    let attributes = { ...(existing.attributes as object) }; // Start with existing attributes
    let unitPrice = Number(existing.unitPrice);
    let productName = existing.productName;

    let quantity = updateData.quantity ?? Number(existing.quantity);
    let warnings: string[] = [];

    // Product Auto-fill Logic (if productId is updated or already present)
    const currentProductId = updateData.productId ?? existing.productId;
    if (currentProductId) {
        const product = await db.query.products.findFirst({
            where: eq(products.id, currentProductId)
        });

        if (product) {
            // Auto-fill basic info if not explicitly provided in updateData
            if (updateData.unitPrice === undefined && product.unitPrice) unitPrice = Number(product.unitPrice);
            if (updateData.productName === undefined) productName = product.name;

            // Auto-fill attributes from specs if not explicitly provided in updateData.attributes
            const specs = product.specs as any || {};
            if (specs.fabricWidth && attributes.fabricWidth === undefined && updateData.attributes?.fabricWidth === undefined) attributes.fabricWidth = specs.fabricWidth;
            if (specs.rollLength && attributes.rollLength === undefined && updateData.attributes?.rollLength === undefined) attributes.rollLength = specs.rollLength;
            if (specs.patternRepeat && attributes.patternRepeat === undefined && updateData.attributes?.patternRepeat === undefined) attributes.patternRepeat = specs.patternRepeat;
            if (specs.material && attributes.material === undefined && updateData.attributes?.material === undefined) attributes.material = specs.material;
        }
    }

    // Merge updateData attributes last to ensure explicit overrides
    attributes = { ...attributes, ...updateData.attributes };

    // Trigger Calculation if dimensions changed
    // In real app, we might want an explicit flag "autoCalculate" or check if manually overridden
    if (category === 'CURTAIN' && width && height) {
        const calcParams: any = {
            measuredWidth: width,
            measuredHeight: height,
            foldRatio: foldRatio,
            fabricWidth: attributes.fabricWidth || 280,
            formula: attributes.formula || 'FIXED_HEIGHT',
            sideLoss: attributes.sideLoss,
            bottomLoss: attributes.bottomLoss,
            headerLoss: attributes.headerLoss
        };
        const { CurtainCalculator } = await import('../logic/calculator');
        const result = CurtainCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    } else if ((category === 'WALLPAPER' || category === 'WALLCLOTH') && width && height) {
        const calcParams: any = {
            measuredWidth: width,
            measuredHeight: height,
            productWidth: attributes.fabricWidth || (category === 'WALLPAPER' ? 53 : 280),
            rollLength: attributes.rollLength || 1000,
            patternRepeat: attributes.patternRepeat || 0,
            formula: category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH'
        };
        const { WallpaperCalculator } = await import('../logic/calculator');
        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    // Apply unitPrice from updateData if provided, otherwise use the potentially auto-filled unitPrice
    const finalUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : unitPrice;
    const fee = updateData.processFee ?? Number(existing.processFee || 0);
    const subtotal = calculateSubtotal(finalUnitPrice, quantity, fee);

    const finalAttributes = warnings.length > 0
        ? { ...attributes, _warnings: warnings }
        : attributes;

    await db.update(quoteItems)
        .set({
            ...updateData,
            productName: updateData.productName ?? productName, // Use updated productName or auto-filled
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
    // FIXME: Ideally get from session
    // const session = await auth();
    const userId = '00000000-0000-0000-0000-000000000000';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const newQuote = await QuoteService.createNextVersion(data.quoteId, userId, tenantId);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${newQuote.id}`);
    revalidatePath(`/quotes/${data.quoteId}`); // Revalidate old one too
    return newQuote;
});
