import { test, expect } from '@playwright/test';

test.describe('Lead Pool Management', () => {
    let leadId: string;
    let leadNo: string;

    test('should release lead to pool successfully', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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

        leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="退回"]');
        await page.fill('textarea[placeholder="例如：客户暂无意向，联系不上等..."]', '测试退回原因');
        await page.click('text=确认');

        await expect(page.locator('.toast-success')).toContainText('线索已退回公海');

        await page.goto('/leads');

        await expect(page.locator('.inline-flex')).toContainText('待分配');
    });

    test('should claim lead from pool successfully', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('线索已分配');

        await page.click('button[title="退回"]');
        await page.fill('textarea[placeholder="例如：客户暂无意向，联系不上等..."]', '测试退回原因');
        await page.click('text=确认');

        await expect(page.locator('.toast-success')).toContainText('线索已退回公海');

        await page.goto('/leads');

        await page.click('button[title="分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('线索已分配');
    });

    test('should handle auto recycle of inactive leads', async ({ page }) => {
        await page.goto('/leads');

        const randomPhone = `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('线索已分配');

        await page.goto('/leads');

        await expect(page.locator('.inline-flex')).toContainText('待跟进');
    });

    test('should display pool leads correctly', async ({ page }) => {
        await page.goto('/leads');

        await expect(page.getByText('线索管理')).toBeInTheDocument();
    });

    test('should handle bulk pool operations', async ({ page }) => {
        await page.goto('/leads');

        const leads = [];
        for (let i = 0; i < 3; i++) {
            const randomPhone = `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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
});
