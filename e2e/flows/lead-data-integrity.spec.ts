import { test, expect } from '@playwright/test';

test.describe('Lead Data Integrity', () => {
    test('should handle soft delete correctly', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

        await page.click('button[title="删除"]');
        await page.click('text=确认删除');

        await expect(page.locator('.toast-success')).toContainText('线索已删除');

        await page.goto('/leads');

        await expect(page.locator(`text=${leadNo}`)).not.toBeVisible();
    });

    test('should handle cascade delete of followup logs', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.click('button[title="删除"]');
        await page.click('text=确认删除');

        await expect(page.locator('.toast-success')).toContainText('线索已删除');

        await page.goto('/leads');

        await expect(page.locator(`text=${leadNo}`)).not.toBeVisible();
    });

    test('should maintain referential integrity with customer', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

        await page.click('text=转为客户');

        await expect(page.locator('.toast-success')).toContainText('已创建新客户并成交');

        await page.goto('/customers');

        await expect(page.locator('text=测试客户')).toBeVisible();
    });

    test('should maintain referential integrity with quotes', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

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

        await page.goto('/quotes');

        await expect(page.locator('text=测试报价')).toBeVisible();
    });

    test('should maintain referential integrity with measurements', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

        await page.click('text=发起测量');
        await page.fill('input[placeholder="选择测量师傅"]', '测试师傅');
        await page.fill('input[placeholder="测量地址"]', '测试地址');
        await page.fill('input[placeholder="测量时间"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('测量任务已创建');

        await page.goto('/measurements');

        await expect(page.locator('text=测试地址')).toBeVisible();
    });

    test('should handle foreign key constraints', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

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

        await page.click('button[title="删除"]');
        await page.click('text=确认删除');

        await expect(page.locator('.toast-error')).toContainText('无法删除：该线索关联了报价单');
    });

    test('should maintain data consistency across transactions', async ({ page }) => {
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

        await page.goto(`/leads/${leadId}`);

        await page.click('text=转为客户');

        await expect(page.locator('.toast-success')).toContainText('已创建新客户并成交');

        await page.goto('/customers');

        const customerName = await page.locator('text=测试客户').innerText();
        expect(customerName).toBe(randomName);
    });

    test('should handle data type constraints', async ({ page }) => {
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
        await page.fill('input[placeholder="预估金额"]', 'invalid');
        await page.click('[data-testid="submit-lead-btn"]');

        await expect(page.locator('.toast-error')).toContainText('请输入有效的金额');
    });
});
