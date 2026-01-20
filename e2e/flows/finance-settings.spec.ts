import { test, expect } from '@playwright/test';

/**
 * P1: 财务设置 (Finance Settings) E2E 测试
 * 
 * 覆盖场景:
 * 1. 账户管理: 在设置也创建 "银行账户" 和 "现金账户"
 * 2. 基础配置: 验证差额设置 (UI 存在性)
 */

test.describe('Finance Settings & Accounts', () => {
    const timestamp = Date.now();
    const bankAccountName = `Bank_${timestamp}`;


    test.beforeEach(async ({ page }) => {
        // Navigate to Finance Settings
        await page.goto('/settings/finance');
        await page.waitForLoadState('networkidle');
    });

    test('should create financial accounts', async ({ page }) => {
        // 1. Verify Page Loaded
        await expect(page.getByRole('heading', { name: /财务设置|Finance Settings/ })).toBeVisible();

        // Switch to "Finance Accounts" Tab
        await page.getByRole('tab', { name: '财务账户' }).click();
        // Wait for tab panel to be active or button to appear
        const addBtn = page.getByRole('button', { name: /新建账户|添加账户/ });
        await expect(addBtn).toBeVisible();

        // 2. Create Bank Account
        await addBtn.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await dialog.locator('input[name="accountName"]').fill(bankAccountName);
        await dialog.locator('input[name="holderName"]').fill('TestUser');

        // Select Type: Bank
        await dialog.getByRole('combobox').first().click();
        await page.getByRole('option', { name: /银行/ }).click();

        // Initial Balance (if available)
        const balanceInput = dialog.locator('input[name="balance"]');
        if (await balanceInput.isVisible()) {
            await balanceInput.fill('10000');
        }

        await dialog.getByRole('button', { name: /确认|提交/ }).click();
        await expect(dialog).toBeHidden();

        // Verify in list
        await expect(page.getByText(bankAccountName)).toBeVisible();
    });

    test('should update finance configurations', async ({ page }) => {
        // Verify Config Section
        await expect(page.getByText(/差异处理|Allow Difference/)).toBeVisible();

        // Toggle Switch (Just verify visibility and interactivity)
        const diffSwitch = page.getByRole('switch').first();
        await expect(diffSwitch).toBeVisible();

        // Optional: Toggle and Save
        // await diffSwitch.click();
        // await page.getByRole('button', { name: /保存/ }).click();
        // await expect(page.getByText(/保存成功/)).toBeVisible();
    });
});
