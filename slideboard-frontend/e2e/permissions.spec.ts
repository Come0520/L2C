import { test, expect } from '@playwright/test';

test.describe('权限控制', () => {
    test('公开页面可直接访问', async ({ page }) => {
        // 访问登录页（公开）
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByRole('heading', { name: 'Slideboard' })).toBeVisible();

        // 访问首页（公开）
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL('/');
    });

    test('保护页面需要登录', async ({ page }) => {
        const protectedPages = [
            '/dashboard',
            '/orders',
            '/leads',
            '/quotes',
            '/notifications'
        ];

        for (const pagePath of protectedPages) {
            await page.goto(pagePath);
            await page.waitForLoadState('domcontentloaded');

            // 验证重定向到登录页
            await expect(page).toHaveURL(/\/login/);
        }
    });

    test.skip('不同角色权限验证（需要测试账号）', async ({ page }) => {
        // 此测试需要不同角色的测试账号
        // 例如：销售、设计师、管理员等

        // 以普通销售登录
        // await loginAs(page, 'sales_user');

        // 验证可以访问销售相关页面
        await page.goto('/orders');
        await expect(page).not.toHaveURL(/\/login/);

        // 验证不能访问管理员页面
        await page.goto('/system/users');
        // 应该显示无权限提示或重定向
    });
});
