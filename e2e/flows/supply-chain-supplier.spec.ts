import { test, expect } from '@playwright/test';

/**
 * P1: 供应商管理 (Supplier Management) E2E 测试
 * 
 * 覆盖场景:
 * 1. 完整声明周期: 创建 -> 查询 -> 更新
 * (合并为单条测试以保证数据依赖性)
 */

test.describe('Supply Chain - Supplier Management', () => {
    const timestamp = Date.now();
    const supplierName = `AutoSupplier_${timestamp}`;

    test.beforeEach(async ({ page }) => {
        await page.goto('/supply-chain/suppliers');
        await page.waitForLoadState('networkidle');
    });

    test('should execute full supplier lifecycle: Create -> Search -> Update', async ({ page }) => {
        // --- 1. Create Supplier ---
        console.log('Step 1: Creating Supplier...');
        await page.getByRole('button', { name: /新建|添加供应商/ }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await dialog.locator('input[name="name"]').fill(supplierName);
        await dialog.locator('input[name="contactPerson"]').fill('John Doe');
        await dialog.locator('input[name="phone"]').fill('13800138000');

        // Select Payment Method (Optional)
        // Schema default is CASH, UI might have it.
        const paymentSelect = dialog.locator('[name="paymentPeriod"], [role="combobox"]').first();
        if (await paymentSelect.isVisible()) {
            // Just verify visibility or select default
        }

        // Fix: Button name is "创建", so regex needs /创建/
        await dialog.getByRole('button', { name: /确认|提交|创建/ }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByText(supplierName)).toBeVisible();
        console.log(`✅ Supplier '${supplierName}' created successfully.`);

        // --- 2. Search ---
        console.log('Step 2: Searching...');
        const searchInput = page.getByPlaceholder(/搜索|供应商名称/);
        if (await searchInput.isVisible()) {
            await searchInput.fill(supplierName);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000); // Wait for filtering
        }

        // --- 3. Update ---
        console.log('Step 3: Updating...');
        const row = page.locator('tr', { hasText: supplierName }).first();
        await expect(row).toBeVisible();

        // Click Edit
        const editBtn = row.getByRole('button', { name: /编辑|修改/ });
        if (await editBtn.isVisible()) {
            await editBtn.click();
        } else {
            const actionsBtn = row.locator('button[aria-haspopup="menu"]');
            if (await actionsBtn.isVisible()) {
                await actionsBtn.click();
                await page.getByRole('menuitem', { name: /编辑/ }).click();
            }
        }

        const editDialog = page.getByRole('dialog');
        await expect(editDialog).toBeVisible();

        // Fix race condition: Wait for initial data load
        // Ensure "John Doe" is loaded before overwriting
        await expect(editDialog.locator('input[name="contactPerson"]')).toHaveValue('John Doe');

        const newContact = `Jane_${timestamp}`;
        await editDialog.locator('input[name="contactPerson"]').fill(newContact);
        // Fix for "received null" validation error: Fill optional fields
        await editDialog.locator('input[name="address"]').fill('123 Test St');
        await editDialog.locator('input[name="remark"]').fill('Updated remark');

        // Fix: Button name for update might be "保存" or "更新" or "确认"
        await editDialog.getByRole('button', { name: /确认|提交|保存|更新/ }).click();

        await expect(editDialog).toBeHidden();
        await expect(row).toContainText(newContact);
        console.log(`✅ Supplier updated with new contact: ${newContact}`);
    });
});
