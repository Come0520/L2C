import { test, expect } from '@playwright/test';

test.describe('Lead Lifecycle', () => {
    let leadId: string;
    let leadNo: string;

    test('should complete full lead lifecycle: create -> assign -> followup -> quote -> convert', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-success')).toContainText('线索创建成功');

        leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="分配"]');
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        await page.click('text=确认分配');

        await expect(page.locator('.toast-success')).toContainText('线索已分配');
        await expect(page.locator('.inline-flex')).toContainText('待跟进');

        await page.click('button[title="开始跟进"]');

        await expect(page.locator('.toast-success')).toContainText('已开始跟进');
        await expect(page.locator('.inline-flex')).toContainText('跟进中');

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.click('text=快速报价');
        await page.fill('input[placeholder="请输入报价名称"]', '测试报价');
        await page.click('.relative > .peer');
        await page.click('text=窗帘');
        await page.click('text=下一步');
        await page.fill('input[placeholder="产品名称"]', '测试窗帘');
        await page.fill('input[placeholder="宽度 (mm)"]', '2000');
        await page.fill('input[placeholder="高度 (mm)"]', '2500');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('报价创建成功');

        await page.goto(`/leads/${leadId}`);

        await expect(page.locator('.inline-flex')).toContainText('已成交');
    });

    test('should handle status transitions correctly throughout lifecycle', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
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
        await expect(page.locator('.inline-flex')).toContainText('待跟进');

        await page.click('button[title="开始跟进"]');

        await expect(page.locator('.toast-success')).toContainText('已开始跟进');
        await expect(page.locator('.inline-flex')).toContainText('跟进中');

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.click('text=快速报价');
        await page.fill('input[placeholder="请输入报价名称"]', '测试报价');
        await page.click('.relative > .peer');
        await page.click('text=窗帘');
        await page.click('text=下一步');
        await page.fill('input[placeholder="产品名称"]', '测试窗帘');
        await page.fill('input[placeholder="宽度 (mm)"]', '2000');
        await page.fill('input[placeholder="高度 (mm)"]', '2500');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('报价创建成功');

        await page.goto(`/leads/${leadId}`);

        await expect(page.locator('.inline-flex')).toContainText('已成交');
    });

    test('should maintain data consistency throughout lifecycle', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-success')).toContainText('线索创建成功');

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        const customerName = await page.locator('.text-sm').first().innerText();
        expect(customerName).toBe(randomName);
    });

    test('should handle multiple followups in lifecycle', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
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

        await page.click('button[title="开始跟进"]');

        await expect(page.locator('.toast-success')).toContainText('已开始跟进');

        for (let i = 0; i < 3; i++) {
            await page.click('text=添加跟进');
            await page.fill('textarea[placeholder="请输入跟进内容..."]', `跟进记录 ${i + 1}`);
            await page.click('.relative > .peer');
            await page.click('text=意向明确');
            await page.click('text=保存');

            await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
        }
    });

    test('should handle lifecycle with void lead', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-success')).toContainText('线索创建成功');

        const leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="标记作废"]');
        await page.fill('textarea[placeholder="请填写作废原因"]', '测试作废原因');
        await page.click('text=确认');

        await expect(page.locator('.toast-success')).toContainText('线索已标记为无效');
        await expect(page.locator('.inline-flex')).toContainText('已作废');
    });

    test('should handle lifecycle with pool operations', async ({ page }) => {
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
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '自动化测试');
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
        await page.click('text=确认退回');

        await expect(page.locator('.toast-success')).toContainText('线索已退回公海');

        await page.goto('/leads');

        await expect(page.locator('.inline-flex')).toContainText('待分配');
    });
});
