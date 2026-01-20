import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and } from 'drizzle-orm';

/**
 * 联动规则定义 (Linkage Rule Definition)
 */
export interface LinkageRule {
    mainCategory: string;
    targetCategory: string;
    matchPattern?: string; // 产品名称匹配模式 (可选)
    calcLogic: 'FINISHED_WIDTH' | 'FINISHED_HEIGHT' | 'FIXED' | 'PROPORTIONAL';
    ratio?: number; // 针对 PROPORTIONAL 或辅助计算
}

/**
 * 联动机结果 (Linkage Result)
 */
export interface RecommendedAccessory {
    category: string;
    productName: string;
    quantity: number;
    unitPrice?: number;
    productId?: string;
    remark?: string;
}

/**
 * 配件联动服务 (Accessory Linkage Service)
 * 处理根据主材自动推荐配件（BOM 推荐）的逻辑
 */
export class AccessoryLinkageService {
    // 基础联动规则配置
    private static RULES: LinkageRule[] = [
        // 窗帘联动
        { mainCategory: 'CURTAIN', targetCategory: 'SERVICE', calcLogic: 'FINISHED_WIDTH' }, // 加工费(SERVICE)按成品宽
        { mainCategory: 'CURTAIN', targetCategory: 'CURTAIN_TRACK', calcLogic: 'FINISHED_WIDTH' },      // 轨道按成品宽
        { mainCategory: 'CURTAIN', targetCategory: 'CURTAIN_ACCESSORY', calcLogic: 'FINISHED_WIDTH' },       // 布带(ACCESSORY)按成品宽

        // 墙纸联动
        { mainCategory: 'WALLPAPER', targetCategory: 'WALLCLOTH_ACCESSORY', calcLogic: 'PROPORTIONAL', ratio: 0.2 }, // 胶水(ACCESSORY)按面积换算
        { mainCategory: 'WALLPAPER', targetCategory: 'SERVICE', calcLogic: 'PROPORTIONAL', ratio: 1.0 } // 墙纸人工费(SERVICE)按卷
    ];

    /**
     * 根据主材条目推荐配件
     */
    static async getRecommendedAccessories(mainItem: {
        category: string;
        width: number;
        height: number;
        foldRatio?: number;
        quantity?: number;
    }): Promise<RecommendedAccessory[]> {
        const applicableRules = this.RULES.filter(r => r.mainCategory === mainItem.category);
        const recommendations: RecommendedAccessory[] = [];

        for (const rule of applicableRules) {
            let quantity = 0;
            const finishedWidth = (mainItem.width * (mainItem.foldRatio || 2)) / 100; // 换算为米

            switch (rule.calcLogic) {
                case 'FINISHED_WIDTH':
                    quantity = finishedWidth;
                    break;
                case 'FINISHED_HEIGHT':
                    quantity = mainItem.height / 100;
                    break;
                case 'FIXED':
                    quantity = 1;
                    break;
                case 'PROPORTIONAL':
                    quantity = (mainItem.quantity || 0) * (rule.ratio || 1);
                    break;
            }

            // 尝试在产品库中查找默认配件产品
            const defaultProduct = await db.query.products.findFirst({
                where: and(
                    eq(products.category, rule.targetCategory as any),
                    eq(products.isActive, true)
                )
            });

            recommendations.push({
                category: rule.targetCategory,
                productName: defaultProduct?.name || `默认${rule.targetCategory}`,
                productId: defaultProduct?.id,
                unitPrice: defaultProduct?.retailPrice ? Number(defaultProduct.retailPrice) : 0,
                quantity: Math.ceil(quantity * 100) / 100, // 保留两位小数
                remark: '系统联动推荐'
            });
        }

        return recommendations;
    }
}
