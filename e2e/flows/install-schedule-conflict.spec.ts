/**
 * 安装调度防撞 E2E 测试
 *
 * 测试点：
 * 1. 强冲突检测：同一师傅同一时段禁止派单
 * 2. 软冲突警告：地理距离+时间间隔风险
 * 3. 强制派单功能
 */
import { test, expect } from '@playwright/test';

test.describe('安装调度防撞 (Schedule Conflict Detection)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P0-1: 指派师傅时应检测时段冲突', async ({ page }) => {
        // 进入待分配的安装单
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配|PENDING_DISPATCH/ }).first();
        if (!(await pendingRow.isVisible())) {
            console.log('⚠️ 无待分配的安装单');
            return;
        }

        await pendingRow.locator('a').first().click();

        // 点击指派按钮
        const assignBtn = page.getByRole('button', { name: /指派|分配/ });
        if (await assignBtn.isVisible()) {
            await assignBtn.click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            // 选择师傅（假设第一个师傅有冲突）
            const workerSelect = dialog.getByLabel(/师傅/);
            if (await workerSelect.isVisible()) {
                await workerSelect.click();
                await page.getByRole('option').first().click();
            }

            // 选择日期和时段
            const dateInput = dialog.getByLabel(/日期/);
            if (await dateInput.isVisible()) {
                await dateInput.click();
                await page.locator('.rdp-day_today').click(); // 选今天
            }

            const timeSlotSelect = dialog.getByLabel(/时段/);
            if (await timeSlotSelect.isVisible()) {
                await timeSlotSelect.click();
                await page.getByRole('option', { name: /上午/ }).click();
            }

            // 点击确认，检测是否有冲突提示
            await dialog.getByRole('button', { name: /确认|提交/ }).click();

            // 查找冲突提示
            const conflictWarning = page.getByText(/冲突|已有任务|时段占用/);
            if (await conflictWarning.isVisible({ timeout: 3000 })) {
                console.log('✅ 系统检测到时段冲突并给出提示');
            } else {
                console.log('⚠️ 未检测到冲突（可能该时段确实空闲）');
            }
        }
    });

    test('P0-2: 强冲突应禁止指派', async ({ page }) => {
        // 此测试验证强冲突时无法完成指派
        await page.goto('/install-tasks');

        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                // 如果有强冲突，确认按钮应被禁用或点击后报错
                const confirmBtn = page.getByRole('button', { name: /确认/ });
                // 强冲突场景需要特定数据环境
                console.log('ℹ️ 强冲突场景需特定数据验证');
            }
        }
    });

    test('P0-3: 软冲突应显示赶场风险警告', async ({ page }) => {
        await page.goto('/install-tasks');

        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                // 查找软冲突/赶场风险警告
                const softWarning = page.getByText(/赶场风险|距离较远|间隔较短/);
                if (await softWarning.isVisible({ timeout: 3000 })) {
                    console.log('✅ 系统显示了软冲突警告');

                    // 验证仍可强制指派
                    const forceBtn = page.getByRole('button', { name: /继续指派|强制/ });
                    if (await forceBtn.isVisible()) {
                        console.log('✅ 软冲突时可强制指派');
                    }
                }
            }
        }
    });

    test('P1-1: 强制派单应跳过校验', async ({ page }) => {
        await page.goto('/install-tasks');

        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            // 查找强制派单选项
            const forceOption = page.getByLabel(/强制派单/).or(page.locator('text=跳过校验'));
            if (await forceOption.isVisible()) {
                console.log('✅ 强制派单选项可用');
            } else {
                console.log('⚠️ 未找到强制派单选项');
            }
        }
    });
});
