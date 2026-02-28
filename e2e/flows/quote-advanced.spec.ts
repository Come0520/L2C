import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createLead } from './fixtures/test-helpers';

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

        const leadId = await createLead(page, {
            name: customerName,
            phone: `137${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        });

        // 2. Lead Detail
        console.log('Step 2: Navigating to Lead Detail...');
        await page.goto(`/leads/${leadId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });


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
        await expect(widthInput).toBeVisible({ timeout: 5000 });
        await widthInput.fill('400');
        await page.locator('input[name="rooms.0.height"]').fill('280');

        await page.getByTestId('submit-quote-btn').click();

        // 5. 验证跳转到报价详情页
        console.log('Step 5: Verifying Redirect...');
        await expect(page).toHaveURL(/\/quotes\/.*/, { timeout: 15000 });

        // 6. 切换到"窗帘"标签页以查看商品明细行
        // 默认显示"汇总"视图，没有明细行，需先切换
        console.log('Step 6: Switching to CURTAIN tab...');
        const curtainTab = page.getByRole('tab', { name: '窗帘' });
        await expect(curtainTab).toBeVisible({ timeout: 10000 });
        await curtainTab.click();

        // 等待标签页切换完成
        await page.waitForTimeout(1000);

        console.log('Step 7: Verifying Item Appearance...');
        // 等待商品行出现
        const firstRow = page.locator('tbody tr').first();
        try {
            await expect(firstRow).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log("Failed to find any rows after switching to CURTAIN tab. Saving page content...");
            const html = await page.content();
            fs.writeFileSync('test-results/quote-advanced-failed.html', html);
            await page.screenshot({ path: 'test-results/quote-advanced-failed.png', fullPage: true });
            throw e;
        }

        // 记录初始行文本
        const initialText = await firstRow.textContent();
        console.log(`Initial Row text:`, initialText);

        // 8. 打开高级配置 Drawer
        console.log('Step 8: Opening Advanced Config Drawer...');
        // 高级配置按钮有 title="高级配置" 属性 (Settings 图标)
        const advancedBtn = firstRow.locator('button[title="高级配置"]');
        await expect(advancedBtn).toBeVisible({ timeout: 5000 });
        await advancedBtn.click();

        // 9. 验证 Drawer 打开并修改褶皱倍数
        console.log('Step 9: Verifying Drawer Logic...');
        // DrawerContent 使用 role="dialog"
        const drawerContent = page.getByRole('dialog');
        await expect(drawerContent).toBeVisible({ timeout: 5000 });
        await expect(drawerContent.getByText('高级配置:')).toBeVisible();

        // 褶皱倍数 Label 文本为 "褶皱倍数 (Fold Ratio)"
        const foldInput = drawerContent.locator('label:has-text("褶皱倍数") + input, label:has-text("褶皱倍数") ~ input').first();
        // 备选方案：直接用更灵活的选择器
        const foldInputAlt = drawerContent.locator('input[type="number"]').nth(2); // 第三个数字输入框（安装位置/离地高度之后）

        // 尝试精确选择器，如果不可见则回退
        let actualFoldInput = foldInput;
        if (!(await foldInput.isVisible().catch(() => false))) {
            console.log('Trying alternative fold input selector...');
            actualFoldInput = foldInputAlt;
        }
        await expect(actualFoldInput).toBeVisible();

        const initialFold = parseFloat(await actualFoldInput.inputValue());
        console.log(`Initial fold ratio: ${initialFold}`);

        // 修改褶皱倍数
        await actualFoldInput.fill('3');

        // 保存
        const saveBtn = drawerContent.getByRole('button', { name: '保存更改' });
        await saveBtn.click();

        // 等待 Drawer 关闭
        await expect(drawerContent).toBeHidden({ timeout: 5000 });
        await page.waitForTimeout(2000); // 等待 server action 回写

        const newText = await firstRow.textContent();
        console.log(`New Row text:`, newText);

        expect(newText).not.toEqual(initialText);
    });
});
