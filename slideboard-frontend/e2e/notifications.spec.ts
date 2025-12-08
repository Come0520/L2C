import { test, expect } from '@playwright/test';

test.describe('通知功能', () => {
    test.skip('通知列表页面渲染（需要登录）', async ({ page }) => {
        // 需要先登录
        await page.goto('/notifications');
        await page.waitForLoadState('domcontentloaded');

        // 验证页面元素
        await expect(page.getByRole('heading', { name: '通知与审批' })).toBeVisible();
        await expect(page.getByText('通知消息')).toBeVisible();
    });

    test.skip('标记通知为已读', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('domcontentloaded');

        // 获取第一条未读通知
        const firstUnreadNotification = page.locator('[data-status="unread"]').first();

        if (await firstUnreadNotification.count() > 0) {
            // 点击通知
            await firstUnreadNotification.click();

            // 验证状态变更
            await expect(firstUnreadNotification).toHaveAttribute('data-status', 'read');
        }
    });

    test.skip('通知详情弹窗', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('domcontentloaded');

        // 点击任意通知
        const notification = page.locator('[data-testid="notification-item"]').first();
        await notification.click();

        // 验证详情弹窗显示
        const modal = page.getByRole('dialog', { name: '通知详情' });
        await expect(modal).toBeVisible();

        // 关闭弹窗
        await page.getByRole('button', { name: '关闭' }).click();
        await expect(modal).not.toBeVisible();
    });

    test.skip('通知筛选功能', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('domcontentloaded');

        // 筛选未读通知
        await page.getByRole('button', { name: '未读' }).click();

        // 验证只显示未读通知
        const notifications = page.locator('[data-testid="notification-item"]');
        const count = await notifications.count();

        for (let i = 0; i < count; i++) {
            const status = await notifications.nth(i).getAttribute('data-status');
            expect(status).toBe('unread');
        }
    });
});
