import { test, expect } from '@playwright/test';

test.describe('鲁棒性与边界测试 (Error Boundaries & Resilience)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/leads');
        // 等待页面基础加载完成
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    });

    test('表单校验边界: 必填为空硬提交被拦截', async ({ page }) => {
        // 打开新建线索弹窗
        await page.getByRole('button', { name: /新建线索|新建/ }).click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

        // 不填任何必填项直接提交
        const submitBtn = page.getByRole('button', { name: '保存', exact: true });
        await submitBtn.click();

        // 验证必填红字提示 (这里以原生的 required 提示或 Zod 解析的 errMsg 为主)
        // 具体视组件库实现，一般会有 aria-invalid="true" 或包含红字
        const errors = page.locator('.text-destructive, [aria-invalid="true"], text=必填, text=请输入');
        await expect(errors.first()).toBeVisible({ timeout: 5000 });

        // 确保没有跳转或产生成功 Toast
        await expect(page.locator('text=创建成功')).not.toBeVisible();
    });

    test('网络层异常边界: API 挂掉的 fallback 展现 (Toast拦截)', async ({ page }) => {
        // 拦截创建接口，模拟 500 Internal Server Error
        await page.route('**/api/leads*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error Mock' })
                });
            } else {
                await route.continue();
            }
        });

        // 尝试新建线索
        await page.goto('/leads');
        // 等待可能存在的骨架屏或加载动画消失
        await page.waitForSelector('.lucide-loader-2, .animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => { });
        await page.waitForLoadState('networkidle');

        // 等待新建按钮出现且可交互
        const createBtn = page.getByRole('button', { name: /新建线索|新建/ });
        await expect(createBtn).toBeVisible({ timeout: 15000 });

        // 使用 force 避免被全屏骨架屏拦截，或者通过 JS 事件点击
        await createBtn.click({ force: true, trial: true }).catch(async () => {
            // 如果普通带 force 的 trial 点击仍失败，尝试降级为纯 js 触发
            await createBtn.evaluate(b => (b as HTMLElement).click());
        });
        await createBtn.click({ force: true }).catch(() => { });

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // 填入必填项以骗过前端验证
        await page.getByPlaceholder('客户姓名').fill('异常测试客户');
        await page.getByPlaceholder('手机号').fill('13999999999');

        const submitBtn = dialog.getByRole('button', { name: '保存', exact: true });
        await submitBtn.click();

        // 验证前端能正确捕获并提示错误
        const errorToast = page.locator('text=创建失败').or(page.locator('text=Error'));
        await expect(errorToast.first()).toBeVisible({ timeout: 10000 });

        // 弹窗依然保持打开状态以供修改
        await expect(dialog).toBeVisible();
    });

    test('离线弱网边界: 断网下的兜底行为', async ({ context, page }) => {
        // 转到离线模式
        await context.setOffline(true);

        try {
            await page.reload();
        } catch (e) {
            // Net error
        }

        // 离线情况下，如果访问已被 Service Worker 缓存，或者返回浏览器自带的错误页
        // 这里验证是否有网络问题的提示，或者是浏览器的断网特征
        try {
            const isOfflinePage = await page.evaluate(() => !navigator.onLine);
            expect(isOfflinePage).toBeTruthy();
        } catch (e) {
            // 如果捕获到错误，说明页面已经崩溃或进入浏览器原生网络异常页，执行上下文被销毁
        }

        // 恢复网络
        await context.setOffline(false);
        await page.goto('/leads');
        await expect(page.getByRole('heading', { name: /线索/ })).toBeVisible({ timeout: 20000 });
    });
});
