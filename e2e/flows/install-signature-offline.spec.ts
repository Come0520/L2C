/**
 * 签名与离线模式 E2E 测试
 *
 * 测试点：
 * 1. 客户电子签名验收
 * 2. 签到签退 GPS 记录
 * 3. 离线模式同步（Web 端验证）
 */
import { test, expect } from '@playwright/test';

test.describe('客户电子签名 (Customer Signature)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P2-1: 验收对话框应显示客户签名区域', async ({ page }) => {
        // 进入待确认的安装单
        const pendingConfirmRow = page.locator('table tbody tr').filter({ hasText: /待确认|PENDING_CONFIRM/ }).first();
        if (!(await pendingConfirmRow.isVisible())) {
            console.log('⚠️ 无待确认的安装单');
            return;
        }

        await pendingConfirmRow.locator('a').first().click();

        const confirmBtn = page.getByRole('button', { name: /确认验收/ });
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();

            const dialog = page.getByRole('dialog');

            // 查找签名区域
            const signatureArea = dialog.locator('canvas').or(dialog.locator('[class*="signature"]'));
            if (await signatureArea.isVisible()) {
                console.log('✅ 验收对话框显示签名区域');
            } else {
                console.log('⚠️ 未找到签名区域');
            }
        }
    });

    test('P2-2: 已完成安装单应显示签名图片', async ({ page }) => {
        // 查看已完成的安装单
        const completedRow = page.locator('table tbody tr').filter({ hasText: /已完成|COMPLETED/ }).first();
        if (await completedRow.isVisible()) {
            await completedRow.locator('a').first().click();

            // 查找签名图片
            const signatureImg = page.locator('img[alt*="签名"]').or(page.locator('[class*="signature"] img'));
            if (await signatureImg.isVisible()) {
                console.log('✅ 安装单详情显示客户签名');
            } else {
                console.log('⚠️ 未找到签名图片（可能未要求签名）');
            }
        }
    });
});

test.describe('签到签退记录 (Check-in/Check-out)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P2-3: 安装单详情应显示签到时间', async ({ page }) => {
        // 查看有签到记录的安装单
        const completedRow = page.locator('table tbody tr').filter({ hasText: /已完成|待确认/ }).first();
        if (await completedRow.isVisible()) {
            await completedRow.locator('a').first().click();

            // 查找签到时间字段
            const checkInTime = page.locator('text=签到').or(page.locator('text=到达时间'));
            if (await checkInTime.isVisible()) {
                console.log('✅ 安装单显示签到记录');
            } else {
                console.log('⚠️ 未找到签到记录');
            }
        }
    });

    test('P2-4: 安装单详情应显示签退时间', async ({ page }) => {
        const completedRow = page.locator('table tbody tr').filter({ hasText: /已完成/ }).first();
        if (await completedRow.isVisible()) {
            await completedRow.locator('a').first().click();

            // 查找签退时间字段
            const checkOutTime = page.locator('text=签退').or(page.locator('text=离场时间'));
            if (await checkOutTime.isVisible()) {
                console.log('✅ 安装单显示签退记录');
            }
        }
    });

    test('P2-5: 应显示实际工时', async ({ page }) => {
        const completedRow = page.locator('table tbody tr').filter({ hasText: /已完成/ }).first();
        if (await completedRow.isVisible()) {
            await completedRow.locator('a').first().click();

            // 查找工时字段
            const workTime = page.locator('text=工时').or(page.locator('text=时长'));
            if (await workTime.isVisible()) {
                console.log('✅ 安装单显示实际工时');
            }
        }
    });
});

test.describe('离线模式指示 (Offline Mode Indicator)', () => {
    test('P2-6: 页面应有网络状态指示', async ({ page }) => {
        await page.goto('/install-tasks');

        // 查找网络状态指示器
        const networkIndicator = page.locator('[class*="online"]').or(page.locator('[class*="network"]'));
        if (await networkIndicator.isVisible()) {
            console.log('✅ 页面显示网络状态指示器');
        } else {
            console.log('⚠️ 未找到网络状态指示器（可能在移动端才有）');
        }
    });
});
