/**
 * 计算策略基类与通用接口
 * P1-03 修复：消除 any 类型，引入泛型基类实现类型安全
 */

/** 通用计算结果接口 */
export interface CalcResult {
    /** 用量（单位取决于品类：米、卷、平方米等） */
    usage: number;
    /** 小计金额 */
    subtotal: number;
    /** 计算明细 */
    details?: Record<string, unknown>;
}

/** 通用计算参数基础接口 */
export interface CalcParams {
    /** 单价 */
    unitPrice?: number;
    /** 实测宽度 (cm) */
    measuredWidth?: number;
    /** 实测高度 (cm) */
    measuredHeight?: number;
    /** 面料幅宽 (cm) */
    fabricWidth?: number;
    /** 褶皱倍率 */
    foldRatio?: number;
    /** 度量单位 */
    measureUnit?: string;
    /** 花型循环 (cm) */
    patternRepeat?: number;
}

/**
 * 计算策略抽象基类
 * 所有品类具体策略类必须实现 calculate 方法
 */
export abstract class BaseCalcStrategy<
    TParams extends CalcParams = CalcParams,
    TResult extends CalcResult = CalcResult
> {
    abstract calculate(params: TParams): TResult;
}
