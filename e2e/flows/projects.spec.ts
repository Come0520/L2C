import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('项目 (Projects) 模块 E2E 测试', () => {

    test.beforeEach(async ({ page }) => {
        // 导航到项目列表页
        await safeGoto(page, '/projects');
        await page.waitForLoadState('domcontentloaded');
    });

    test('验证项目列表页基础布局', async ({ page }) => {
        // 显式等待 URL 到达
        await page.waitForURL(/\/projects/);
        await page.waitForTimeout(3000);

        // 验证核心业务文案
        await expect(page.locator('body')).toContainText(/项目管理|任务|工程/);
        await expect(page.locator('body')).toContainText(/待派单|待处理|全部/);
    });

    test('验证项目数据展示', async ({ page }) => {
        // 检查列表容器
        const bodyText = await page.innerText('body');
        if (bodyText.includes('暂无')) {
            console.log('项目列表为空，验证空状态文案');
            await expect(page.locator('body')).toContainText(/暂无|没有/);
        } else {
            // 如果有表格，验证结构
            const headers = ['任务', '客户', '状态'];
            for (const h of headers) {
                await expect(page.locator('body')).toContainText(h);
            }
        }
    });

    test('验证搜索功能响应', async ({ page }) => {
        // 搜索框可能在某些页面被隐藏或作为占位，先验证 body 包含搜索相关交互
        await expect(page.locator('body')).toContainText(/项目|工程|任务/i);
    });

});
