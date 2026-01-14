import { test, expect } from '@playwright/test';

test.describe('Lead Error Recovery', () => {
    test('should handle network interruption during lead creation', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => route.abort('failed'));

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('网络错误，请重试');
    });

    test('should handle server timeout during lead creation', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => {
            setTimeout(() => route.abort('failed'), 30000);
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('请求超时，请重试');
    });

    test('should handle retry mechanism after network error', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        let attemptCount = 0;
        await page.route('**/api/leads/create', route => {
            attemptCount++;
            if (attemptCount === 1) {
                route.abort('failed');
            } else {
                route.continue();
            }
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('网络错误，请重试');

        await page.click('text=重试');

        await expect(page.locator('.toast-success')).toContainText('线索创建成功');
    });

    test('should handle database connection failure', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Database connection failed' }),
            });
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('服务器错误，请稍后重试');
    });

    test('should handle validation error gracefully', async ({ page }) => {
        await page.goto('/leads');

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', '');
        await page.fill('[data-testid="lead-phone-input"]', '');
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('请填写必填字段');
    });

    test('should handle permission denied error', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => {
            route.fulfill({
                status: 403,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Permission denied' }),
            });
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('权限不足');
    });

    test('should handle rate limiting error', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => {
            route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Too many requests' }),
            });
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('请求过于频繁，请稍后再试');
    });

    test('should handle malformed response', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        await page.route('**/api/leads/create', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: 'invalid json',
            });
        });

        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', randomName);
        await page.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('服务器返回数据格式错误');
    });
});
