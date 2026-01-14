import { test, expect } from '@playwright/test';

test.describe('Lead Followup Reminders', () => {
    let leadId: string;

    test('should set next followup reminder', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        await page.fill('input[placeholder="例如：记得带样品"]', '记得带样品');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
    });

    test('should display followup reminder on lead list', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        await page.fill('input[placeholder="例如：记得带样品"]', '记得带样品');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.goto('/leads');

        await expect(page.locator('text=下次跟进')).toBeVisible();
    });

    test('should display expired followup reminder', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() - 86400000).toISOString().slice(0, 16));
        await page.fill('input[placeholder="例如：记得带样品"]', '记得带样品');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.goto('/leads');

        await expect(page.locator('text=已过期')).toBeVisible();
    });

    test('should complete followup reminder', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        await page.fill('input[placeholder="例如：记得带样品"]', '记得带样品');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '完成跟进');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
    });

    test('should handle multiple followup reminders', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        for (let i = 0; i < 3; i++) {
            await page.click('text=添加跟进');
            await page.fill('textarea[placeholder="请输入跟进内容..."]', `跟进记录 ${i + 1}`);
            await page.click('.relative > .peer');
            await page.click('text=意向明确');
            await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000 * (i + 1)).toISOString().slice(0, 16));
            await page.fill('input[placeholder="例如：记得带样品"]', `备注 ${i + 1}`);
            await page.click('text=保存');

            await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
        }
    });

    test('should handle followup reminder with special characters', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        const specialNote = '备注@#$%^&*()_+-={}[]|\\:;"\'<>?,./~`';
        await page.fill('input[placeholder="例如：记得带样品"]', specialNote);
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
    });

    test('should handle followup reminder with long note', async ({ page }) => {
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
        leadId = leadLink?.split('/').pop() || '';

        await page.goto(`/leads/${leadId}`);

        await page.click('text=添加跟进');
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        await page.fill('input[type="datetime-local"]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
        const longNote = 'A'.repeat(500);
        await page.fill('input[placeholder="例如：记得带样品"]', longNote);
        await page.click('text=保存');

        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
    });
});
