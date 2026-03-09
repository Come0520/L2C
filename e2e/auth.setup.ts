import { test as setup } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page, context }) => {
    // 认证流程需要等待 Next.js 首次编译（开发模式下可能超过 60s）
    setup.setTimeout(300000); // 5 分钟

    // ===== P0 修复：强制清除所有浏览器缓存 =====
    // 根因：standalone 构建的 Server Action Hash 与浏览器缓存的旧 Hash 不匹配
    // 每次认证前强制清除，确保所有 Server Action 调用使用当前构建的最新 Hash
    console.log('🧹 强制清除浏览器缓存（防止 Server Action Hash 不匹配）...');
    await context.clearCookies();
    // 需要先导航到页面才能操作 localStorage / Cache API
    try {
        await page.goto('http://localhost:3004/', { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.evaluate(async () => {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch { /* 跨域时忽略 */ }
            // 清除 Service Worker 缓存（Cache API）
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
        });
        console.log('✅ 浏览器缓存已清除');
    } catch {
        console.log('⚠️ 缓存清除时页面未就绪，继续执行...');
    }
    // ===== P0 修复结束 =====

    // 如果 user.json 已存在，尝试复用现有 session（避免并行批次时互相覆盖）
    if (fs.existsSync(authFile)) {
        try {
            const sessionResponse = await page.request.get('http://localhost:3004/api/auth/session');
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
                console.log(`✅ 复用现有 session，跳过登录（用户: ${sessionData.user.name || sessionData.user.email}）`);
                return;
            }
        } catch {
            console.log('⚠️ session 验证失败，重新登录...');
        }
    }

    console.log('Navigating to login page...');
    page.on('console', msg => {
        console.log(`BROWSER [${msg.type()}]:`, msg.text());
    });

    await page.goto('/login', { timeout: 120000, waitUntil: 'domcontentloaded' });
    console.log('Login page loaded, URL:', page.url());

    // 填写登录表单
    await page.getByPlaceholder('请输入手机号或邮箱').fill('13800000001');
    await page.getByPlaceholder('请输入密码').fill('123456');
    console.log('Form filled, clicking submit...');

    // 监听 signIn 的网络响应
    const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/callback/credentials'),
        { timeout: 30000 }
    );

    await page.getByRole('button', { name: '登录' }).click();
    console.log('Submit button clicked, waiting for auth callback response...');

    // 等待 credentials callback 返回
    const authResponse = await responsePromise;
    console.log('Auth callback response status:', authResponse.status());

    // 等待一下让 NextAuth 有足够时间设置 session cookie
    await page.waitForTimeout(2000);

    // 通过 session API 确认登录成功
    const sessionResponse = await page.request.get('/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('Session check result:', JSON.stringify(sessionData).substring(0, 200));

    if (!sessionData?.user) {
        // 登录可能失败了，尝试抓取页面错误信息
        const errorMsg = await page.locator('.text-destructive, [role="alert"], .text-red-500')
            .first().textContent().catch(() => 'No error message found on page');
        console.error('Login failed. Error on page:', errorMsg);
        console.error('Current URL:', page.url());
        await page.screenshot({ path: 'auth-failure.png', fullPage: true });
        throw new Error(`Authentication failed: session not established. Page error: ${errorMsg}`);
    }

    console.log(`Authentication successful! User: ${sessionData.user.name || sessionData.user.email}`);

    // 保存认证状态（包含已设置好的 session cookie）
    await page.context().storageState({ path: authFile });
    console.log('Storage state saved to', authFile);
});
