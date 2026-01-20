'use server';

import { QuoteService } from '@/services/quote.service';
import { QuoteConfigService } from '@/services/quote-config.service'; // Added import
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and, InferSelectModel } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { CustomerService } from '@/services/customer.service';
// auth 导入已移除（未使用）
import {
    createQuoteSchema,
    updateQuoteSchema,
    createQuoteRoomSchema,
    updateQuoteRoomSchema,
    createQuoteItemSchema,
    updateQuoteItemSchema,
    deleteQuoteItemSchema,
    rejectQuoteDiscountSchema,
    reorderQuoteItemsSchema,
    createQuickQuoteSchema,
    createQuoteBundleSchema
} from './schema';

import { leads } from '@/shared/api/schema/leads';
import { fetchQuotePlans } from '../lib/plan-loader';

import { DiscountControlService } from '@/services/discount-control.service';
import { CurtainCalculator, WallpaperCalculator, type CurtainFormula, type WallpaperFormula } from '../logic/calculator';
import { SizeValidator } from '../logic/size-validator';
import { AccessoryLinkageService } from '../services/accessory-linkage.service';

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

    // 5. If this is a sub-quote (has bundleId), update the bundle total
    if (quote.bundleId) {
        await updateBundleTotal(quote.bundleId);
    }
};

// Helper to update bundle total
const updateBundleTotal = async (bundleId: string) => {
    // Sum all quotes with bundleId = bundleId
    const subQuotes = await db.query.quotes.findMany({
        where: eq(quotes.bundleId, bundleId)
    });

    const bundleTotal = subQuotes.reduce((acc, q) => acc + Number(q.finalAmount || 0), 0);

    await db.update(quotes)
        .set({
            totalAmount: bundleTotal.toFixed(2),
            finalAmount: bundleTotal.toFixed(2),
            updatedAt: new Date()
        })
        .where(eq(quotes.id, bundleId));
};

export const createQuoteBundle = createSafeAction(createQuoteBundleSchema, async (data, context) => {
    // Current implementation creates a Quote as a Bundle container
    // or a specialized Quote type. Using standard Quote for now.
    const quoteNo = `QB${Date.now()}`;
    const [newBundle] = await db.insert(quotes).values({
        quoteNo,
        tenantId: context.session.user.tenantId || '00000000-0000-0000-0000-000000000000',
        customerId: data.customerId,
        leadId: data.leadId,
        title: `Quote Bundle - ${quoteNo}`,
        notes: data.remark,
        status: 'DRAFT',
        createdBy: context.session.user.id,
        // summaryMode: data.summaryMode // If schema supports it
    }).returning();

    // Set rootQuoteId
    await db.update(quotes)
        .set({ rootQuoteId: newBundle.id })
        .where(eq(quotes.id, newBundle.id));

    revalidatePath('/quotes');
    return newBundle;
});

export const createQuote = createSafeAction(createQuoteSchema, async (data, context) => {
    const quoteNo = `QT${Date.now()}`;
    const [newQuote] = await db.insert(quotes).values({
        quoteNo,
        tenantId: context.session.user.tenantId || '00000000-0000-0000-0000-000000000000',
        customerId: data.customerId,
        leadId: data.leadId,
        measureVariantId: data.measureVariantId,
        bundleId: data.bundleId, // Set bundleId explicitly
        title: data.title,
        notes: data.notes,
        status: 'DRAFT',
        createdBy: context.session.user.id,
    }).returning();

    // Set rootQuoteId to itself for start of version chain
    // (A sub-quote is still its own version chain root)
    const rootId = newQuote.id;

    await db.update(quotes)
        .set({ rootQuoteId: rootId })
        .where(eq(quotes.id, newQuote.id));

    newQuote.rootQuoteId = rootId;

    // If added to a bundle, update the bundle total
    if (data.bundleId) {
        await updateBundleTotal(data.bundleId);
    }

    revalidatePath('/quotes');
    return newQuote;
});

export const updateQuote = createSafeAction(updateQuoteSchema, async (data, context) => {
    const { id, ...updateData } = data;
    const userTenantId = context.session.user.tenantId;

    // 1. Fetch current quote to get tenantId and totalAmount (with tenant validation)
    const quote = await db.query.quotes.findFirst({
        where: and(
            eq(quotes.id, id),
            eq(quotes.tenantId, userTenantId)
        ),
    });

    if (!quote) throw new Error('报价单不存在或无权操作');

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
        .where(and(
            eq(quotes.id, id),
            eq(quotes.tenantId, userTenantId)
        ));

    revalidatePath(`/quotes/${id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const createRoom = createSafeAction(createQuoteRoomSchema, async (data, context) => {
    const [newRoom] = await db.insert(quoteRooms).values({
        quoteId: data.quoteId,
        name: data.name,
        tenantId: context.session.user.tenantId || '00000000-0000-0000-0000-000000000000',
        measureRoomId: data.measureRoomId,
    }).returning();

    revalidatePath(`/quotes/${data.quoteId}`);
    return newRoom;
});

export const updateRoom = createSafeAction(updateQuoteRoomSchema, async (data, context) => {
    const { id, ...updateData } = data;
    const userTenantId = context.session.user.tenantId;

    // 安全检查：验证房间属于当前租户
    const existing = await db.query.quoteRooms.findFirst({
        where: and(
            eq(quoteRooms.id, id),
            eq(quoteRooms.tenantId, userTenantId)
        ),
    });
    if (!existing) throw new Error('房间不存在或无权操作');

    const [updated] = await db.update(quoteRooms)
        .set({
            ...updateData,
        })
        .where(and(
            eq(quoteRooms.id, id),
            eq(quoteRooms.tenantId, userTenantId)
        ))
        .returning();

    revalidatePath(`/quotes/${updated.quoteId}`);
    return updated;
});

export const deleteRoom = createSafeAction(z.object({ id: z.string().uuid() }), async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    // 安全检查：验证房间属于当前租户
    const existing = await db.query.quoteRooms.findFirst({
        where: and(
            eq(quoteRooms.id, data.id),
            eq(quoteRooms.tenantId, userTenantId)
        )
    });

    if (!existing) throw new Error('房间不存在或无权操作');

    // Cascade delete items in this room (with tenant check)
    await db.delete(quoteItems)
        .where(and(
            eq(quoteItems.roomId, data.id),
            eq(quoteItems.tenantId, userTenantId)
        ));

    await db.delete(quoteRooms)
        .where(and(
            eq(quoteRooms.id, data.id),
            eq(quoteRooms.tenantId, userTenantId)
        ));

    // Recalculate Quote Total because items were deleted
    await updateQuoteTotal(existing.quoteId);

    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
});

export const reorderQuoteItems = createSafeAction(reorderQuoteItemsSchema, async (data, context) => {
    // We update both sortOrder and roomId (in case item was moved to another room)
    await db.transaction(async (tx) => {
        for (const item of data.items) {
            await tx.update(quoteItems)
                .set({
                    sortOrder: item.sortOrder,
                    roomId: data.roomId,
                })
                .where(eq(quoteItems.id, item.id));
        }
    });

    revalidatePath(`/quotes/${data.quoteId}`);
    return { success: true };
});
export const createQuoteItem = createSafeAction(createQuoteItemSchema, async (data, context) => {
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
            // 尝试在产品库中查找默认配件产品
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

    // 1. Fetch Config for Loss Settings
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, data.quoteId),
        columns: { tenantId: true, createdBy: true } // Need tenant and creator to get config
    });
    const config = await QuoteConfigService.getMergedConfig(
        quote?.tenantId || '00000000-0000-0000-0000-000000000000',
        quote?.createdBy || '00000000-0000-0000-0000-000000000000'
    );
    const { presetLoss } = config;

    // Calculation Logic
    if (data.category === 'CURTAIN' && data.width && data.height) {
        const calcParams = {
            measuredWidth: data.width,
            measuredHeight: data.height,
            foldRatio: data.foldRatio || 2,
            fabricWidth: (attributes.fabricWidth as number) || 280, // Default fallback
            formula: ((attributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
            sideLoss: (attributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
            bottomLoss: (attributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
            headerLoss: (attributes.headerLoss as number) ?? presetLoss.curtain.headerLoss
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
            formula: (data.category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula,
            widthLoss: (attributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
            cutLoss: (attributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss
        };

        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    const subtotal = calculateSubtotal(currentUnitPrice, quantity, data.processFee);

    // Size Rationality Validation
    if (data.width && data.height) {
        const sizeValidation = SizeValidator.validate(Number(data.width), Number(data.height));
        if (sizeValidation.messages.length > 0) {
            warnings.push(...sizeValidation.messages);
        }
    }

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
        tenantId: context.session.user.tenantId || '00000000-0000-0000-0000-000000000000',
    }).returning();

    await updateQuoteTotal(data.quoteId);

    // 自动配件联动 (Accessory Linkage)
    if (newItem && (data.category === 'CURTAIN' || data.category === 'WALLPAPER')) {
        const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
            category: data.category,
            width: Number(data.width || 0),
            height: Number(data.height || 0),
            foldRatio: data.foldRatio,
            quantity: Number(quantity)
        });

        for (const rec of recommendations) {
            await db.insert(quoteItems).values({
                quoteId: data.quoteId,
                roomId: data.roomId,
                parentId: newItem.id, // 挂载为主材的子项
                category: rec.category,
                productName: rec.productName,
                productId: rec.productId,
                unitPrice: rec.unitPrice?.toString() || '0',
                quantity: rec.quantity.toString(),
                subtotal: (rec.quantity * (rec.unitPrice || 0)).toString(),
                tenantId: newItem.tenantId,
                attributes: { _isAutoRecommended: true, remark: rec.remark }
            });
        }
    }

    revalidatePath(`/quotes/${data.quoteId}`);
    return newItem;
});

export const updateQuoteItem = createSafeAction(updateQuoteItemSchema, async (data, context) => {
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

    // 1. Fetch Config for Loss Settings (if needed for re-calc)
    // We can fetch quote -> get config.
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, existing.quoteId),
        columns: { tenantId: true, createdBy: true }
    });
    const config = await QuoteConfigService.getMergedConfig(
        quote?.tenantId || '00000000-0000-0000-0000-000000000000',
        quote?.createdBy || '00000000-0000-0000-0000-000000000000'
    );
    const { presetLoss } = config;

    // Trigger Calculation if dimensions changed
    if (category === 'CURTAIN' && width && height) {
        const calcParams = {
            measuredWidth: width,
            measuredHeight: height,
            foldRatio: foldRatio,
            fabricWidth: (mergedAttributes.fabricWidth as number) || 280,
            formula: ((mergedAttributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
            sideLoss: (mergedAttributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
            bottomLoss: (mergedAttributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
            headerLoss: (mergedAttributes.headerLoss as number) ?? presetLoss.curtain.headerLoss
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
            formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula,
            widthLoss: (mergedAttributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
            cutLoss: (mergedAttributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss
        };
        const result = WallpaperCalculator.calculate(calcParams);
        quantity = result.quantity;
        if (result.warnings.length) warnings = result.warnings;
    }

    // Apply unitPrice from updateData if provided, otherwise use the potentially auto-filled unitPrice
    const finalUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : unitPrice;
    const fee = updateData.processFee ?? Number(existing.processFee || 0);
    const subtotal = calculateSubtotal(finalUnitPrice, quantity, fee);

    // Size Rationality Validation
    if (width && height) {
        const sizeValidation = SizeValidator.validate(width, height);
        if (sizeValidation.messages.length > 0) {
            warnings.push(...sizeValidation.messages);
        }
    }

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

export const deleteQuoteItem = createSafeAction(deleteQuoteItemSchema, async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    // 安全检查：验证行项目属于当前租户
    const existing = await db.query.quoteItems.findFirst({
        where: and(
            eq(quoteItems.id, data.id),
            eq(quoteItems.tenantId, userTenantId)
        )
    });
    if (!existing) return { success: false, error: '行项目不存在或无权操作' };

    await db.delete(quoteItems)
        .where(and(
            eq(quoteItems.id, data.id),
            eq(quoteItems.tenantId, userTenantId)
        ));
    await updateQuoteTotal(existing.quoteId);

    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
});

export const createNextVersion = createSafeAction(z.object({ quoteId: z.string() }), async (data, context) => {
    const newQuote = await QuoteService.createNextVersion(data.quoteId, context.session.user.id);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${newQuote.id}`);
    revalidatePath(`/quotes/${data.quoteId}`);
    return newQuote;
});

export const submitQuote = createSafeAction(z.object({
    id: z.string().uuid(),
}), async (data, context) => {
    await QuoteLifecycleService.submit(data.id, context.session.user.tenantId, context.session.user.id);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});



export const rejectQuote = createSafeAction(z.object({
    id: z.string().uuid(),
    rejectReason: z.string().min(1),
}), async (data, context) => {
    await QuoteLifecycleService.reject(data.id, data.rejectReason);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const lockQuote = createSafeAction(z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    lockedBy: z.string().uuid().optional(),
}), async (data, context) => {
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
}), async (data, context) => {
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
}), async (data, context) => {
    await QuoteLifecycleService.approve(data.id, context.session.user.id);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const rejectQuoteDiscount = createSafeAction(rejectQuoteDiscountSchema, async (data, context) => {
    await QuoteLifecycleService.reject(data.id, data.reason);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
});

export const convertQuoteToOrder = createSafeAction(z.object({
    quoteId: z.string().uuid()
}), async (data, context) => {
    const order = await QuoteLifecycleService.convertToOrder(data.quoteId, context.session.user.tenantId, context.session.user.id);

    revalidatePath('/orders');
    revalidatePath(`/quotes/${data.quoteId}`);
    return order;
});

export const createQuickQuote = createSafeAction(createQuickQuoteSchema, async (data, context) => {
    const { leadId, planType, rooms } = data;
    const tenantId = context.session.user.tenantId;
    const userId = context.session.user.id;

    // 1. Validate Lead
    const lead = await db.query.leads.findFirst({
        where: eq(leads.id, leadId)
    }) as InferSelectModel<typeof leads> | undefined;
    if (!lead) throw new Error('Lead not found');

    // 2. Ensure Customer exists
    let customerId = lead.customerId;
    if (!customerId) {
        // Automatically create customer if missing
        const newCustomerResult = await CustomerService.createCustomer({
            name: lead.customerName || 'Quick Quote Customer',
            phone: lead.customerPhone || '',
            wechat: lead.customerWechat || null,
            preferences: { source: 'LEAD_CONVERSION' },
            type: 'INDIVIDUAL',
            lifecycleStage: 'LEAD',
            pipelineStatus: 'UNASSIGNED',
        }, tenantId, userId);
        customerId = newCustomerResult.customer.id;

        await db.update(leads)
            .set({ customerId: newCustomerResult.customer.id })
            .where(eq(leads.id, leadId));
    }

    // 3. Create Quote
    const quoteNo = `QQ${Date.now().toString().slice(-8)}`;
    console.log('[createQuickQuote] Creating quote with:', {
        quoteNo,
        tenantId,
        customerId,
        leadId,
        title: `快速报价 - ${planType}`,
    });

    let newQuote;
    try {
        [newQuote] = await db.insert(quotes).values({
            quoteNo,
            tenantId,
            customerId,
            leadId,
            title: `快速报价 - ${planType}`,
            status: 'DRAFT',
            createdBy: userId,
        }).returning();
        console.log('[createQuickQuote] Quote created:', newQuote.id);
    } catch (insertError) {
        console.error('[createQuickQuote] Quote insert failed:', insertError);
        throw insertError;
    }

    await db.update(quotes)
        .set({ rootQuoteId: newQuote.id })
        .where(eq(quotes.id, newQuote.id));

    // 4. Load Plan Data
    const allPlans = await fetchQuotePlans(tenantId);

    type MockProduct = { category?: string; name?: string; unitPrice?: number; foldRatio?: number };
    type MockPlan = { products?: Record<string, MockProduct> };

    const plan = (allPlans as Record<string, MockPlan>)[planType];
    if (!plan) {
        throw new Error(`Plan ${planType} not found`);
    }

    // 5. Create Rooms and Items
    for (const roomData of rooms) {
        const [room] = await db.insert(quoteRooms).values({
            quoteId: newQuote.id,
            tenantId,
            name: roomData.name,
        }).returning();

        // Add items based on plan and room properties
        for (const [key, product] of Object.entries(plan.products || {})) {
            const p = product;

            // Skip based on room logic
            if (key === 'sheer' && !roomData.hasSheer) continue;
            if (key === 'fabric' && roomData.hasFabric === false) continue;

            const quantity = roomData.width * (p.foldRatio || 2); // Simple calc for mock
            const subtotal = quantity * (p.unitPrice || 0);

            await db.insert(quoteItems).values({
                quoteId: newQuote.id,
                roomId: room.id,
                tenantId,
                category: p.category || 'OTHER',
                productName: p.name || key,
                unitPrice: (p.unitPrice || 0).toString(),
                quantity: quantity.toString(),
                subtotal: subtotal.toString(),
                width: roomData.width.toString(),
                height: roomData.height.toString(),
            });
        }
    }

    // 6. Finalize Quote Total
    await updateQuoteTotal(newQuote.id);

    revalidatePath('/quotes');
    return { id: newQuote.id, quoteNo };
});
