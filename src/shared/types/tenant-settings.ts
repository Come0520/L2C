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

/**
 * 多因素认证 (MFA) 配置
 * 控制租户级别的 MFA 策略，包括启用状态、适用角色和认证方式
 */
export interface MfaConfig {
    /** 是否启用 MFA */
    enabled: boolean;
    /** 需要 MFA 的角色列表（如 BOSS, SALES, WORKER） */
    roles?: string[];
    /** MFA 适用角色（管理后台侧的命名） */
    applicableRoles?: string[];
    /** 认证方式：短信验证码 或 TOTP 动态码 */
    method?: 'sms' | 'totp';
}

export interface TenantSettings {
    quoteConfig?: QuoteConfig;
    /** 多因素认证配置 */
    mfa?: MfaConfig;
    [key: string]: unknown;
}
