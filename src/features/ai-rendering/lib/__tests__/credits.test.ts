import { describe, expect, it } from 'vitest';
import { calculateCreditsCost, CREDIT_COSTS } from '../credits';

/**
 * TDD 测试 — AI 渲染积分消耗计算
 * 验证各场景下积分计算是否符合产品规则
 */
describe('calculateCreditsCost 积分消耗计算', () => {
    describe('基础消耗规则', () => {
        it('从云展厅选面料、首次出图：消耗 2 点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'showroom', retryCount: 0 });
            expect(cost).toBe(2);
        });

        it('自定义面料上传、首次出图：消耗 3 点（基础 2 + 上传 +1）', () => {
            const cost = calculateCreditsCost({ fabricSource: 'upload', retryCount: 0 });
            expect(cost).toBe(3);
        });
    });

    describe('重试规则', () => {
        it('第 1 次重试（retryCount=1）：免费，消耗 0 点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'showroom', retryCount: 1 });
            expect(cost).toBe(0);
        });

        it('第 1 次重试使用上传面料：仍然免费，消耗 0 点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'upload', retryCount: 1 });
            expect(cost).toBe(0);
        });

        it('第 2 次重试（retryCount=2）：恢复正常扣点，云展厅 2 点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'showroom', retryCount: 2 });
            expect(cost).toBe(2);
        });

        it('第 2 次重试使用上传面料：恢复正常扣点，3 点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'upload', retryCount: 2 });
            expect(cost).toBe(3);
        });

        it('第 3 次及以上重试：正常扣点', () => {
            const cost = calculateCreditsCost({ fabricSource: 'showroom', retryCount: 5 });
            expect(cost).toBe(2);
        });
    });

    describe('CREDIT_COSTS 常量', () => {
        it('应导出 BASE 基础消耗', () => {
            expect(CREDIT_COSTS.BASE).toBe(2);
        });

        it('应导出 UPLOAD_SURCHARGE 上传附加费', () => {
            expect(CREDIT_COSTS.UPLOAD_SURCHARGE).toBe(1);
        });

        it('应导出 HIGH_RES 高清出图费（Phase 3 预留）', () => {
            expect(CREDIT_COSTS.HIGH_RES).toBe(5);
        });
    });
});
