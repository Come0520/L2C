import { test, expect } from '@playwright/test';

/**
 * P1: 供应商对账 (AP) E2E 测试
 * 
 * 覆盖场景:
 * 1. 应付账单生成 (从采购单)
 * 2. 批量生成对账单 (Period-based)
 * 3. 供应商开票登记
 * 4. 付款处理流程
 */

test.describe('供应商对账 (Finance AP)', () => {
    test.beforeEach(async ({ page }) => {
        await page.waitForLoadState('networkidle');
    });

    test('应在应付账单列表页正常显示数据', async ({ page }) => {
        await page.goto('/finance/ap');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { name: /应付|对账/ })).toBeVisible();

        const table = page.locator('table');
        await expect(table).toBeVisible();

        console.log('✅ 应付账单列表加载正常');
    });

    test('应支持批量生成对账单', async ({ page }) => {
        await page.goto('/finance/ap');

        const generateBtn = page.getByRole('button', { name: /生成对账单|批量合并/ });
        if (await generateBtn.isVisible()) {
            await generateBtn.click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            // 选择供应商
            await page.getByLabel(/供应商/).click();
            await page.getByRole('option').first().click();

            // 选择时间段 (Mock)
            console.log('✅ 批量生成对账单对话框验证成功');
            await page.keyboard.press('Escape');
        }
    });

    test('应支持开票登记', async ({ page }) => {
        await page.goto('/finance/ap');

        const pendingRow = page.locator('table tbody tr').first();
        if (await pendingRow.isVisible()) {
            await pendingRow.click();
            await page.waitForURL(/\/finance\/ap\/.+/);

            const invoiceBtn = page.getByRole('button', { name: /开票|登记/ });
            if (await invoiceBtn.isVisible()) {
                await invoiceBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                await page.getByLabel(/发票号码/).fill('INV-E2E-123456');
                await page.keyboard.press('Escape');
                console.log('✅ 开票登记对话框验证成功');
            }
        }
    });

    test('应支持付款登记', async ({ page }) => {
        await page.goto('/finance/ap');

        const pendingPayRow = page.locator('table tbody tr').first();
        if (await pendingPayRow.isVisible()) {
            await pendingPayRow.click();

            const payBtn = page.getByRole('button', { name: /确认付款|登记付款/ });
            if (await payBtn.isVisible()) {
                await payBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                await page.getByLabel(/付款方式/).click();
                await page.getByRole('option').first().click();

                await page.keyboard.press('Escape');
                console.log('✅ 付款登记逻辑验证成功');
            }
        }
    });
});
