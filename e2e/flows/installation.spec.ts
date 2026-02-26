import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

/**
 * 安装服务 E2E 冒烟测试
 * 
 * 验证：
 * 1. 安装服务页面的加载与 Tab 显隐
 * 2. 新建安装单对话框
 * 3. 安装单列表的显示与详情入口
 */

test.describe('Installation Service', () => {

    test('should load installation list and display tabs', async ({ page }) => {
        // 导航到安装单列表
        await safeGoto(page, '/service/installation');
        await page.waitForLoadState('domcontentloaded');

        // 安装页面顶部有 UrlSyncedTabs，并没有 Heading，所以改为验证这些 Tabs (UrlSyncedTabs 渲染为普通 button)
        await expect(page.getByRole('button', { name: '全部' })).toBeVisible();
        await expect(page.getByRole('button', { name: '待分配' })).toBeVisible();
        await expect(page.getByRole('button', { name: '待上门' })).toBeVisible();
        await expect(page.getByRole('button', { name: '待确认' })).toBeVisible();
        await expect(page.getByRole('button', { name: '已完成' })).toBeVisible();
    });

    test('should be able to switch tabs and display table or empty state', async ({ page }) => {
        await safeGoto(page, '/service/installation');
        await page.waitForLoadState('domcontentloaded');

        // 点击待分配
        await page.getByRole('button', { name: '待分配' }).click();

        // 等待 URL 变更或者 UI 更新
        await expect(page).toHaveURL(/.*status=PENDING_DISPATCH/);

        // 验证页面中有表格表头 "安装单号"
        await expect(page.getByText('安装单号').first()).toBeVisible();

        // 无论有无数据，都会有一行<tr>显示（暂无安装任务状态也是一个<tr>）
        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow).toBeVisible();
    });

    test('should open create installation task dialog', async ({ page }) => {
        await safeGoto(page, '/service/installation');
        await page.waitForLoadState('domcontentloaded');

        // 点击新建按钮 (CreateInstallTaskDialog 的 trigger)
        await page.getByRole('button').filter({ hasText: '新建' }).first().click();

        // 验证弹出框出现
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // 验证弹出框中有选单和确认按钮
        await expect(dialog.getByRole('button', { name: '提交创建' })).toBeVisible();

        // 关闭
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });

});
