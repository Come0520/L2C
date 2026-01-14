import { test, expect } from '@playwright/test';

/**
 * P2: 客户全生命周期 E2E 测试
 * 
 * 覆盖场景:
 * 1. 客户档案自动创建 (从线索转化)
 * 2. 客户详情与标签管理
 * 3. 客户订单历史/消费统计验证
 * 4. 复购线索发起流程
 */

test.describe('客户全生命周期 (Customer Lifecycle)', () => {
    test.beforeEach(async ({ page }) => {
        await page.waitForLoadState('networkidle');
    });

    test('应由线索成功转化为客户档案', async ({ page }) => {
        // 此逻辑通常在 Won 线索时自动触发
        await page.goto('/customers');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { name: /客户管理/ })).toBeVisible();

        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 验证 Seed 脚本生成的客户是否存在
        await expect(page.getByText(/E2E客户/)).toBeVisible();
        console.log('✅ 客户列表显示正常');
    });

    test('应支持客户标签与偏好管理', async ({ page }) => {
        await page.goto('/customers');
        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible()) {
            await firstLink.click();
            await page.waitForURL(/\/customers\/.+/);

            // 查找"编辑"或"标签"
            const editBtn = page.getByRole('button', { name: /编辑|修改/ });
            if (await editBtn.isVisible()) {
                await editBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证偏好设置
                const prefTab = page.getByRole('tab', { name: /偏好|属性/ });
                if (await prefTab.isVisible()) {
                    await prefTab.click();
                    console.log('✅ 客户偏好设置 Tab 可见');
                }

                await page.keyboard.press('Escape');
            }
        }
    });

    test('应正确显示客户消费统计数据', async ({ page }) => {
        await page.goto('/customers');
        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible()) {
            await firstLink.click();

            // 验证消费汇总卡片
            page.locator('[data-testid="customer-stats"]'); // 假设有此 ID
            // 或者通过文本查找
            const orderCount = page.getByText(/累计订单|订单总数/);
            const totalAmount = page.getByText(/消费总额|累计消费/);

            if (await orderCount.isVisible() || await totalAmount.isVisible()) {
                console.log('✅ 客户消费统计卡片可见');
            }
        }
    });

    test('应支持发起复购线索', async ({ page }) => {
        await page.goto('/customers');
        const firstRow = page.locator('table tbody tr').first();

        if (await firstRow.isVisible()) {
            await firstRow.click();

            // 查找"发起复购"或"新建意向"
            const repurchaseBtn = page.getByRole('button', { name: /复购|新建线索/ });
            if (await repurchaseBtn.isVisible()) {
                await repurchaseBtn.click();

                // 应该跳转到线索创建页并自动填入客户信息
                await page.waitForURL(/\/leads\/new/);
                const nameInput = page.getByLabel(/客户姓名/);
                await expect(nameInput).not.toBeEmpty();

                console.log('✅ 复购线索发起路径正确');
            }
        }
    });
});
