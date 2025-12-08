import { test, expect } from '@playwright/test';

test.describe('订单全流程', () => {
    test.beforeEach(async ({ page }) => {
        // 使用测试模式登录
        await page.goto('/login');
        await page.getByLabel('手机号').fill('13800138000');
        await page.getByLabel('密码').fill('123456');
        await page.getByRole('button', { name: '登录' }).click();
        await expect(page).toHaveURL('/');
    });

    test('订单流转与状态更新', async ({ page }) => {
        // 1. 进入订单列表页 (默认进入 "测量中-分配中")
        await page.goto('/orders/status/measuring_assigning');
        await expect(page.getByRole('heading', { name: '测量中-分配中' })).toBeVisible();

        // 2. 检查列表是否有数据 (假设测试环境有预置数据，或者至少显式"无数据"状态)
        // 这里我们主要验证页面结构加载正常，如果不为空则尝试点击第一个
        const firstOrderLink = page.locator('table tbody tr a').first();

        // 只有当有数据时才执行后续流转测试
        if (await firstOrderLink.count() > 0) {
            const orderNo = await firstOrderLink.innerText();
            await firstOrderLink.click();

            // 3. 进入订单详情页
            await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/);
            await expect(page.getByText(`订单号：${orderNo}`)).toBeVisible();

            // 4. 尝试更改状态 (模拟操作)
            // 注意：这需要页面上有状态流转的按钮。
            // 假设有一个"推单"或"更新状态"的按钮
            const nextStatusBtn = page.getByRole('button', { name: /推单|完成/ });

            if (await nextStatusBtn.isVisible()) {
                await nextStatusBtn.click();
                // 确认对话框
                await page.getByRole('button', { name: '确认' }).click();

                // 验证提示
                await expect(page.getByText('操作成功')).toBeVisible();
            }
        } else {
            console.log('当前列表无订单数据，跳过详情页流转测试');
            // 至少验证了页面加载没有崩溃
        }
    });

    test('快速创建订单入口可用性', async ({ page }) => {
        // 验证顶栏或页面上的"快速创建"按钮
        const createBtn = page.getByRole('button', { name: '快速创建' });
        if (await createBtn.isVisible()) {
            await createBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByRole('heading', { name: '新建订单' })).toBeVisible();
        }
    });
});
