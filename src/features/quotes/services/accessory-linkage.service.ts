import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and } from 'drizzle-orm';
import type { ProductCategory } from '@/shared/api/schema/types';
import type { LinkageRule } from '@/services/quote-config.service';

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
  /**
   * 根据主材条目配置特征来自动化计算及推荐强相关的默认绑带、排座下挂等常规周边延伸配件 (Get Recommended Accessories)
   *
   * @param mainItem - 包含类别、长宽高与折叠倍数的基准主件对象
   * @param tenantId - 用作商品库关联扫描的强权属安全防越权隔离标识码
   * @param bomTemplates - 外部传入的基础 BOM 推导公式模型表字典集合
   * @returns 按配比公式规则被自动推断生成的高确信度关联拟定配件列表
   */
  static async getRecommendedAccessories(
    mainItem: {
      category: string;
      width: number;
      height: number;
      foldRatio?: number;
      quantity?: number;
    },
    tenantId: string,
    bomTemplates: LinkageRule[] = []
  ): Promise<RecommendedAccessory[]> {
    const applicableRules = bomTemplates.filter((r) => r.mainCategory === mainItem.category);
    const recommendations: RecommendedAccessory[] = [];

    for (const rule of applicableRules) {
      let quantity = 0;
      /** 标准化的对折比率布艺窗帘的平铺全宽转为核心公制米标准测算计尺 */
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

      /**
       * 尝试在产品库中查找默认配件产品
       * 🔒 安全修复：添加租户隔离
       */
      const defaultProduct = await db.query.products.findFirst({
        where: and(
          eq(products.category, rule.targetCategory as ProductCategory),
          eq(products.isActive, true),
          eq(products.tenantId, tenantId)
        ),
      });

      recommendations.push({
        category: rule.targetCategory,
        productName: defaultProduct?.name || `默认${rule.targetCategory}`,
        productId: defaultProduct?.id,
        unitPrice: defaultProduct?.retailPrice ? Number(defaultProduct.retailPrice) : 0,
        /** 对最终确定的挂靠需求材料消耗总量进行安全的逢小进顶舍入法截断到小数点后两位 */
        quantity: Math.ceil(quantity * 100) / 100, // 保留两位小数
        remark: '系统联动推荐',
      });
    }

    return recommendations;
  }
}
