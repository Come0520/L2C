import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
    console.log('Navigating to login page...');
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('error')) {
            console.log('PAGE LOG:', msg.text());
        }
    });

    await page.goto('/login', { timeout: 120000, waitUntil: 'domcontentloaded' });
    console.log('Login page loaded, URL:', page.url());

    // 填写登录表单
    await page.getByPlaceholder('请输入手机号或邮箱').fill('13800000001');
    await page.getByPlaceholder('请输入密码').fill('123456');
    console.log('Form filled, clicking submit...');

    await page.getByRole('button', { name: '登录' }).click();
    console.log('Submit button clicked, waiting for redirect...');

    try {
        // 等待 URL 变化到非 /login 页面
        await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000 });
        console.log('Final URL after redirect:', page.url());
        console.log('Authentication successful');
    } catch (e) {
        // 尝试抓取页面上的错误提示
        const errorMsg = await page.locator('.text-destructive, [role="alert"], .text-red-500').first().textContent().catch(() => 'No error message found on page');
        console.error('Login failed. Error on page:', errorMsg);
        console.error('Current URL:', page.url());
        await page.screenshot({ path: 'auth-failure.png', fullPage: true });
        throw new Error(`Authentication failed. Page error: ${errorMsg}`);
    }

    // 保存认证状态
    await page.context().storageState({ path: authFile });
});
