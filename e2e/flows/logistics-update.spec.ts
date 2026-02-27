import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * P1: 物流更新流程 E2E
 * 
 * 验证订单进入生产中/发货状态后，物流信息的更新与同步
 */

test.describe('物流更新 E2E', () => {
    test.describe.configure({ mode: 'serial' });

    const timestamp = Date.now();
    const testCustomerName = `物流测试_${timestamp}`;
    let createdOrderId: string;

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const baseName = `logistics-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
        }
    });

    test('Step 0: 创建测试订单并进入生产状态', async ({ page }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 快速创建线索及订单 (简化流程，假设已有成熟 Helper)
        await page.getByTestId('create-lead-btn').click();
        await page.getByTestId('lead-name-input').fill(testCustomerName);
        await page.getByTestId('lead-phone-input').fill(`136${timestamp.toString().slice(-8)}`);
        await page.getByTestId('submit-lead-btn').click();

        await page.reload();
        await page.locator('tr').filter({ hasText: testCustomerName }).first().locator('a').first().click();
        await page.getByTestId('quick-quote-btn').click();
        await page.locator('[data-testid^="plan-"]').first().click();
        await page.getByTestId('submit-quote-btn').click();

        await page.getByRole('button', { name: /激活|生效/ }).click();
        await page.getByRole('button', { name: /确认|确定/ }).click();

        await page.getByRole('button', { name: /转订单/ }).click();
        await page.getByRole('dialog').getByRole('button', { name: /确认|确定/ }).click();

        await expect(page).toHaveURL(/\/orders\/.*/);
        createdOrderId = page.url().split('/orders/')[1]?.split('?')[0] || '';

        // 进入生产中以解锁物流编辑
        await page.getByRole('button', { name: /确认排产/ }).click();
        await page.getByRole('dialog').getByRole('button', { name: /确认|确定/ }).click();
        await expect(page.getByText(/生产中/)).toBeVisible();
    });

    test('Step 1: 更新物流单号', async ({ page }) => {
        test.skip(!createdOrderId, '需先创建订单');
        await page.goto(`/orders/${createdOrderId}`);

        // 找到物流卡片
        const logisticsCard = page.getByTestId('logistics-card');
        await expect(logisticsCard).toBeVisible();

        // 点击编辑/发货按钮
        const shipBtn = page.getByRole('button', { name: /发货|录入单号/ });
        await shipBtn.click();

        const dialog = page.getByRole('dialog');
        await dialog.locator('input[placeholder*="物流公司"]').fill('顺丰速运');
        await dialog.locator('input[placeholder*="单号"]').fill('SF-LOG-12345');
        await dialog.getByRole('button', { name: /确定|保存/ }).click();

        await expect(page.getByText('SF-LOG-12345')).toBeVisible();
        console.log('✅ 物流单号录入成功');
    });

    test('Step 2: 验证物流轨迹同步 (Mock 验证)', async ({ page }) => {
        test.skip(!createdOrderId, '需先录入单号');
        await page.goto(`/orders/${createdOrderId}`);

        // 检查是否有“更新轨迹”或“同步物流”的操作
        const refreshBtn = page.getByRole('button', { name: /刷新轨迹|同步物流/ });
        if (await refreshBtn.isVisible()) {
            await refreshBtn.click();
            await expect(page.getByText(/同步成功/)).toBeVisible();
        }

        // 验证轨迹内容展示
        await expect(page.getByTestId('logistics-traces')).toBeVisible();
    });
});
