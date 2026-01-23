'use server';

import { db } from '@/shared/api/db';
import { products, productSuppliers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { auth } from '@/shared/lib/auth';

interface CostBreakdown {
    purchaseCost: number;
    logisticsCost: number;
    processingCost: number;
    lossCost: number;
    totalCost: number;
}

interface PriceAnalysis {
    basePrice: number;
    cost: CostBreakdown;
    margin: number;
    marginRate: number;
}

/**
 * 计算产品综合成本
 * 需要认证后才能调用
 */
export const calculateProductCost = async (productId: string, supplierId?: string): Promise<CostBreakdown> => {
    // 认证检查
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('未授权');
    }

    // 查询产品时添加租户隔离
    const product = await db.query.products.findFirst({
        where: and(
            eq(products.id, productId),
            eq(products.tenantId, session.user.tenantId)
        ),
    });

    if (!product) {
        throw new Error('产品不存在或无权访问');
    }

    let purchasePrice = new Decimal(product.purchasePrice || 0);

    // 如果指定了供应商，尝试获取供应商特定价格
    if (supplierId) {
        const supplierPrice = await db.query.productSuppliers.findFirst({
            where: and(
                eq(productSuppliers.productId, productId),
                eq(productSuppliers.supplierId, supplierId)
            ),
        });
        if (supplierPrice?.purchasePrice) {
            purchasePrice = new Decimal(supplierPrice.purchasePrice);
        }
    }

    const logisticsCost = new Decimal(product.logisticsCost || 0);
    const processingCost = new Decimal(product.processingCost || 0);
    const lossRate = new Decimal(product.lossRate || 0);

    // 计算损耗成本: (采购价 + 物流 + 加工) * 损耗率
    // 或者根据具体业务逻辑调整，通常损耗是基于原材料成本
    // 假设损耗仅基于采购价
    const lossCost = purchasePrice.mul(lossRate);

    // 如果损耗基于总投入
    // const baseTotal = purchasePrice.add(logisticsCost).add(processingCost);
    // const lossCost = baseTotal.mul(lossRate);

    const totalCost = purchasePrice
        .add(logisticsCost)
        .add(processingCost)
        .add(lossCost);

    return {
        purchaseCost: purchasePrice.toNumber(),
        logisticsCost: logisticsCost.toNumber(),
        processingCost: processingCost.toNumber(),
        lossCost: lossCost.toNumber(),
        totalCost: totalCost.toNumber(),
    };
};

/**
 * 计算利润分析
 */
export const analyzeProductProfit = async (
    productId: string,
    sellingPrice: number,
    supplierId?: string
): Promise<PriceAnalysis> => {
    const costs = await calculateProductCost(productId, supplierId);
    const price = new Decimal(sellingPrice);
    const cost = new Decimal(costs.totalCost);

    const margin = price.sub(cost);
    const marginRate = price.isZero() ? new Decimal(0) : margin.div(price);

    return {
        basePrice: sellingPrice,
        cost: costs,
        margin: margin.toNumber(),
        marginRate: marginRate.toNumber(),
    };
};

/**
 * 计算渠道价格
 */
export const calculateChannelPrice = (
    basePrice: number,
    mode: 'FIXED' | 'DISCOUNT',
    fixedPrice?: number,
    discountRate?: number
): number => {
    if (mode === 'FIXED') {
        return fixedPrice || basePrice;
    }

    if (mode === 'DISCOUNT' && discountRate) {
        return new Decimal(basePrice).mul(discountRate).toNumber();
    }

    return basePrice;
};
