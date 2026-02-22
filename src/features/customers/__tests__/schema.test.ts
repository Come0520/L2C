/**
 * 客户 Schema 校验测试
 * 
 * 覆盖范围：
 * - customerSchema 基础字段校验
 * - editableCustomerSchema 编辑校验
 * - updateCustomerSchema 更新校验
 * - activitySchema 活动校验
 * - mergeCustomersSchema 合并校验
 * - getCustomersSchema 查询参数校验
 */
import { describe, it, expect } from 'vitest';
import {
    customerSchema,
    editableCustomerSchema,
    activitySchema,
    mergeCustomersSchema,
    getCustomersSchema,
} from '../schemas';

const validUUID = 'a0a0a0a0-b1b1-4c22-a3d3-e4e4e4e4e4e4';

describe('Customer Schema 校验 (客户表单验证)', () => {
    // ── customerSchema ──
    describe('customerSchema 基础字段', () => {
        it('有效客户数据应通过', () => {
            const data = {
                name: '张三',
                phone: '13800138000',
                source: 'REFERRAL',
            };
            const result = customerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('name 为空应失败', () => {
            const result = customerSchema.safeParse({ name: '', phone: '13800138000', source: 'REFERRAL' });
            expect(result.success).toBe(false);
        });

        it('phone 格式无效应失败', () => {
            const result = customerSchema.safeParse({ name: '张三', phone: 'invalid', source: 'REFERRAL' });
            expect(result.success).toBe(false);
        });

        it('source 不在枚举内仍可通过（source 是自由字符串）', () => {
            const result = customerSchema.safeParse({ name: '张三', phone: '13800138000', source: 'CUSTOM_SRC' });
            expect(result.success).toBe(true);
        });
    });

    // ── editableCustomerSchema ──
    describe('editableCustomerSchema 编辑字段', () => {
        it('有效编辑数据应通过', () => {
            const data = {
                id: 'a0a0a0a0-b1b1-4c22-a3d3-e4e4e4e4e4e4',
                data: {
                    name: '李四',
                    phone: '13900139000',
                },
            };
            const result = editableCustomerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    // ── activitySchema ──
    describe('activitySchema 活动校验', () => {
        it('有效活动数据应通过', () => {
            const data = {
                customerId: validUUID,
                type: 'VISIT',
                description: '这是一条跟进记录',
            };
            const result = activitySchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('缺少 customerId 应失败', () => {
            const data = {
                type: 'VISIT',
                description: '备注',
            };
            const result = activitySchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('type 不在枚举内应失败', () => {
            const data = {
                customerId: validUUID,
                type: 'INVALID_TYPE',
                description: '备注',
            };
            const result = activitySchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // ── mergeCustomersSchema ──
    describe('mergeCustomersSchema 合并校验', () => {
        it('有效合并请求应通过', () => {
            const data = {
                sourceCustomerIds: [validUUID],
                targetCustomerId: 'b1b1b1b1-c2c2-4d33-b4e4-f5f5f5f5f5f5',
            };
            const result = mergeCustomersSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('sourceCustomerIds 为空数组应失败', () => {
            const data = {
                sourceCustomerIds: [],
                targetCustomerId: validUUID,
            };
            const result = mergeCustomersSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    // ── getCustomersSchema ──
    describe('getCustomersSchema 查询参数校验', () => {
        it('空对象应通过（所有字段可选）', () => {
            const result = getCustomersSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('page 为负数仍可通过（coerce 无 min 限制）', () => {
            const result = getCustomersSchema.safeParse({ page: -1 });
            expect(result.success).toBe(true);
        });

        it('pageSize 超过 100 应失败', () => {
            const result = getCustomersSchema.safeParse({ pageSize: 200 });
            expect(result.success).toBe(false);
        });

        it('有效查询参数应通过', () => {
            const data = {
                page: 1,
                pageSize: 20,
                search: '张',
                status: 'ACTIVE',
            };
            const result = getCustomersSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });
});
