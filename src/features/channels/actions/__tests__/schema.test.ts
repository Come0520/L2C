/**
 * 渠道 Schema 校验测试
 * 
 * 覆盖范围：
 * - channelSchema 基础字段校验
 * - 手机号格式校验
 * - 必填字段验证
 * - channelContactSchema 校验
 * - 阶梯费率校验
 * - channelCategorySchema 校验
 */
import { describe, it, expect } from 'vitest';
import { channelSchema, channelContactSchema, channelCategorySchema } from '../schema';

// 完整有效数据模板
const validChannel = {
    name: '测试渠道A',
    channelNo: 'CH-001',
    channelType: 'DESIGNER' as const,
    contactName: '张三',
    phone: '13800138000',
    commissionRate: 10,
    cooperationMode: 'COMMISSION' as const,
    settlementType: 'MONTHLY' as const,
    status: 'ACTIVE' as const,
};

describe('Channel Schema 校验 (渠道表单验证)', () => {
    // ── 基础字段校验 ──
    describe('基础字段校验', () => {
        it('有效数据应通过校验', () => {
            const result = channelSchema.safeParse(validChannel);
            expect(result.success).toBe(true);
        });

        it('name 为空字符串时应校验失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, name: '' });
            expect(result.success).toBe(false);
        });

        it('name 超过 100 字符时应校验失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, name: 'a'.repeat(101) });
            expect(result.success).toBe(false);
        });

        it('channelType 不在枚举范围内时应校验失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, channelType: 'INVALID_TYPE' });
            expect(result.success).toBe(false);
        });

        it('channelType=OTHER 但未提供 customChannelType 时应失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, channelType: 'OTHER' });
            expect(result.success).toBe(false);
        });

        it('channelType=OTHER 且提供 customChannelType 时应通过', () => {
            const result = channelSchema.safeParse({ ...validChannel, channelType: 'OTHER', customChannelType: '自定义类型' });
            expect(result.success).toBe(true);
        });
    });

    // ── 手机号格式 ──
    describe('手机号格式校验', () => {
        it('有效手机号应通过', () => {
            const result = channelSchema.safeParse({ ...validChannel, phone: '13900139000' });
            expect(result.success).toBe(true);
        });

        it('无效手机号格式应失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, phone: '123' });
            expect(result.success).toBe(false);
        });

        it('非1开头的11位号码应失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, phone: '23800138000' });
            expect(result.success).toBe(false);
        });
    });

    // ── 佣金配置 ──
    describe('佣金配置校验', () => {
        it('佣金率超过100应失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, commissionRate: 150 });
            expect(result.success).toBe(false);
        });

        it('佣金率为负数应失败', () => {
            const result = channelSchema.safeParse({ ...validChannel, commissionRate: -5 });
            expect(result.success).toBe(false);
        });

        it('阶梯费率区间重叠应失败', () => {
            const overlapping = [
                { minAmount: 0, maxAmount: 100, rate: 5 },
                { minAmount: 50, maxAmount: 200, rate: 10 },
            ];
            const result = channelSchema.safeParse({ ...validChannel, commissionType: 'TIERED', tieredRates: overlapping });
            expect(result.success).toBe(false);
        });

        it('有效阶梯费率应通过', () => {
            const valid = [
                { minAmount: 0, maxAmount: 100, rate: 5 },
                { minAmount: 100, maxAmount: 500, rate: 10 },
            ];
            const result = channelSchema.safeParse({ ...validChannel, commissionType: 'TIERED', tieredRates: valid });
            expect(result.success).toBe(true);
        });
    });

    // ── 联系人 Schema ──
    describe('联系人 Schema 校验', () => {
        it('有效联系人数据应通过', () => {
            const data = {
                channelId: 'a0a0a0a0-b1b1-4c22-a3d3-e4e4e4e4e4e4',
                name: '张三',
                phone: '13800138000',
            };
            const result = channelContactSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('联系人 name 为空时应校验失败', () => {
            const data = {
                channelId: 'a0a0a0a0-b1b1-4c22-a3d3-e4e4e4e4e4e4',
                name: '',
                phone: '13800138000',
            };
            const result = channelContactSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('联系人缺少 channelId 应校验失败', () => {
            const data = { name: '张三', phone: '13800138000' };
            const result = channelContactSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // ── 渠道类型 Schema ──
    describe('渠道类型 Schema 校验', () => {
        it('有效类型数据应通过', () => {
            const result = channelCategorySchema.safeParse({ name: '在线推广', code: 'ONLINE_PROMO' });
            expect(result.success).toBe(true);
        });

        it('缺少 code 应失败', () => {
            const result = channelCategorySchema.safeParse({ name: '在线推广' });
            expect(result.success).toBe(false);
        });
    });
});
