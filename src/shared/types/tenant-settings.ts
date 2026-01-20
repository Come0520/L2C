export interface QuoteConfig {
    /**
     * Minimum discount rate allowed without approval (0.0 - 1.0).
     * e.g. 0.90 means 10% discount is the max allowed.
     * Default: 0.90
     */
    minDiscountRate?: number;

    /**
     * Minimum profit margin allowed without approval (0.0 - 1.0).
     * e.g. 0.20 means 20% margin is the floor.
     * Logic: (FinalAmount - Cost) / FinalAmount >= minProfitMargin
     * Default: 0.15
     */
    minProfitMargin?: number;
}

export interface TenantSettings {
    quoteConfig?: QuoteConfig;
    [key: string]: unknown;
}
