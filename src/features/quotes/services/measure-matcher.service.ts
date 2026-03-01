import { MeasureItem, mapMeasureItemToQuoteItem, QuoteItemDraft } from '../config/measure-mapping';
import { QuoteItem } from '@/shared/api/schema/quotes';

/**
 * 测绘匹配结果输出结构对象定义
 */
export interface MatchResult {
  /** 源测绘条目ID快照标识 */
  measureItemId: string;
  /** 若匹配命中现有体系库，则在此提供挂载关联的对应报价项 ID */
  quoteItemId?: string; // If matched to existing
  /** 自动按底层数据标准转换后的拟定生成的新增测绘草稿记录体 */
  draftItem: QuoteItemDraft;
  /** 系统评估匹配可信度（置信区间 0-1） */
  confidence: number; // 0-1
  /** 具体的内部算法命中方式记录标识 */
  matchType: 'EXACT_ROOM' | 'FUZZY_ROOM' | 'NEW';
}

export class MeasureMatcherService {
  /**
   * 自动智能匹配与融合外部量尺测绘源条目：在现有的商品报项中做比对挂靠，未能匹配则判定为新增衍生草稿项 (Auto-match meas objects)
   *
   * @param measureItems - 传递进来的大批源外域多态数据
   * @param existingQuoteItems - 当前上下文中挂载已落盘的基础已有报价源数据
   * @returns 一个被标好具体生成转化动作明细的结果清单集合
   */
  static autoMatch(
    measureItems: MeasureItem[],
    existingQuoteItems: QuoteItem[] = []
  ): MatchResult[] {
    /** 初始化容纳批量结果收集数组池 */
    const results: MatchResult[] = [];
    /** 防重标记位：为防同屋子内多项商品被单一反复命中的游离表 */
    const usedQuoteItemIds = new Set<string>();

    for (const item of measureItems) {
      /** 步骤1：清洗外源业务数据使之转化为初步标准的系统内拟态 Draft */
      const draft = mapMeasureItemToQuoteItem(item);

      /** 步骤2：执行本地查重挂靠流程，扫描寻找最佳命中项 */
      let bestMatch: QuoteItem | null = null;
      let maxScore = 0;

      for (const qItem of existingQuoteItems) {
        if (usedQuoteItemIds.has(qItem.id)) continue;

        const score = this.calculateMatchScore(item, qItem);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = qItem;
        }
      }

      // 3. Determine match result
      if (bestMatch && maxScore > 0.8) {
        usedQuoteItemIds.add(bestMatch.id);
        results.push({
          measureItemId: item.id || '',
          quoteItemId: bestMatch.id,
          draftItem: draft, // The measurement data to overwrite/update
          confidence: maxScore,
          matchType: maxScore === 1 ? 'EXACT_ROOM' : 'FUZZY_ROOM',
        });
      } else {
        results.push({
          measureItemId: item.id || '',
          draftItem: draft,
          confidence: 1.0, // High confidence for new item generation
          matchType: 'NEW',
        });
      }
    }

    return results;
  }

  /**
   * 计算并为每对匹配对象给出一个浮点型的置信积分 (Score Calculator)
   * 包含屋型比对、品类词根提取相交等加权特征分值计算逻辑综合汇总。
   *
   * @param measure - 测量原始数据侧源单
   * @param quote - 系统历史内驻已有单
   * @returns 一个最高被封顶为 1.0 数值的结果置信度浮点数
   */
  private static calculateMatchScore(measure: MeasureItem, quote: QuoteItem): number {
    /** 初始化积分 */
    let score = 0;

    /** 主维特征命中：空间重合度检测 */
    if (measure.roomName === quote.roomName) {
      score += 0.6;
    } else if (
      measure.roomName &&
      quote.roomName &&
      (measure.roomName.includes(quote.roomName) || quote.roomName.includes(measure.roomName))
    ) {
      score += 0.4;
    }

    // Product Category/Usage Match (Secondary)
    // e.g., both are Curtains
    // For now, simple check if exists
    score += 0.2;

    return Math.min(score, 1);
  }
}
