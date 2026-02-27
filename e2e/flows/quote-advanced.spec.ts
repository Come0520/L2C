import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Quote Advanced Mode', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const baseName = `${testInfo.project.name}-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
            fs.writeFileSync(path.join(dir, `${baseName}.html`), await page.content());
        }
    });

    test('should allow switching to advanced mode and affect calculation', async ({ page }) => {
        // Strategy: Lead -> Quick Quote (Default) -> Detail -> Advanced Mode

        // 1. Create Lead
        console.log('Step 1: Creating Lead...');
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const uniqueId = Math.random().toString(36).substring(7);
        const customerName = `AdvTest_${uniqueId}`;

        const createLeadBtn = page.getByTestId('create-lead-btn');
        await expect(createLeadBtn).toBeVisible({ timeout: 10000 });
        await createLeadBtn.evaluate(btn => (btn as HTMLElement).click());

        await expect(page.locator('div[role="dialog"]')).toBeVisible();
        await page.fill('input[name="customerName"]', customerName);
        await page.fill('input[name="customerPhone"]', `137${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`);
        await page.getByTestId('submit-lead-btn').click();
        await expect(page.locator('div[role="dialog"]')).toBeHidden();

        // 2. Lead Detail
        console.log('Step 2: Navigating to Lead Detail...');
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const row = page.locator('tr').filter({ hasText: customerName });
        await expect(row).toBeVisible();
        await row.locator('a[href^="/leads/"]').first().click();

        // 3. Quick Quote
        console.log('Step 3: Creating Quick Quote...');
        const quickQuoteBtn = page.locator('a', { hasText: '快速报价' });
        await expect(quickQuoteBtn).toBeVisible();
        await quickQuoteBtn.click();

        // 4. Submit Quote (Use Defaults)
        console.log('Step 4: Submitting Quote (Defaults)...');
        await expect(page.getByTestId('plan-ECONOMIC')).toBeVisible();
        await page.getByTestId('plan-ECONOMIC').click();

        // Fill dimensions if empty, but assume defaults might work or keys are stable
        // The form usually has "rooms.0.name" prefilled with '客厅'
        // Just fill dimensions to be safe
        const widthInput = page.locator('input[name="rooms.0.width"]');
        if (await widthInput.isVisible()) {
            await widthInput.fill('400');
            await page.locator('input[name="rooms.0.height"]').fill('280');
        } else {
            // If no room visible, add one
            await page.getByRole('button', { name: /添加房间/ }).click();
            await page.locator('input[name="rooms.0.name"]').fill('DefaultRoom');
            await page.locator('input[name="rooms.0.width"]').fill('400');
            await page.locator('input[name="rooms.0.height"]').fill('280');
        }

        await page.getByTestId('submit-quote-btn').click();

        // 5. Detail View
        console.log('Step 5: Verifying Redirect...');
        await expect(page).toHaveURL(/\/quotes\/.*/, { timeout: 15000 });

        console.log('Step 6: Verifying Item Appearance...');
        // Wait for table to populate
        await expect(page.getByText('此空间暂无明细数据')).toBeHidden({ timeout: 5000 }).catch(() => console.log("Table might still be empty..."));

        // Check if any quantity input (numeric) exists
        // If not, we can't test.
        const inputs = page.locator('input[type="number"]');
        const count = await inputs.count();
        console.log(`Found ${count} numeric inputs initially.`);

        if (count === 0) {
            throw new Error("No items created in quote! Cannot test advanced mode.");
        }

        // 6. Mode Toggle
        console.log('Step 7: Toggling Advanced Mode...');
        const foldInput = page.getByPlaceholder('倍数');
        await expect(foldInput).toBeHidden();

        const toggleBtn = page.getByRole('button', { name: /高级模式|极简模式/ });
        // If text is already '极简模式', we are in Advanced. But default is Simple.
        const text = await toggleBtn.textContent();
        if (text?.includes('高级模式')) {
            await toggleBtn.click();
            await expect(page.getByText('Mode updated').or(page.getByText('高级模式'))).toBeVisible({ timeout: 10000 });
        } else {
            console.log("Already in Advanced Mode?");
        }

        // 7. Verify logic
        console.log('Step 8: Verifying Logic...');
        await expect(foldInput).first().toBeVisible(); // Use first() if multiple items

        // Target the first row with fold input
        const firstFold = foldInput.first();
        const itemRow = page.locator('tr').filter({ has: firstFold });
        // Try to find quantity index dynamically
        const rowInputs = itemRow.locator('input');
        // Log values
        const inputCount = await rowInputs.count();
        console.log(`Row has ${inputCount} inputs`);

        // Assumption: Quantity is the one with value ~ (Width * 2 / 100)?
        // Width 400cm -> 4m. Fold 2 -> 8m.
        // Look for input with value around 8
        let quantityInput;
        for (let i = 0; i < inputCount; i++) {
            const val = await rowInputs.nth(i).inputValue();
            if (Math.abs(parseFloat(val) - 8.0) < 2.0) { // Tolerant check
                quantityInput = rowInputs.nth(i);
                console.log(`Found Quantity Input at index ${i} with value ${val}`);
                break;
            }
        }

        if (!quantityInput) {
            console.log("Could not identify quantity input by value helper. Fallback to index 3/4.");
            quantityInput = rowInputs.nth(3); // Fallback
        }

        const initialQty = parseFloat(await quantityInput.inputValue());

        await firstFold.fill('3');
        await firstFold.blur();
        await page.waitForTimeout(2000);

        const newQty = parseFloat(await quantityInput.inputValue());
        console.log(`Qty change: ${initialQty} -> ${newQty}`);
        expect(newQty).toBeGreaterThan(initialQty);
    });
});
