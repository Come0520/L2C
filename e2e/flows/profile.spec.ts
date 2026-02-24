import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('个人偏好设置 (Profile Settings) 模块 E2E 测试', () => {

    test.beforeEach(async ({ page }) => {
        // 导航到个人设置页面
        await safeGoto(page, '/profile/settings');
        await page.waitForLoadState('networkidle');
    });

    test('验证个人设置页面基础布局', async ({ page }) => {
        // 验证页面标题（Header 组件使用 h1）
        const header = page.locator('h1').filter({ hasText: /个人偏好|个人设置/ }).first();
        await expect(header).toBeVisible({ timeout: 15000 });

        // 根据浏览器调试，板块标题使用 H3
        const sections = ['个人信息', '界面外观', '安全设置', '报价偏好'];
        for (const title of sections) {
            await expect(page.locator('h3').filter({ hasText: title }).first()).toBeVisible();
        }
    });

    test('验证个人信息表单字段', async ({ page }) => {
        // 找到包含“个人信息”文本的区域
        const card = page.locator('div, .card').filter({ has: page.locator('h3', { hasText: '个人信息' }) }).first();
        await expect(card.locator('input').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /保存|更新/i })).toBeVisible();
    });

    test('验证主题/外观设置交互', async ({ page }) => {
        // 找到外观设置区域
        const themeSection = page.locator('div').filter({ has: page.locator('h3', { hasText: '界面外观' }) }).first();
        await expect(themeSection).toBeVisible();

        // 搜索切换按钮
        const themeButtons = themeSection.locator('button');
        const count = await themeButtons.count();
        console.log(`检测到主题/外观按钮数量: ${count}`);
        // 外观设置中通常有多个主题选项按钮
        expect(count).toBeGreaterThan(5);
    });

    test('验证业务/报价偏好设置', async ({ page }) => {
        // 正确的名词是“报价偏好”
        await expect(page.locator('body')).toContainText(/报价偏好/);
        await expect(page.locator('body')).toContainText(/产品优先|空间优先/i);
    });

});
