/**
 * AI 积分账单引擎 (Credits Service)
 *
 * 职责：
 * - 管理租户的 AI 渲染积分账户
 * - 所有积分变动通过 aiCreditTransactions 流水表记录
 * - 余额从最后一笔流水读取（无需单独账户表）
 * - 扣减操作在数据库事务中进行，保障并发安全
 *
 * 积分类型 (type)：
 * - 'PLEDGE'  : 月初/订阅时平台配额发放
 * - 'ADDON'   : 租户主动购买增值积分包
 * - 'CONSUME' : AI 出图消费扣减
 * - 'REFUND'  : 渲染失败退回
 */
import { db } from '@/shared/api/db';
import { aiCreditTransactions } from '@/shared/api/schema/billing';
import { desc, eq } from 'drizzle-orm';

// ==================== 类型定义 ====================

/** 积分交易类型 */
export type CreditTransactionType = 'PLEDGE' | 'ADDON' | 'CONSUME' | 'REFUND';

/** 积分交易结果 */
export interface CreditTransactionResult {
    /** 交易记录 ID */
    id: string;
    /** 变动后的账户余额 */
    balance: number;
}

// ==================== 内部工具 ====================

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * 在事务上下文中查询租户当前最新余额。
 * 若无流水记录则视为 0。
 */
async function getCurrentBalanceInTx(tx: DbOrTx, tenantId: string): Promise<number> {
    const last = await (tx as typeof db).query.aiCreditTransactions.findFirst({
        where: eq(aiCreditTransactions.tenantId, tenantId),
        orderBy: [desc(aiCreditTransactions.createdAt)],
        columns: { balance: true },
    });
    return last?.balance ?? 0;
}

// ==================== 公开服务方法 ====================

export const CreditsService = {
    /**
     * 查询租户当前积分余额（只读）。
     */
    async getCurrentBalance(tenantId: string): Promise<number> {
        const last = await db.query.aiCreditTransactions.findFirst({
            where: eq(aiCreditTransactions.tenantId, tenantId),
            orderBy: [desc(aiCreditTransactions.createdAt)],
            columns: { balance: true },
        });
        return last?.balance ?? 0;
    },

    /**
     * 扣减积分（CONSUME）
     *
     * 使用数据库事务保障并发安全：
     * 1. 加锁读取最后一笔余额
     * 2. 判断余额是否充足（Hard Limit）
     * 3. 插入扣减流水
     *
     * @throws InsufficientCreditsError 余额不足时抛出
     */
    async deductCredits(
        tenantId: string,
        amount: number,
        reason: string
    ): Promise<CreditTransactionResult> {
        return db.transaction(async (tx) => {
            const currentBalance = await getCurrentBalanceInTx(tx, tenantId);

            if (currentBalance < amount) {
                throw new InsufficientCreditsError(currentBalance, amount);
            }

            const newBalance = currentBalance - amount;
            const [record] = await tx
                .insert(aiCreditTransactions)
                .values({
                    tenantId,
                    type: 'CONSUME',
                    amount: -amount,
                    balance: newBalance,
                    reason,
                })
                .returning({ id: aiCreditTransactions.id, balance: aiCreditTransactions.balance });

            return record;
        });
    },

    /**
     * 增加积分（PLEDGE / ADDON）
     *
     * 用于月初配额发放和购买增值包时充值。
     */
    async addCredits(
        tenantId: string,
        amount: number,
        type: Extract<CreditTransactionType, 'PLEDGE' | 'ADDON'>,
        reason: string
    ): Promise<CreditTransactionResult> {
        return db.transaction(async (tx) => {
            const currentBalance = await getCurrentBalanceInTx(tx, tenantId);
            const newBalance = currentBalance + amount;

            const [record] = await tx
                .insert(aiCreditTransactions)
                .values({
                    tenantId,
                    type,
                    amount,
                    balance: newBalance,
                    reason,
                })
                .returning({ id: aiCreditTransactions.id, balance: aiCreditTransactions.balance });

            return record;
        });
    },

    /**
     * 退还积分（REFUND）
     *
     * 用于渲染失败、超时等情况退回积分。
     */
    async refundCredits(
        tenantId: string,
        amount: number,
        reason: string
    ): Promise<CreditTransactionResult> {
        return db.transaction(async (tx) => {
            const currentBalance = await getCurrentBalanceInTx(tx, tenantId);
            const newBalance = currentBalance + amount;

            const [record] = await tx
                .insert(aiCreditTransactions)
                .values({
                    tenantId,
                    type: 'REFUND',
                    amount,
                    balance: newBalance,
                    reason,
                })
                .returning({ id: aiCreditTransactions.id, balance: aiCreditTransactions.balance });

            return record;
        });
    },
};

// ==================== 错误类 ====================

/** 积分余额不足异常 */
export class InsufficientCreditsError extends Error {
    readonly current: number;
    readonly required: number;

    constructor(current: number, required: number) {
        super(`积分余额不足：当前余额 ${current} 点，操作需要 ${required} 点，请充值或联系平台管理员`);
        this.name = 'InsufficientCreditsError';
        this.current = current;
        this.required = required;
    }
}
