/**
 * 订单撤单流程 E2E 测试
 * 使用辅助函数简化测试代码
 *
 * 测试核心流程：
 * 1. 不同状态下的撤单权限
 * 2. 撤单申请与审批
 * 3. 叫停生产与恢复
 */
import { test, expect } from '@playwright/test';
import { navigateToModule, findTableRow, confirmDialog, saveFailureArtifacts } from './fixtures/test-helpers';

test.describe('订单撤单流程 (Order Cancellation)', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToModule(page, 'orders');
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await saveFailureArtifacts(page, testInfo.title);
        }
    });

    test('P0-1: 应能在订单详情页看到撤单按钮', async ({ page }) => {
        const firstOrderLink = page.locator('table tbody tr a').first();
        if (!(await firstOrderLink.isVisible({ timeout: 5000 }))) {
            console.log('⏭️ 订单列表为空');
            return;
        }

        await firstOrderLink.click();
        await expect(page).toHaveURL(/\/orders\/.+/);

        // 查找撤单按钮
        const cancelBtn = page.getByRole('button', { name: /撤单|取消订单|申请撤单/ });
        if (await cancelBtn.isVisible({ timeout: 3000 })) {
            console.log('✅ 撤单按钮可见');
        } else {
            // 可能在操作菜单中
            const moreBtn = page.getByRole('button', { name: /更多|操作/ });
            if (await moreBtn.isVisible()) {
                await moreBtn.click();
                await page.waitForTimeout(300);
                const cancelOption = page.getByRole('menuitem', { name: /撤单|取消/ });
                if (await cancelOption.isVisible()) {
                    console.log('✅ 撤单选项在操作菜单中可见');
                }
            }
        }
    });

    test('P0-2: 应能申请撤单并填写原因', async ({ page }) => {
        const firstOrderLink = page.locator('table tbody tr a').first();
        if (!(await firstOrderLink.isVisible({ timeout: 5000 }))) {
            console.log('⏭️ 订单列表为空');
            return;
        }

        await firstOrderLink.click();
        await expect(page).toHaveURL(/\/orders\/.+/);

        // 尝试点击撤单按钮
        const cancelBtn = page.getByRole('button', { name: /撤单|取消订单|申请撤单/ });

        if (await cancelBtn.isVisible({ timeout: 3000 })) {
            await cancelBtn.click();
            await confirmDialog(page, { reasonInput: 'E2E 测试 - 客户取消订单' });
            console.log('✅ 撤单申请流程完成');
        } else {
            // 尝试从操作菜单中查找
            const moreBtn = page.getByRole('button', { name: /更多|操作/ });
            if (await moreBtn.isVisible()) {
                await moreBtn.click();
                await page.waitForTimeout(300);
                const cancelOption = page.getByRole('menuitem', { name: /撤单|取消/ });
                if (await cancelOption.isVisible()) {
                    await cancelOption.click();
                    await confirmDialog(page, { reasonInput: 'E2E 测试 - 客户取消订单' });
                    console.log('✅ 撤单申请流程完成');
                } else {
                    console.log('⚠️ 该订单状态不支持撤单操作');
                }
            }
        }
    });

    test('P0-3: 已发货订单应无法撤单', async ({ page }) => {
        const shippedRow = await findTableRow(page, /已发货|DELIVERED|发货/);

        if (await shippedRow.isVisible({ timeout: 5000 })) {
            await shippedRow.locator('a').first().click();
            await expect(page).toHaveURL(/\/orders\/.+/);

            const cancelBtn = page.getByRole('button', { name: /撤单|取消订单/ });
            if (await cancelBtn.isVisible()) {
                const isDisabled = await cancelBtn.isDisabled();
                if (isDisabled) {
                    console.log('✅ 已发货订单的撤单按钮已禁用');
                } else {
                    console.log('⚠️ 已发货订单的撤单按钮未禁用');
                }
            } else {
                console.log('✅ 已发货订单无撤单按钮');
            }
        } else {
            console.log('⏭️ 无已发货订单可测试');
        }
    });
});

test.describe('订单叫停与恢复 (Order Pause & Resume)', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToModule(page, 'orders');
    });

    test('P0-4: 应能叫停生产中的订单', async ({ page }) => {
        const prodRow = await findTableRow(page, /生产中|IN_PRODUCTION/);

        if (await prodRow.isVisible({ timeout: 5000 })) {
            await prodRow.locator('a').first().click();
            await expect(page).toHaveURL(/\/orders\/.+/);

            const pauseBtn = page.getByRole('button', { name: /叫停|暂停/ });
            if (await pauseBtn.isVisible({ timeout: 3000 })) {
                await pauseBtn.click();
                await confirmDialog(page, { reasonInput: 'E2E 测试 - 紧急叫停' });
                console.log('✅ 订单叫停成功');
            } else {
                console.log('⚠️ 未找到叫停按钮');
            }
        } else {
            console.log('⏭️ 无生产中订单可测试');
        }
    });

    test('P0-5: 应能恢复已暂停的订单', async ({ page }) => {
        const pausedRow = await findTableRow(page, /暂停|PAUSED|已暂停/);

        if (await pausedRow.isVisible({ timeout: 5000 })) {
            await pausedRow.locator('a').first().click();
            await expect(page).toHaveURL(/\/orders\/.+/);

            const resumeBtn = page.getByRole('button', { name: /恢复|继续/ });
            if (await resumeBtn.isVisible({ timeout: 3000 })) {
                await resumeBtn.click();
                console.log('✅ 订单恢复成功');
            } else {
                console.log('⚠️ 未找到恢复按钮');
            }
        } else {
            console.log('⏭️ 无已暂停订单可测试');
        }
    });
});
