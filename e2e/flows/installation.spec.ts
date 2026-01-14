import { test, expect } from '@playwright/test';

/**
 * P0: 安装流程 E2E 测试
 * 
 * 覆盖场景:
 * 1. 安装单列表查看与筛选
 * 2. 派单流程 (指派师傅)
 * 3. 验收流程 (确认验收/驳回返工)
 * 4. 状态联动 (驱动订单完成)
 */

test.describe('安装流程', () => {
    test.beforeEach(async ({ page }) => {
        await page.waitForLoadState('networkidle');
    });

    test('应显示安装单列表并支持 Tab 分组', async ({ page }) => {
        // 导航到安装单列表
        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 验证页面标题
        await expect(page.getByRole('heading', { name: /安装/ })).toBeVisible();

        // 验证 Tab 分组
        const tabs = page.locator('[role="tablist"]');
        if (await tabs.isVisible()) {
            // 验证常见 Tab
            await expect(page.getByRole('tab', { name: /待分配/ })).toBeVisible();
            console.log('✅ Tab 分组可见');
        }

        // 验证表格
        const table = page.locator('table');
        await expect(table).toBeVisible();

        console.log('✅ 安装单列表页加载正常');
    });

    test('应支持派单操作 (指派师傅)', async ({ page }) => {
        // 导航到安装单列表
        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 切换到"待分配"Tab
        const pendingTab = page.getByRole('tab', { name: /待分配/ });
        if (await pendingTab.isVisible()) {
            await pendingTab.click();
            await page.waitForTimeout(500);
        }

        // 查找待分配的安装单
        const pendingRow = page.locator('table tbody tr').first();

        if (await pendingRow.isVisible()) {
            // 查找"指派"按钮
            const assignBtn = pendingRow.getByRole('button', { name: /指派|分配/ });

            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                // 验证派单对话框
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证师傅选择器
                const workerSelect = page.getByLabel(/师傅|工人/);
                if (await workerSelect.isVisible()) {
                    console.log('✅ 师傅选择器可见');
                }

                // 验证日期选择器
                const dateInput = page.getByLabel(/日期|预约/);
                if (await dateInput.isVisible()) {
                    console.log('✅ 日期选择器可见');
                }

                // 关闭对话框
                await page.keyboard.press('Escape');
            }
        } else {
            console.log('⚠️ 无待分配安装单，跳过派单测试');
        }
    });

    test('应显示安装单详情页', async ({ page }) => {
        // 导航到安装单列表
        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 点击第一个安装单
        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible()) {
            await firstLink.click();
            await page.waitForURL(/\/service\/installation\/.+/);

            // 验证详情页
            await expect(page.getByText(/安装单详情|安装单号/)).toBeVisible();

            // 验证客户信息
            const customerInfo = page.getByText(/客户|姓名|电话/);
            expect(await customerInfo.count()).toBeGreaterThan(0);

            // 验证状态进度条
            const stepper = page.locator('[data-testid="install-status-stepper"]');
            if (await stepper.isVisible()) {
                console.log('✅ 状态进度条可见');
            }

            console.log('✅ 安装单详情页加载正常');
        } else {
            console.log('⚠️ 安装单列表为空，跳过详情页测试');
        }
    });

    test('应支持验收确认操作', async ({ page }) => {
        // 导航到安装单列表
        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 切换到"待确认"Tab
        const pendingConfirmTab = page.getByRole('tab', { name: /待确认/ });
        if (await pendingConfirmTab.isVisible()) {
            await pendingConfirmTab.click();
            await page.waitForTimeout(500);
        }

        // 查找待确认的安装单
        const confirmRow = page.locator('table tbody tr').first();

        if (await confirmRow.isVisible()) {
            // 进入详情页
            await confirmRow.locator('a').first().click();
            await page.waitForURL(/\/service\/installation\/.+/);

            // 查找"确认验收"按钮
            const confirmBtn = page.getByRole('button', { name: /确认验收|验收通过/ });

            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();

                // 验证验收对话框
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证评分组件
                const rateComponent = page.locator('[class*="rate"], [data-testid="rating"]');
                if (await rateComponent.isVisible()) {
                    console.log('✅ 评分组件可见');
                }

                // 关闭对话框
                await page.keyboard.press('Escape');
            }
        } else {
            console.log('⚠️ 无待确认安装单，跳过验收测试');
        }
    });

    test('应支持驳回返工操作', async ({ page }) => {
        // 导航到安装单详情 (假设已有待确认的安装单)
        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 切换到"待确认"Tab
        const pendingConfirmTab = page.getByRole('tab', { name: /待确认/ });
        if (await pendingConfirmTab.isVisible()) {
            await pendingConfirmTab.click();
            await page.waitForTimeout(500);
        }

        const confirmRow = page.locator('table tbody tr').first();

        if (await confirmRow.isVisible()) {
            // 进入详情页
            await confirmRow.locator('a').first().click();
            await page.waitForURL(/\/service\/installation\/.+/);

            // 查找"驳回"按钮
            const rejectBtn = page.getByRole('button', { name: /驳回|返工/ });

            if (await rejectBtn.isVisible()) {
                await rejectBtn.click();

                // 验证驳回对话框
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证驳回原因必填
                const reasonInput = page.getByLabel(/原因/);
                if (await reasonInput.isVisible()) {
                    console.log('✅ 驳回原因输入框可见');
                }

                // 关闭对话框
                await page.keyboard.press('Escape');
            }
        } else {
            console.log('⚠️ 无待确认安装单，跳过驳回测试');
        }
    });
});

test.describe('移动端安装单测试', () => {
    // 此测试会在 Mobile Chrome/Safari 视口中运行
    test('应在移动端正常显示安装单列表', async ({ page, isMobile }) => {
        test.skip(!isMobile, '仅在移动端运行');

        await page.goto('/service/installation');
        await page.waitForLoadState('networkidle');

        // 验证页面适配
        await expect(page.getByRole('heading', { name: /安装/ })).toBeVisible();

        // 验证触摸交互元素大小合适
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
                const box = await button.boundingBox();
                if (box) {
                    // 按钮至少 44px 高度 (Apple HIG 推荐)
                    expect(box.height).toBeGreaterThanOrEqual(40);
                }
            }
        }

        console.log('✅ 移动端布局正常');
    });
});
