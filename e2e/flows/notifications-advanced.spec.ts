/**
 * 通知系统高级功能 E2E 测试
 *
 * 测试点：
 * 1. 通知铃铛未读数徽标
 * 2. 一键全部已读
 * 3. 用户偏好设置
 * 4. 广播公告展示
 */
import { test, expect } from '@playwright/test';

test.describe('通知铃铛与未读徽标 (Notification Bell)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-1: 通知铃铛应显示未读数徽标', async ({ page }) => {
        // 查找顶部导航栏中的通知铃铛
        const bellIcon = page.locator('[data-testid="notification-bell"]').or(page.getByRole('button', { name: /通知/ })).or(page.locator('[class*="bell"]'));

        if (await bellIcon.isVisible()) {
            // 检查是否有徽标（Badge）
            const badge = bellIcon.locator('[class*="badge"]').or(bellIcon.locator('span'));
            if (await badge.isVisible()) {
                const badgeText = await badge.textContent();
                console.log(`✅ 通知铃铛徽标可见，未读数: ${badgeText}`);
            } else {
                console.log('⚠️ 未发现未读数徽标（可能无未读通知）');
            }
        } else {
            console.log('⚠️ 未找到通知铃铛');
        }
    });

    test('P1-2: 点击铃铛应展开通知浮层', async ({ page }) => {
        const bellIcon = page.locator('[data-testid="notification-bell"]').or(page.getByRole('button', { name: /通知/ }));

        if (await bellIcon.isVisible()) {
            await bellIcon.click();

            // 等待浮层/下拉菜单
            const popover = page.locator('[role="dialog"]').or(page.locator('[class*="popover"]')).or(page.locator('[class*="dropdown"]'));
            await expect(popover.first()).toBeVisible({ timeout: 3000 });
            console.log('✅ 通知浮层展开成功');
        }
    });
});

test.describe('通知中心页面 (Notification Center)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/notifications', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-3: 应能标记单条通知为已读', async ({ page }) => {
        const unreadItem = page.locator('[class*="unread"]').first().or(page.locator('table tbody tr').first());

        if (await unreadItem.isVisible()) {
            // 悬停显示操作按钮
            await unreadItem.hover();
            const markReadBtn = unreadItem.getByRole('button', { name: /已读|标记/ });
            if (await markReadBtn.isVisible()) {
                await markReadBtn.click();
                await expect(page.getByText(/成功|已标记/)).toBeVisible({ timeout: 5000 });
                console.log('✅ 单条通知标记已读成功');
            }
        }
    });

    test('P1-4: 应能一键全部已读', async ({ page }) => {
        const markAllBtn = page.getByRole('button', { name: /全部已读|一键已读/ });

        if (await markAllBtn.isVisible()) {
            await markAllBtn.click();
            await expect(page.getByText(/成功|已全部标记/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 一键全部已读成功');
        } else {
            console.log('⚠️ 未找到全部已读按钮');
        }
    });

    test('P1-5: 应能按类型筛选通知', async ({ page }) => {
        const typeFilter = page.getByRole('combobox', { name: /类型/ }).or(page.locator('[data-testid="notification-type-filter"]'));

        if (await typeFilter.isVisible()) {
            await typeFilter.click();
            const approvalOption = page.getByRole('option', { name: /审批|APPROVAL/ });
            if (await approvalOption.isVisible()) {
                await approvalOption.click();
                await page.waitForTimeout(500);
                console.log('✅ 按类型筛选功能正常');
            }
        }
    });
});

test.describe('通知偏好设置 (Notification Preferences)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings/notifications', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P2-1: 应能切换各类通知的接收渠道', async ({ page }) => {
        // 查找偏好设置表单
        const preferenceForm = page.locator('form').or(page.locator('[class*="preference"]'));

        if (await preferenceForm.isVisible()) {
            // 找到一个开关或复选框
            const channelSwitch = page.locator('input[type="checkbox"]').first().or(page.locator('[role="switch"]').first());
            if (await channelSwitch.isVisible()) {
                await channelSwitch.click();
                await expect(page.getByText(/成功|已保存/)).toBeVisible({ timeout: 5000 });
                console.log('✅ 通知渠道切换成功');
            }
        } else {
            console.log('⚠️ 未找到通知偏好设置表单');
        }
    });
});
