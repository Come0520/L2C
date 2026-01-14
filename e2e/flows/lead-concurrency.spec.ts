import { test, expect } from '@playwright/test';

test.describe('Lead Concurrency', () => {
    test('should handle simultaneous lead creation', async ({ page, context }) => {
        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto('/leads');
        await page2.goto('/leads');

        await page1.click('text=录入线索');
        await page1.fill('[data-testid="lead-name-input"]', randomName);
        await page1.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page1.click('.flex > .relative > .peer');
        await page1.click('text=线上');
        await page1.click('.grid > .relative > .peer');
        await page1.click('text=微信');
        await page1.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page1.click('.grid > .grid-cols-2 > .relative > .peer');
        await page1.click('text=高意向');
        await page1.click('[data-testid="submit-lead-btn"]');

        await page2.click('text=录入线索');
        await page2.fill('[data-testid="lead-name-input"]', randomName);
        await page2.fill('[data-testid="lead-phone-input"]', randomPhone);
        await page2.click('.flex > .relative > .peer');
        await page2.click('text=线上');
        await page2.click('.grid > .relative > .peer');
        await page2.click('text=微信');
        await page2.fill('input[placeholder="例如：具体活动名称/推荐人"]', '测试来源');
        await page2.click('.grid > .grid-cols-2 > .relative > .peer');
        await page2.click('text=高意向');
        await page2.click('[data-testid="submit-lead-btn"]');

        await expect(page1.locator('.toast-success')).toContainText('线索创建成功');
        await expect(page2.locator('.toast-error')).toContainText('该手机号已存在线索，请勿重复录入');

        await page1.close();
        await page2.close();
    });

    test('should handle simultaneous lead assignment', async ({ page, context }) => {
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

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        const leadId = leadLink?.split('/').pop() || '';

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`/leads/${leadId}`);
        await page2.goto(`/leads/${leadId}`);

        await page1.click('button[title="分配"]');
        await page1.click('.absolute > .peer');
        await page1.click('text=销售1');
        await page1.click('text=确认分配');

        await page2.click('button[title="分配"]');
        await page2.click('.absolute > .peer');
        await page2.click('text=销售2');
        await page2.click('text=确认分配');

        await expect(page1.locator('.toast-success')).toContainText('线索已分配');
        await expect(page2.locator('.toast-success')).toContainText('线索已分配');

        await page1.close();
        await page2.close();
    });

    test('should handle simultaneous lead updates', async ({ page, context }) => {
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

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        const leadId = leadLink?.split('/').pop() || '';

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`/leads/${leadId}`);
        await page2.goto(`/leads/${leadId}`);

        await page1.click('button[title="编辑"]');
        await page1.fill('input[placeholder="客户姓名"]', '更新后的客户名1');
        await page1.click('text=保存');

        await page2.click('button[title="编辑"]');
        await page2.fill('input[placeholder="客户姓名"]', '更新后的客户名2');
        await page2.click('text=保存');

        await expect(page1.locator('.toast-success')).toContainText('线索更新成功');
        await expect(page2.locator('.toast-success')).toContainText('线索更新成功');

        await page1.close();
        await page2.close();
    });

    test('should handle simultaneous followup additions', async ({ page, context }) => {
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

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        const leadId = leadLink?.split('/').pop() || '';

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`/leads/${leadId}`);
        await page2.goto(`/leads/${leadId}`);

        await page1.click('text=添加跟进');
        await page1.fill('textarea[placeholder="请输入跟进内容..."]', '跟进记录1');
        await page1.click('.relative > .peer');
        await page1.click('text=意向明确');
        await page1.click('text=保存');

        await page2.click('text=添加跟进');
        await page2.fill('textarea[placeholder="请输入跟进内容..."]', '跟进记录2');
        await page2.click('.relative > .peer');
        await page2.click('text=意向明确');
        await page2.click('text=保存');

        await expect(page1.locator('.toast-success')).toContainText('跟进记录已添加');
        await expect(page2.locator('.toast-success')).toContainText('跟进记录已添加');

        await page1.close();
        await page2.close();
    });

    test('should handle simultaneous lead conversions', async ({ page, context }) => {
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

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        const leadId = leadLink?.split('/').pop() || '';

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`/leads/${leadId}`);
        await page2.goto(`/leads/${leadId}`);

        await page1.click('text=转为客户');
        await page2.click('text=转为客户');

        await expect(page1.locator('.toast-success')).toContainText('已创建新客户并成交');
        await expect(page2.locator('.toast-success')).toContainText('线索已成交');

        await page1.close();
        await page2.close();
    });
});
