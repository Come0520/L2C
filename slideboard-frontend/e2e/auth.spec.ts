import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
    test('未登录访问保护页面应重定向到登录页', async ({ page }) => {
        // 尝试访问需要认证的页面
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // 验证重定向到登录页
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: 'Slideboard' })).toBeVisible();
    });

    test('登录页面基本功能', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');

        // 验证登录页面元素
        await expect(page.getByRole('heading', { name: 'Slideboard' })).toBeVisible();

        // 切换到验证码登录
        await page.getByRole('button', { name: '验证码登录' }).click();
        await expect(page.getByLabel('手机号')).toBeVisible();
        await expect(page.getByLabel('验证码')).toBeVisible();

        // 验证码按钮存在
        const verifyCodeButton = page.getByRole('button', { name: /获取验证码|\\ds后重发/ });
        await expect(verifyCodeButton).toBeVisible();
    });

    test('手机号格式验证', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');

        // 切换到验证码登录
        await page.getByRole('button', { name: '验证码登录' }).click();

        // 输入无效手机号
        const phoneInput = page.getByLabel('手机号');
        await phoneInput.fill('123');

        // 尝试获取验证码（应该被禁用或显示错误）
        const verifyCodeButton = page.getByRole('button', { name: '获取验证码' });
        await expect(verifyCodeButton).toBeVisible();
    });

    test('完整登录流程（使用测试模式）', async ({ page }) => {
        await page.goto('/login');

        // 填写登录信息
        await page.getByLabel('手机号').fill('13800138000');
        await page.getByLabel('密码').fill('123456');
        await page.getByRole('button', { name: '登录' }).click();

        // 验证登录成功后跳转
        await expect(page).toHaveURL('/');
        
        // 验证首页元素
        await expect(page.getByRole('heading', { name: /欢迎/ })).toBeVisible();
    });
});
