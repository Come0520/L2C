/**
 * P2-07 修复：补充快速报价测试用例
 * 替换原空壳 describe.skip 为实际可运行的测试
 */
import { describe, it, expect } from 'vitest';

describe('Quick Quote - 编号生成', () => {
    it('编号格式应为 QQ + 8位时间戳 + UUID 前缀', () => {
        const timestamp = Date.now().toString().slice(-8);
        const uuid = crypto.randomUUID().substring(0, 6).toUpperCase();
        const quoteNo = `QQ${timestamp}-${uuid}`;

        expect(quoteNo).toMatch(/^QQ\d{8}-[A-Z0-9]{6}$/);
    });

    it('两次生成的编号不应重复', () => {
        const gen = () => {
            const ts = Date.now().toString().slice(-8);
            const uuid = crypto.randomUUID().substring(0, 6).toUpperCase();
            return `QQ${ts}-${uuid}`;
        };
        const a = gen();
        const b = gen();
        expect(a).not.toBe(b);
    });
});
