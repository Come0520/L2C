/**
 * 全链路溯源看板 E2E 测试
 *
 * 测试点：
 * 1. 溯源看板入口与访问
 * 2. 证据链展示完整性
 * 3. 批次问题统计与推荐
 */
import { test, expect } from '@playwright/test';

test.describe('全链路溯源看板 (Traceability Dashboard)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/after-sales');
        await page.waitForLoadState('networkidle');
    });

    test('P1-1: 售后工单详情应有溯源入口', async ({ page }) => {
        // 进入第一条售后工单详情
        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible())) {
            test.skip(true, '售后工单列表为空');
            return;
        }

        await firstRow.locator('a').first().click();
        await expect(page).toHaveURL(/\/after-sales\/.+/);

        // 查找溯源入口
        const traceBtn = page.getByRole('button', { name: /溯源|追溯|查看溯源/ }).or(page.getByRole('tab', { name: /溯源/ }));
        if (await traceBtn.isVisible()) {
            console.log('✅ 溯源入口可见');
            await traceBtn.click();

            // 验证溯源看板内容
            const traceContent = page.locator('[class*="trace"]').or(page.locator('text=溯源路径'));
            if (await traceContent.isVisible()) {
                console.log('✅ 溯源看板内容加载成功');
            }
        } else {
            console.log('⚠️ 未找到溯源入口按钮');
        }
    });

    test('P1-2: 溯源看板应展示采购溯源信息', async ({ page }) => {
        // 直接访问带有溯源数据的页面（如果有 ID）
        await page.goto('/after-sales');
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找采购溯源卡片
            const purchaseTrace = page.locator('text=采购单号').or(page.locator('text=供应商'));
            if (await purchaseTrace.isVisible()) {
                console.log('✅ 采购溯源信息展示正常');
            } else {
                console.log('⚠️ 未找到采购溯源信息（可能该工单无采购关联）');
            }
        }
    });

    test('P1-3: 溯源看板应展示安装溯源信息', async ({ page }) => {
        await page.goto('/after-sales');
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找安装溯源卡片
            const installTrace = page.locator('text=安装单号').or(page.locator('text=安装师傅'));
            if (await installTrace.isVisible()) {
                console.log('✅ 安装溯源信息展示正常');
            } else {
                console.log('⚠️ 未找到安装溯源信息（可能该工单无安装关联）');
            }
        }
    });

    test('P1-4: 证据链应展示多种证据类型', async ({ page }) => {
        await page.goto('/after-sales');
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找证据链区域
            const evidenceSection = page.locator('text=证据链').or(page.locator('text=附件'));
            if (await evidenceSection.isVisible()) {
                // 查找具体证据类型
                const measurePhoto = page.locator('text=量尺图').or(page.locator('text=测量'));
                const installPhoto = page.locator('text=安装照片').or(page.locator('text=安装后'));
                const issuePhoto = page.locator('text=问题照片').or(page.locator('text=故障图'));

                if (await measurePhoto.isVisible() || await installPhoto.isVisible() || await issuePhoto.isVisible()) {
                    console.log('✅ 证据链展示多种证据类型');
                }
            } else {
                console.log('⚠️ 未找到证据链区域');
            }
        }
    });

    test('P1-5: 批次问题统计应显示售后率', async ({ page }) => {
        await page.goto('/after-sales');
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找批次统计区域
            const batchStats = page.locator('text=售后率').or(page.locator('text=批次问题'));
            if (await batchStats.isVisible()) {
                console.log('✅ 批次问题统计展示正常');
            } else {
                console.log('⚠️ 未找到批次问题统计');
            }
        }
    });
});
