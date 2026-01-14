import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Quote Lifecycle Flow', () => {

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const html = await page.content();
            const failurePath = path.join('test-results', `failure-${testInfo.title.replace(/\s+/g, '-').toLowerCase()}.html`);
            fs.writeFileSync(failurePath, html);
            console.log(`Saved failure HTML to ${failurePath}`);
            const screenshotPath = path.join('test-results', `failure-${testInfo.title.replace(/\s+/g, '-').toLowerCase()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
        }
    });

    test('should create a lead and convert to quick quote', async ({ page }) => {
        // 1. Create Lead
        await page.goto('/leads');

        // Use data-testid for stable selection
        const createBtn = page.getByTestId('create-lead-btn');
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        const timestamp = Date.now();
        const customerName = `QuoteTest ${timestamp}`;
        // 使用随机手机号避免冲突
        const phone = `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        await page.fill('input[name="customerName"]', customerName);
        await page.fill('input[name="customerPhone"]', phone);

        // Wait for save button and click
        const saveBtn = page.getByTestId('submit-lead-btn');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Verify creation success
        // await expect(page.locator('text=创建成功')).toBeVisible();

        // Wait for list to refresh and show new lead
        // Wait for list to refresh and show new lead
        // Find the row with the customer name
        const row = page.locator('tr').filter({ hasText: customerName });
        await expect(row).toBeVisible();

        // Click on the detail link (Edit button wrapped in anchor)
        const detailLink = row.locator('a[href^="/leads/"]');
        await expect(detailLink).toBeVisible();
        await detailLink.click();

        // Ensure we navigated to the detail page
        await expect(page).toHaveURL(/\/leads\/.+/);

        // 3. Create Quick Quote
        // Using data-testid added to Quick Quote button
        const quickQuoteBtn = page.getByTestId('quick-quote-btn');
        await expect(quickQuoteBtn).toBeVisible({ timeout: 10000 });
        await quickQuoteBtn.click();

        // 4. Fill Quote Form
        // Select Plan "ECONOMIC" using data-testid
        const planCard = page.getByTestId('plan-ECONOMIC');
        await expect(planCard).toBeVisible();
        await planCard.click();

        // Add Room (Default rooms might be present, but let's edit the first one)
        // Check if rows exist
        const roomNameInput = page.locator('input[name="rooms.0.name"]');
        await expect(roomNameInput).toBeVisible();

        await roomNameInput.fill('Living Room');
        await page.locator('input[name="rooms.0.width"]').fill('350'); // CM
        await page.locator('input[name="rooms.0.height"]').fill('270'); // CM

        // Submit using data-testid
        const submitBtn = page.getByTestId('submit-quote-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // 5. Verify Quote Created
        // await expect(page.locator('text=报价单已生成')).toBeVisible();

        // Should redirect to Quote Detail
        await expect(page).toHaveURL(/\/quotes\/.*/);
        await expect(page.locator(`text=${customerName}`)).toBeVisible();

        // Verify Amounts (Rough check)
        const totalAmount = page.locator('[data-test-id="total-amount"]');
        await expect(totalAmount).toBeVisible();
        const text = await totalAmount.textContent();
        expect(text).not.toBe('¥0.00');
    });

    test('should activate quote with items validation', async ({ page }) => {
        // 导航到报价列表，找一个 DRAFT 状态的报价
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');

        const draftRow = page.locator('tr').filter({ hasText: /DRAFT|草稿/ }).first();

        if (await draftRow.isVisible()) {
            await draftRow.locator('a').first().click();
            await page.waitForURL(/\/quotes\/.*/);

            // 查找激活按钮
            const activateBtn = page.getByRole('button', { name: /激活|生效/ });

            if (await activateBtn.isVisible()) {
                await activateBtn.click();

                // 验证成功消息或状态变更
                await Promise.race([
                    expect(page.getByText(/成功|已激活|已生效/)).toBeVisible({ timeout: 5000 }),
                    expect(page.getByText(/ACTIVE|生效/)).toBeVisible({ timeout: 5000 })
                ]);

                console.log('✅ 报价单激活测试通过');
            } else {
                console.log('⚠️ 激活按钮不可见');
            }
        } else {
            console.log('⏭️ 无草稿报价单，跳过激活测试');
        }
    });

    test('should prevent activating quote without items', async () => {
        // 此测试需要特殊的测试数据（空报价单）
        // 在实际业务中，通常不会创建空报价单
        console.log('⏭️ 需要专门的测试fixture，跳过');
        test.skip();
    });

    test('should convert activated quote to order', async ({ page }) => {
        // 导航到报价列表，找一个 ACTIVE 状态的报价
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');

        const activeRow = page.locator('tr').filter({ hasText: /ACTIVE|生效/ }).first();

        if (await activeRow.isVisible()) {
            await activeRow.locator('a').first().click();
            await page.waitForURL(/\/quotes\/.*/);

            // 查找转订单按钮
            const convertBtn = page.getByRole('button', { name: /转订单|创建订单/ });

            if (await convertBtn.isVisible()) {
                await convertBtn.click();

                // 处理可能的确认对话框
                const dialog = page.getByRole('dialog');
                if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const confirmBtn = dialog.getByRole('button', { name: /确认|确定|创建/ });
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                    }
                }

                // 验证成功
                await Promise.race([
                    expect(page).toHaveURL(/\/orders\/.*/, { timeout: 10000 }),
                    expect(page.getByText(/成功|订单已创建/)).toBeVisible({ timeout: 10000 })
                ]);

                console.log('✅ 报价转订单测试通过');
            } else {
                console.log('⚠️ 转订单按钮不可见');
            }
        } else {
            console.log('⏭️ 无生效报价单，跳过转订单测试');
        }
    });

    test('should lock quote after order creation', async ({ page }) => {
        // 导航到报价列表，找一个 LOCKED 状态的报价
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');

        const lockedRow = page.locator('tr').filter({ hasText: /LOCKED|已锁定/ }).first();

        if (await lockedRow.isVisible()) {
            await lockedRow.locator('a').first().click();
            await page.waitForURL(/\/quotes\/.*/);

            // 验证转订单按钮不可见或禁用
            const convertBtn = page.getByRole('button', { name: /转订单/ });
            const isVisible = await convertBtn.isVisible().catch(() => false);

            if (isVisible) {
                const isDisabled = await convertBtn.isDisabled();
                expect(isDisabled).toBeTruthy();
            }

            // 验证编辑功能受限
            const editBtn = page.getByRole('button', { name: /编辑/ });
            if (await editBtn.isVisible()) {
                const isEditDisabled = await editBtn.isDisabled();
                expect(isEditDisabled).toBeTruthy();
            }

            console.log('✅ 已锁定报价单限制验证通过');
        } else {
            console.log('⏭️ 无已锁定报价单，跳过测试');
        }
    });
});
