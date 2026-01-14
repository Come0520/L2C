import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
    console.log('Navigating to login page...');
    // 访问登录页
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:3000/login');
    console.log('Login page loaded');

    // 填写登录表单
    // 注意：已通过 seed-e2e.ts 预设管理员账号
    await page.getByPlaceholder('手机号').fill('13800000002');
    await page.getByPlaceholder('密码').fill('123456');
    console.log('Form filled, clicking submit...');
    await page.getByRole('button', { name: '登录' }).click();

    // 等待登录响应
    console.log('Waiting for login response...');
    await page.waitForTimeout(2000);

    // 等待跳转到工作台
    try {
        console.log('Waiting for redirect to workbench...');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
        console.log('Authentication successful');
    } catch (e) {
        console.error('Authentication failed, taking screenshot...');
        await page.screenshot({ path: 'auth-failure.png' });
        console.log('Current URL:', page.url());
        throw e;
    }

    // 保存认证状态
    await page.context().storageState({ path: authFile });
});
