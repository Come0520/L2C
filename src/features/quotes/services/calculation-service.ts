/**
 * Quote Calculation Service
 * Core logic associated with Quote logic
 */
import { db } from '@/shared/api/db';
import { quoteItems } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { CurtainStrategy } from '../calc-strategies/curtain-strategy';
import { WallpaperStrategy } from '../calc-strategies/wallpaper-strategy';
import type { QuoteItemAttributes } from '@/shared/api/types/quote-types';

import { products } from '@/shared/api/schema/catalogs';
import { StandardProductStrategy } from '../calc-strategies/standard-product-strategy';

type QuoteItemWithProduct = typeof quoteItems.$inferSelect & {
  product: typeof products.$inferSelect | null;
};

/**
 * 封装并管理报价系统全部运算引擎入口代理分配的实体类统筹组件 (Quote Calculation Service Core)
 */
class QuoteCalculationServiceClass {
  /** 运行时缓存字典对象：阻断针对相同参数反复触碰复杂计价策略运算引发的重计算性能损耗 */
  private calcCache = new Map<string, unknown>();

  /**
   * 重新计算单个行项目的金额及明细。
   * 支持传入 width/height 覆盖值（用于预览或批量更新）。
   *
   * @param itemId - 行项目 ID
   * @param overrides - 覆盖参数对象
   * @returns 计算出的用量、小计及相关工艺详情
   */
  async recalculateItem(itemId: string, overrides: { width?: number; height?: number }) {
    const item = await db.query.quoteItems.findFirst({
      where: eq(quoteItems.id, itemId),
      with: {
        product: true,
      },
    });

    if (!item) throw new Error('Quote item not found');

    const category = item.category as string;
    const width = overrides.width ?? Number(item.width);
    const height = overrides.height ?? Number(item.height);

    // Extract attributes safely
    const attrs = (item.attributes || {}) as QuoteItemAttributes;

    // Map parameters
    // DB stores fabricWidth in CM (likely), Strategy expects M? No, wait.
    // Let's re-verify Strategy implementation from file viewing.
    // Strategy: `const fabricWidthCm = fabricWidth * 100`. So Strategy expects Meters.
    // Attributes: `fabricWidth` is usually CM (e.g. 280).
    // So pass `fabricWidth / 100`.

    const specs = item.product?.specs as Record<string, unknown> | null;
    const fabricWidthCm = Number(attrs.fabricWidth || specs?.['fabricWidth'] || 0);

    // Enum mapping
    const headerType = (attrs.headerProcessType || 'WRAPPED') as 'WRAPPED' | 'ATTACHED';
    const openingType = (attrs.openingStyle || 'DOUBLE') as 'SINGLE' | 'DOUBLE';
    const fabricType = attrs.fabricDirection === 'WIDTH' ? 'FIXED_WIDTH' : 'FIXED_HEIGHT';
    // Note: Old 'fabricDirection' HEIGHT -> FIXED_HEIGHT (定高), WIDTH -> FIXED_WIDTH (定宽)

    // 缓存 Key 生成：基于核心参数
    const cacheKey = `curtain:${itemId}:${width}:${height}:${attrs.foldRatio}:${fabricWidthCm}:${fabricType}:${headerType}:${openingType}`;
    if (this.calcCache.has(cacheKey)) {
      return this.calcCache.get(cacheKey);
    }

    if (category === 'CURTAIN' || category.startsWith('CURTAIN_')) {
      const strategy = new CurtainStrategy();

      const result = strategy.calculate({
        measuredWidth: width,
        measuredHeight: height,
        foldRatio: Number(item.foldRatio || 2.0),
        clearance: Number(item.attributes?.groundClearance || 0),
        fabricWidth: fabricWidthCm / 100, // Convert CM to M
        fabricType,
        unitPrice: Number(item.unitPrice || 0),
        headerType,
        openingType,
        // Optional overrides from attributes if they exist
        sideLoss: attrs.sideLoss ? Number(attrs.sideLoss) : undefined,
        headerLoss: attrs.headerLoss ? Number(attrs.headerLoss) : undefined,
        bottomLoss: attrs.bottomLoss ? Number(attrs.bottomLoss) : undefined,
      });

      const response = {
        usage: result.usage,
        subtotal: result.subtotal,
        finishedWidth: result.details.finishedWidth,
        finishedHeight: result.details.finishedHeight,
        cutWidth: result.details.cutWidth,
        cutHeight: result.details.cutHeight,
        panelCount: result.details.stripCount, // For fixed width
        warnings: result.details.warning
          ? [{ type: 'WARNING', message: result.details.warning }]
          : [],
      };

      this.calcCache.set(cacheKey, response);
      return response;
    } else if (category === 'WALLPAPER' || category === 'WALLCLOTH') {
      return this.calculateWallpaper(item, width, height, attrs);
    } else {
      return this.calculateStandard(item, width, height);
    }
  }

  /**
   * 根据壁纸墙布类定制化特有的分列裁剪计算引擎执行分支计价体系算法体系流派核心 (Calculate Wallpaper Logic)
   *
   * @param item - 内聚绑定了特定产品的待计价报项模型核心对象源
   * @param width - 由上游传递的实测全宽尺寸强制覆写算计因子
   * @param height - 由上游传递的实测全高尺寸强制覆写算计因子
   * @param attrs - 属于墙纸的特异拓展动态属性强行附加计算参选项源
   * @returns 统一打包处理后的最终总面料用量预期与金额等量小计结算的回传详情标准对象
   */
  private calculateWallpaper(
    item: QuoteItemWithProduct,
    width: number,
    height: number,
    attrs: QuoteItemAttributes
  ) {
    const strategy = new WallpaperStrategy();
    const calcType = item.category === 'WALLCLOTH' ? 'WALLCLOTH' : 'WALLPAPER';

    // Fabric width from attributes or product (CM)
    const specs = item.product?.specs as Record<string, unknown> | null;
    const fabricWidthCm = Number(attrs.fabricWidth || specs?.['fabricWidth'] || 0);

    const result = strategy.calculate({
      width,
      height,
      fabricWidth: fabricWidthCm / 100, // Strategy expects Meters?
      // WallpaperStrategy: `totalStrips = ... / (fabricWidth * 100)`. Yes, expects Meters.
      unitPrice: Number(item.unitPrice || 0),
      calcType,
      // Pass other params from attrs if needed
      rollLength: attrs.rollLength ? Number(attrs.rollLength) : undefined,
    });

    return {
      usage: result.usage,
      subtotal: result.subtotal,
      details: result.details,
    };
  }

  /**
   * 最普适轻量级的普通标品件乘法计价器直通层代理执行算法分配系统 (Calculate Standard Products)
   * 无需介入高耗能用料剪裁损耗分析，完全依托极简的单价变现乘法表×基本数量逻辑体系。
   *
   * @param item - 组装了绑定关系的标准商品报价层实体主表结构行项目
   * @param _width - 透传的通常对于标品而言被忽略掉的占位空槽挂载辅助测量长宽因子表单量
   * @param _height - 透传的对于全品标品而言被直接无视处理空置占位辅助测量长宽因子表单量参数
   * @returns 返回符合底层绝对基本算数基础算力体系要求下的无损失无余缝普适基础合计消耗结构对象
   */
  private calculateStandard(item: QuoteItemWithProduct, _width: number, _height: number) {
    const strategy = new StandardProductStrategy();
    const result = strategy.calculate({
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
    });

    return {
      usage: result.usage,
      subtotal: result.subtotal,
    };
  }
}

/** 向外完全封装后抛出的唯一定制化运算常驻代理中心化单例入口服务调用导流指针点 */
export const QuoteCalculationService = new QuoteCalculationServiceClass();
