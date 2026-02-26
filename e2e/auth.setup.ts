import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
    console.log('Navigating to login page...');
    // 访问登录页，可能面临初次编译所以增加容忍时间
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:3000/login', { timeout: 120000, waitUntil: 'domcontentloaded' });
    console.log('Login page loaded');

    // 填写登录表单
    // 注意：已通过 seed-e2e.ts 预设管理员账号
    await page.getByPlaceholder('请输入手机号或邮箱').fill('13800000001');
    await page.getByPlaceholder('请输入密码').fill('123456');
    console.log('Form filled, clicking submit...');
    await page.getByRole('button', { name: '登录' }).click();

    // 等待登录响应
    console.log('Waiting for login response...');
    await page.waitForTimeout(2000);

    // 等待跳转
    try {
        console.log('Waiting for redirect...');
        await page.waitForTimeout(5000); // 给一点稳定时间
        console.log('Final URL after redirect:', page.url());
        // 只要不是登录页且包含基本路径即可
        await expect(page).not.toHaveURL(/.*login/, { timeout: 15000 });
        console.log('Authentication successful');
    } catch (e) {
        console.error('Authentication failed, taking screenshot...');
        await page.screenshot({ path: 'auth-failure.png' });
        console.log('Current URL at failure:', page.url());
        throw e;
    }

    // 保存认证状态
    await page.context().storageState({ path: authFile });
});
