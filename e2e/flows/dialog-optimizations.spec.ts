import { test, expect } from '@playwright/test';

test.describe('弹窗优化验证 (Dialog Optimizations)', () => {
    test.beforeEach(async ({ page }) => {
        // 先跳到产品页之前，开启请求拦截或者监听，如果在跳转中做可能会遗漏
    });

    test('DO-01: 验证产品弹窗懒加载与 Resizable', async ({ page }) => {
        const jsRequests: string[] = [];
        page.on('request', req => {
            if (req.resourceType() === 'script' && req.url().includes('_next/static/chunks')) {
                jsRequests.push(req.url());
            }
        });

        await page.goto('/supply-chain/products', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle'); // 等待初始资源加载稳定

        const initialJsCount = jsRequests.length;

        // 点击新增产品
        const addButton = page.getByRole('button', { name: /新建|添加|创建|新增/i }).or(page.locator('[data-testid="add-product-btn"]'));
        await expect(addButton).toBeVisible();

        // 清空之间的请求，以便明确看弹窗引发的请求
        jsRequests.length = 0;
        await addButton.click();

        // 验证有新的 JS chunk 被加载 (证明按需加载)
        await page.waitForTimeout(1000);
        const newJsCount = jsRequests.length;
        console.log(`✅ 点击新增按钮后加载了 ${newJsCount} 个新的 JS Chunks`);
        expect(newJsCount).toBeGreaterThan(0);

        // 验证 Resizable
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // 查找 re-resizable 的拖拽把手
        const resizer = dialog.locator('div[style*="cursor: se-resize"], div[style*="cursor: e-resize"]');
        await expect(resizer.first()).toBeVisible();
        console.log('✅ 找到了弹窗调整大小把手 (Resizable Handle)');
    });

    test('DO-02: 验证全局 Confirm Hook 拦截删除', async ({ page }) => {
        await page.goto('/supply-chain/products', { waitUntil: 'domcontentloaded' });

        // 点击第一行的删除按钮
        const firstRow = page.locator('table tbody tr').first().or(page.locator('[data-testid="product-row"]').first());
        await expect(firstRow).toBeVisible();

        let nativeConfirmFired = false;
        page.on('dialog', async dialog => {
            nativeConfirmFired = true;
            await dialog.dismiss();
        });

        const actionMenu = firstRow.getByRole('button', { name: /操作|更多|Actions/i }).or(firstRow.locator('[aria-haspopup="menu"]')).or(firstRow.locator('button[aria-expanded]'));
        if (await actionMenu.isVisible()) {
            await actionMenu.click();
        }

        const deleteButton = firstRow.getByRole('button', { name: /删除|Delete/i })
            .or(page.getByRole('menuitem', { name: /删除/ }))
            .or(firstRow.locator('button .text-red-500').first())
            .or(firstRow.locator('.text-destructive').first());

        await deleteButton.click();
        await page.waitForTimeout(500);

        // 原生 confirm 不应弹出
        expect(nativeConfirmFired).toBe(false);

        // 自定义全局 Confirm 弹窗出现
        const confirmDialog = page.getByRole('alertdialog');
        await expect(confirmDialog).toBeVisible();
        console.log('✅ 自定义全局 Confirm 弹窗出现');

        // 取消流程验证
        const cancelButton = confirmDialog.getByRole('button', { name: /取消|Cancel/i }).or(confirmDialog.locator('button:has-text("取消")'));
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        await expect(confirmDialog).toBeHidden();
        console.log('✅ 全局 Confirm 弹窗取消流程运转正常');
    });
});
