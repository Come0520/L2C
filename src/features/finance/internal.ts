/**
 * 财务模块内部工具函数 (Internal Utility Functions)
 * 主要用于财务模块内部跨文件的逻辑复用，且不涉及复杂的业务校验。
 */

export const financeInternal = {
    /**
     * 计算交易手续费 (Transaction Fee Calculation)
     * @param amount 交易金额
     * @param method 支付方式: WECHAT, ALIPAY, BANK_TRANSFER, CASH, POS
     * @returns 手续费金额
     */
    calculateFees: (amount: number, method: string): number => {
        const rates: Record<string, number> = {
            WECHAT: 0.006, // 0.6%
            ALIPAY: 0.006, // 0.6%
            BANK_TRANSFER: 0,
            CASH: 0,
            POS: 0.0035,   // 0.35%
        };

        const rate = rates[method.toUpperCase()] ?? 0;
        // 使用 toFixed(2) 确保金额精度符合财务要求
        return Number((amount * rate).toFixed(2));
    },
};
