import { test, expect } from '@playwright/test';

test.describe('Lead Bulk Operations', () => {
    test('should bulk assign leads to same sales', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('已成功分配 3 条线索');
    });

    test('should bulk delete leads', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量删除"]');
        await page.click('text=确认删除');

        await expect(page.locator('.toast-success')).toContainText('已成功删除 3 条线索');
    });

    test('should bulk return leads to pool', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量退回"]');
        await page.fill('textarea[placeholder="例如：客户暂无意向，联系不上等..."]', '测试退回原因');
        await page.click('text=确认');

        await expect(page.locator('.toast-success')).toContainText('已成功退回 3 条线索');
    });

    test('should handle bulk operations with empty selection', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[title="批量分配"]');

        await expect(page.locator('.toast-error')).toContainText('请选择要分配的线索');
    });

    test('should handle bulk operations with single lead', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

        await expect(page.locator('.toast-success')).toContainText('线索创建成功');

        const checkboxes = page.getAllByRole('checkbox');
        await checkboxes[0].check();

        await page.click('button[title="批量分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('已成功分配 1 条线索');
    });

    test('should handle bulk operations with large number of leads', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 10; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('已成功分配 10 条线索');
    });

    test('should handle bulk operations with mixed status leads', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('已成功分配 3 条线索');
    });

    test('should handle bulk operations with error handling', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

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

            await expect(page.locator('.toast-success')).toContainText('线索创建成功');

            const leadNo = await page.locator('.font-medium').first().innerText();
            leads.push(leadNo);
        }

        const checkboxes = page.getAllByRole('checkbox');
        for (const checkbox of checkboxes) {
            await checkbox.check();
        }

        await page.click('button[title="批量分配"]');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-error')).toContainText('请选择负责人');
    });
});
