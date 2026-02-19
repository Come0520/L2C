
import { test, expect } from '@playwright/test';
import { generateTestMobileToken } from '../helpers/mobile-auth';

test.describe('Mobile API - Dashboard Module', () => {
    let salesToken: string;

    test.beforeAll(async () => {
        salesToken = await generateTestMobileToken('test-sales-user', 'SALES');
    });

    test('should fetch sales trends', async ({ request }) => {
        const response = await request.get('/api/mobile/dashboard/trends?range=month', {
            headers: {
                Authorization: `Bearer ${salesToken}`,
            },
        });

        if (response.status() !== 200) {
            console.log(`Debug: dashboard trends returned ${response.status()}`);
            try { console.log(await response.json()); } catch { }
        }

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        // 验证数据结构
        if (data.data.length > 0) {
            expect(data.data[0]).toHaveProperty('date');
            expect(data.data[0]).toHaveProperty('amount');
            expect(data.data[0]).toHaveProperty('count');
        }
    });

    test('should fetch sales funnel', async ({ request }) => {
        const response = await request.get('/api/mobile/dashboard/funnel', {
            headers: {
                Authorization: `Bearer ${salesToken}`,
            },
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('leads');
        expect(data.data).toHaveProperty('opportunities');
        expect(data.data).toHaveProperty('quotes');
        expect(data.data).toHaveProperty('orders');
    });

    test('should reject worker access to dashboard', async ({ request }) => {
        const workerToken = await generateTestMobileToken('test-worker-user', 'WORKER');
        const response = await request.get('/api/mobile/dashboard/trends', {
            headers: {
                Authorization: `Bearer ${workerToken}`,
            },
        });

        // 应该返回 403 Forbidden
        expect(response.status()).toBe(403);
    });
});
