export interface QuoteConfig {
    /**
     * 允许的最大折扣率（无审批情况下），范围 0.0 - 1.0。
     * 例如 0.90 表示允许的最大折扣为 10% (即按 90% 销售)。
     * 默认值: 0.90
     */
    minDiscountRate?: number;

    /**
     * 允许的最低利润率（无审批情况下），范围 0.0 - 1.0。
     * 例如 0.20 表示 20% 是利润底线。
     * 计算逻辑: (成交总额 - 成本) / 成交总额 >= minProfitMargin
     * 默认值: 0.15
     */
    minProfitMargin?: number;
}

export interface TenantSettings {
    quoteConfig?: QuoteConfig;
    [key: string]: unknown;
}
