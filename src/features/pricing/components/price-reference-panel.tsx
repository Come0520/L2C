'use client';

import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { getPricingHints } from '@/features/pricing/actions/pricing-hints';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Separator } from '@/shared/ui/separator';

/** 组件的对外属性定义 */
interface PriceReferencePanelProps {
  /** 目标产品的全局唯一标识 (和 sku 至少其一) */
  productId?: string;
  /** 目标产品的 SKU 代码 (和 productId 至少其一) */
  sku?: string;
  /**
   * 拉取历史订单及报价数据的时间范围 (单位：天)
   * @default 90
   */
  periodDays?: number;
  /** 自定义外部样式的类名注入 */
  className?: string;
}

/**
 * 定价参考面板依赖的完整数据结构
 *
 * @description 与后端 getPricingHintsAction 接口返回的 data 字段严格对齐。
 * 此处通过明确显式提供类型定义字典，降低使用任意类型及 infer 中带来的 TypeScript 类型逃逸问题。
 */
export interface PricingData {
  /** 产品的基础数据基准 */
  product: {
    /** 产品的展示友好名称 */
    name: string;
    /** 产品编码 */
    sku: string;
    /** 采购或落地的实付成本，浮点数值计算基准 */
    cost: number;
    /** 销售底价安全红线 */
    floorPrice: number;
    /** 系统推荐的标准化出货指导标价 */
    guidancePrice: number;
    /** 产品规格结算基本单位，不设置则默认 "件" */
    unit?: string;
  };
  /** 围绕统计周期的全局销售及试盘记录缩影 */
  stats: {
    /** 回溯的最近天数 */
    periodDays: number;
    /** 有效成交的订单笔数总和 */
    soldCount: number;
    /** 纯产品成交消耗的数量总计 */
    totalVolume: number;
    /** 周期内产品的历史加权均价，保留两位小数 */
    avgSoldPrice: string;
    /** 周期内发生过成交的最低特价，保留两位小数 */
    minSoldPrice: string;
    /** 周期内发生过的主力超额最高价，保留两位小数 */
    maxSoldPrice: string;
    /** 最近一笔实际敲定交割的一口价 */
    lastSoldPrice: string;
    /** 历史上提供给客户正式明细报价的统计笔数 */
    quoteCount: number;
    /** 历史报价中本单品的平均意向价格 */
    avgQuotePrice: string;
  };
  /** 前端所需的核心定价辅助决策衍生因子 */
  analysis: {
    /**
     * 该数值作为面板主导的最优销售提报价建议：
     * 如果近期有售卖且未跌破底价则采用近期的历史均价；
     * 如果毫无售卖过往且不破红线，则默认推介标准系统指导价。
     */
    suggestedPrice: string;
    /**
     * @property margin.guidance 依据指导价得出的基石毛利 (百分比字面量)
     * @property margin.actual 近期历史均价沉淀出的真实出货毛利
     * @property margin.estimated 最终 suggestedPrice 推断出的目标毛利空间
     */
    margin: {
      guidance: string;
      actual: string;
      estimated: string;
    };
    /**
     * @property competitiveness
     * 如果销售实际出货通常由于竞争压力让利太多 (均价<指导)，则显示 'BELOW_GUIDE'；否则为 'ABOVE_GUIDE'
     */
    competitiveness: string;
  };
  /** 按月份为刻度横轴，统计近半年的产品均价起伏，用于迷你趋势图绘制 */
  trends: Array<{
    /** 月份短文本 (如 2024-03) */
    month: string;
    /** 该月成交明细均价汇总 */
    avgPrice: string;
  }>;
  /** 在整个所属的大分类范畴中，横向对比其档次及普遍售价分布 */
  categoryAnalysis: {
    /** 映射产品的 Category 类目 */
    category: string;
    /** 该类目下所有产品的标准指导价最小值 */
    minPrice: string;
    /** 该类目下所有产品的标准指导价最大值 */
    maxPrice: string;
    /** 该类目系统级别推荐出的行业级均价 */
    avgPrice: string;
    /** 本租户系统下属于该同一类目池塘的活跃商品数目总和 */
    productCount: number;
  };
}

/**
 * 实时定价参考与决策辅助面板组件 (Price Reference Panel)
 *
 * @description
 * 在报价开单等 B端交易关键环节内，展示特定产品或 SKU 的多维度商业机要参考聚合。
 *
 * 功能点如下：
 * 1. 【中央数据墙】动态建议最优成交单价，直观且具有防破底线保护机制；
 * 2. 【对比指示灯】极值追踪 (最高价/最低价/均价对比)，高亮提示低于指导与否的标签；
 * 3. 【条形柱图】可视化本品近 6 各月的历史变相成交价格涨跌走势；
 * 4. 【类目均值】以自身作为标杆，提供大板块横向的水位参照依据；
 * 5. 【成本穿透预警】提供直接计算的实际/预期毛利率分析，且若预估被倒挂打破成本均进行全量标红警示。
 *
 * @example
 * ```tsx
 * // 基于某个选择好 SKU 码的产品弹层里展现：
 * <PriceReferencePanel
 *    sku="CURTAIN-A001"
 *    periodDays={180}
 *    className="my-4 md:w-1/2"
 * />
 * ```
 *
 * @param {PriceReferencePanelProps} props - 必填属性与选填周期策略
 * @returns {JSX.Element} 带有动态请求状态的复杂排版定价参考 Card
 */
export function PriceReferencePanel({
  productId,
  sku,
  periodDays,
  className,
}: PriceReferencePanelProps) {
  /** 维护调用 Server action 进行网络预拉取的 Loading 状志 */
  const [loading, setLoading] = useState(false);
  /** 最终聚合查询返回的商业定价分析快照报表 */
  const [data, setData] = useState<PricingData | null>(null);
  /** 查询服务不可用或该物品本身无记录时显示的消息字符串 */
  const [error, setError] = useState<string | null>(null);

  /**
   * 自动同步与重放控制副作用
   * @description 一旦所绑定的产品特征 ID（productId或sku标识）有任何切换，都会自发执行重新请求
   */
  useEffect(() => {
    if (!productId && !sku) return;

    /** 异步封装拉取聚合报表，并映射进入前台 UI 字典格式 */
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPricingHints({
          productId,
          sku,
          periodDays: periodDays ?? 90,
        });

        // 取出服务端封皮验证通过的数据内芯
        if (res?.data?.success) {
          setData(res.data.data as PricingData);
        } else {
          setError('无法获取定价建议');
        }
      } catch (err) {
        logger.error(err);
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, sku, periodDays]);

  /** 如果父组件尚未准备好输入参数时，阻断加载展示空骨架提示区 */
  if (!productId && !sku) {
    return (
      <Card className={cn('bg-muted/30 border-dashed', className)}>
        <CardContent className="text-muted-foreground p-6 text-center text-sm">
          请选择商品以查看定价建议
        </CardContent>
      </Card>
    );
  }

  /** 如果依然在请求进行拉取阻塞中，展出等候组件动画占位符 */
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex h-[200px] items-center justify-center p-6">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  /** 如果存在请求驳回以及查询出错问题展示报错警告信息 */
  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="text-muted-foreground p-6 text-center text-sm">
          {error || '暂无数据'}
        </CardContent>
      </Card>
    );
  }

  // 释放字典中的有效节点块
  const { product, stats, analysis, trends, categoryAnalysis } = data;

  /**
   * 判断底线红线标志：
   * 1. 预估推荐价连买入成本价都没达到，这往往意味着极端亏损。
   * 2. 预估推介价没有达到企业管控下达给全员坚守的强制底价红线。
   */
  const isBelowCost = Number(analysis.suggestedPrice) < Number(product.cost);
  const isBelowFloor = Number(analysis.suggestedPrice) < Number(product.floorPrice);

  return (
    <Card className={cn('animate-in fade-in w-full shadow-sm duration-500', className)}>
      {/* 头部展示栏目，左侧标签，右侧可自适应爆出极危跌破警示徽章 */}
      <CardHeader className="bg-muted/10 border-b pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="text-primary h-4 w-4" />
            定价参考
          </CardTitle>
          <Badge variant={isBelowFloor ? 'destructive' : 'secondary'} className="text-xs">
            {isBelowFloor ? '低于底价' : '建议区间'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/*
         * 模块 1：核心提报价格（C位推荐展示区）
         * 呈现一个带有醒目色彩数字展示的大体字标价。
         * 底部辅以原指导价说明作为锚点支撑。
         */}
        <div className="bg-primary/5 border-primary/10 rounded-lg border py-2 text-center">
          <span className="text-muted-foreground mb-1 block text-xs">建议成交价</span>
          <div className="text-primary text-2xl font-bold">
            ¥{Number(analysis.suggestedPrice).toLocaleString()}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-2 text-xs">
            <span>指导价 ¥{product.guidancePrice}</span>
            {Number(analysis.suggestedPrice) < product.guidancePrice ? (
              <span className="flex items-center rounded bg-red-50 px-1 text-[10px] text-red-500">
                <TrendingDown className="mr-0.5 h-3 w-3" /> 低于指导
              </span>
            ) : (
              <span className="flex items-center rounded bg-green-50 px-1 text-[10px] text-green-600">
                <TrendingUp className="mr-0.5 h-3 w-3" /> 高于指导
              </span>
            )}
          </div>
        </div>

        {/*
         * 模块 2：实际数据复盘矩阵
         * 用三个横向子区块横平竖直呈现极值波荡（最高：最低：历史均值平抑）供比较参考。
         */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/40 rounded p-2">
            <span className="text-muted-foreground block text-xs">历史最低</span>
            <span className="mt-0.5 block font-semibold">¥{stats.minSoldPrice}</span>
          </div>
          <div className="bg-muted/40 rounded p-2">
            <span className="text-muted-foreground block text-xs">历史最高</span>
            <span className="mt-0.5 block font-semibold">¥{stats.maxSoldPrice}</span>
          </div>
          <div className="bg-muted/40 rounded p-2">
            <span className="text-muted-foreground block text-xs">平均成交</span>
            <span className="mt-0.5 block font-semibold">¥{stats.avgSoldPrice}</span>
          </div>
        </div>

        <Separator />

        {/*
         * 模块 3：半年度极简直方趋势图展示 (Sparkline 条形图形式)
         * 只提取前 6 个月的最高价为 100% 行高标尺，依次勾勒每一根图柱大小
         */}
        {trends && trends.length > 0 && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-medium">近6期价格趋势</span>
            <div className="flex h-12 items-end justify-between gap-1 px-1">
              {trends.map((t, i) => {
                const maxPrice = Math.max(...trends.map((x) => Number(x.avgPrice)), 1);
                const height = `${(Number(t.avgPrice) / maxPrice) * 100}%`;
                return (
                  <div key={i} className="group relative flex flex-1 flex-col items-center">
                    <div
                      className="bg-primary/20 group-hover:bg-primary/40 w-full rounded-t-sm transition-colors"
                      style={{ height: height || '10%' }}
                    />
                    <span className="text-muted-foreground mt-1 scale-90 text-[10px]">
                      {t.month.slice(-2)}月
                    </span>
                    <div className="pointer-events-none absolute -top-6 z-10 rounded bg-black px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                      ¥{t.avgPrice}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/*
         * 模块 4：同类对齐雷达阵列
         * 展示同门其它产品的行业价范围参考。
         */}
        {categoryAnalysis && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs font-medium">
                同品类参考水位 ({categoryAnalysis.productCount}款)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/30 rounded p-1.5">
                  <span className="text-muted-foreground mb-0.5 block">最低</span>
                  <span className="font-medium">¥{categoryAnalysis.minPrice}</span>
                </div>
                <div className="bg-muted/30 rounded p-1.5">
                  <span className="text-muted-foreground mb-0.5 block">平均</span>
                  <span className="text-primary font-medium">¥{categoryAnalysis.avgPrice}</span>
                </div>
                <div className="bg-muted/30 rounded p-1.5">
                  <span className="text-muted-foreground mb-0.5 block">最高</span>
                  <span className="font-medium">¥{categoryAnalysis.maxPrice}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/*
         * 模块 5：销售端隐性管控展示分析面板
         * 专门用于给具备核价权限的高级制核人员做毛利润兜底。
         * 如果检测得历史的或预估的推论毛利率在危险基准线 (20％) 之内，文字直接泛红示警。
         */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">销售底价</span>
            <span className="font-medium">¥{product.floorPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">近90天销量</span>
            <span className="font-medium">
              {stats.totalVolume} {product.unit || '件'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">历史毛利率</span>
            <span
              className={cn(
                'font-medium',
                Number(analysis.margin.actual) < 20 ? 'text-red-500' : 'text-green-600'
              )}
            >
              {analysis.margin.actual}%
            </span>
          </div>
          {analysis.margin.estimated && (
            <div className="bg-primary/5 -mx-1.5 flex items-center justify-between rounded p-1.5">
              <span className="font-medium">基于建议价预估毛利</span>
              <span
                className={cn(
                  'text-sm font-bold',
                  Number(analysis.margin.estimated) < 20 ? 'text-red-500' : 'text-green-600'
                )}
              >
                {analysis.margin.estimated}%
              </span>
            </div>
          )}
        </div>

        {/*
         * 模块 6：底价突破最后通牒示警！被拦截或不理智报给比成本还低的金额强制触发红黑提示框。
         */}
        {isBelowCost && (
          <div className="flex items-start gap-2 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>警告：当前建议价格低于成本价，请谨慎报价。</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
