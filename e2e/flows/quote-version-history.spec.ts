import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createLead } from './fixtures/test-helpers';

test.describe('Quote Version History', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const baseName = `${testInfo.project.name}-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
            fs.writeFileSync(path.join(dir, `${baseName}.html`), await page.content());
        }
    });

    test('should create new version and maintain history', async ({ page }) => {
        // Strategy: Lead -> Quick Quote -> Detail -> Save New Version

        // 1. Create Lead
        console.log('Step 1: Creating Lead...');
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const uniqueId = Math.random().toString(36).substring(7);
        const customerName = `VerTest_${uniqueId}`;

        const leadId = await createLead(page, {
            name: customerName,
            phone: `134${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        });

        // 2. Lead Detail
        console.log('Step 2: Navigating to Lead Detail...');
        await page.goto(`/leads/${leadId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 3. Create Quick Quote
        console.log('Step 3: Creating Quick Quote...');
        await page.locator('a', { hasText: '快速报价' }).click();

        await page.getByTestId('plan-ECONOMIC').click();

        // Check/Add Room
        if (await page.locator('input[name="rooms.0.name"]').isVisible()) {
            await page.locator('input[name="rooms.0.name"]').fill('Room1');
            await page.locator('input[name="rooms.0.width"]').fill('300');
            await page.locator('input[name="rooms.0.height"]').fill('270');
        } else {
            await page.getByRole('button', { name: /添加房间/ }).click();
            await page.locator('input[name="rooms.0.name"]').fill('Room1');
            await page.locator('input[name="rooms.0.width"]').fill('300');
            await page.locator('input[name="rooms.0.height"]').fill('270');
        }

        await page.getByTestId('submit-quote-btn').click();

        // 4. Verify Detail Redirect
        console.log('Step 4: Verifying Detail Redirect...');
        await expect(page).toHaveURL(/\/quotes\/.*/, { timeout: 15000 });

        // 5. Verify V1
        console.log('Step 5: Verifying V1...');
        await expect(page.getByText('V1').first()).toBeVisible();

        // 6. Save as New Version
        console.log('Step 6: Saving as New Version...');
        const newVersionBtn = page.getByRole('button', { name: '保存为新版本' });
        await expect(newVersionBtn).toBeVisible();
        await newVersionBtn.click();

        // Wait for V2
        // It might be immediate or require loading
        await expect(page.getByText('V2').first()).toBeVisible({ timeout: 15000 });
        console.log('Step 7: V2 Verified!');

        console.log('Test Complete');
    });
});
