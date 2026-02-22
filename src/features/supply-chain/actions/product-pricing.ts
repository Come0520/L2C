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
 * 
 * @description 成本构成：采购价 + 物流费 + 加工费 + 损耗(基于采购价和损耗率)。
 * 支持供应商特定价格查询。包含租户隔离校验。
 * 
 * @param productId 产品 ID
 * @param supplierId (可选) 供应商 ID，用于获取特定采购价
 * @returns 包含各分项成本及总成本的对象
 */
export const calculateProductCost = async (productId: string, supplierId?: string): Promise<CostBreakdown> => {
    try {
        console.warn('[supply-chain] calculateProductCost 开始执行:', { productId, supplierId });
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
                    eq(productSuppliers.supplierId, supplierId),
                    eq(productSuppliers.tenantId, session.user.tenantId)
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

        console.warn('[supply-chain] calculateProductCost 执行成功:', { totalCost: totalCost.toNumber() });
        return {
            purchaseCost: purchasePrice.toNumber(),
            logisticsCost: logisticsCost.toNumber(),
            processingCost: processingCost.toNumber(),
            lossCost: lossCost.toNumber(),
            totalCost: totalCost.toNumber(),
        };
    } catch (error) {
        console.error('[supply-chain] calculateProductCost 异常:', error);
        throw error;
    }
};

/**
 * 进行产品利润分析
 * 
 * @description 基于综合成本和销售价计算毛利及毛利率。
 * 
 * @param productId 产品 ID
 * @param sellingPrice 销售单价
 * @param supplierId (可选) 供应商 ID
 * @returns 包含成本拆解及利润指标的分析结果
 */
export const analyzeProductProfit = async (
    productId: string,
    sellingPrice: number,
    supplierId?: string
): Promise<PriceAnalysis> => {
    try {
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
    } catch (error) {
        console.error('[supply-chain] analyzeProductProfit 异常:', error);
        throw error;
    }
};

/**
 * 计算渠道定价
 * 
 * @description 提供两种模式：1. 固定价 2. 基于基础价的折扣。
 * 
 * @param basePrice 基础价格
 * @param mode 定价模式 (FIXED | DISCOUNT)
 * @param fixedPrice 固定定价（FIXED 模式下生效）
 * @param discountRate 折扣率（DISCOUNT 模式下生效，如 0.85）
 * @returns 最终计算出的渠道价
 */
export const calculateChannelPrice = (
    basePrice: number,
    mode: 'FIXED' | 'DISCOUNT',
    fixedPrice?: number,
    discountRate?: number
): number => {
    console.warn('[supply-chain] calculateChannelPrice 输入:', { basePrice, mode, fixedPrice, discountRate });
    if (mode === 'FIXED') {
        const result = fixedPrice || basePrice;
        return result;
    }

    if (mode === 'DISCOUNT' && discountRate) {
        const result = new Decimal(basePrice).mul(discountRate).toNumber();
        return result;
    }

    return basePrice;
};
