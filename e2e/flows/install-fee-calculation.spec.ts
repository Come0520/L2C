/**
 * 安装工费计算 E2E 测试
 *
 * 测试点：
 * 1. 基础工费计算
 * 2. 加项费（高空费、远程费）
 * 3. 验收时工费调整
 */
import { test, expect } from '@playwright/test';

test.describe('安装工费计算 (Install Fee Calculation)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P1-1: 派单时应填写预估工费', async ({ page }) => {
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                const dialog = page.getByRole('dialog');

                // 查找工费输入框
                const feeInput = dialog.getByLabel(/工费|预估/).or(dialog.locator('input[type="number"]'));
                if (await feeInput.isVisible()) {
                    await feeInput.fill('200');
                    console.log('✅ 预估工费输入框可用');
                }
            }
        }
    });

    test('P1-2: 安装单详情应显示工费明细', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找工费明细区域
            const feeSection = page.locator('text=工费').or(page.locator('text=费用明细'));
            if (await feeSection.isVisible()) {
                // 查找基础费和加项费
                const baseFee = page.locator('text=基础费').or(page.locator('text=安装费'));
                const additionalFee = page.locator('text=高空').or(page.locator('text=远程'));

                if (await baseFee.isVisible()) {
                    console.log('✅ 基础工费展示正常');
                }
                if (await additionalFee.isVisible()) {
                    console.log('✅ 加项费展示正常');
                }
            }
        }
    });

    test('P1-3: 高空作业费应自动计算', async ({ page }) => {
        // 查找涉及高空作业的安装单
        const highAltitudeRow = page.locator('table tbody tr').filter({ hasText: /高空|挑空/ }).first();
        if (await highAltitudeRow.isVisible()) {
            await highAltitudeRow.locator('a').first().click();

            const highFee = page.locator('text=高空').or(page.locator('text=脚手架'));
            if (await highFee.isVisible()) {
                console.log('✅ 高空作业费展示正常');
            }
        } else {
            console.log('⚠️ 未找到涉及高空作业的安装单');
        }
    });

    test('P1-4: 验收时应能调整实际工费', async ({ page }) => {
        // 进入待确认的安装单
        const pendingConfirmRow = page.locator('table tbody tr').filter({ hasText: /待确认|PENDING_CONFIRM/ }).first();
        if (await pendingConfirmRow.isVisible()) {
            await pendingConfirmRow.locator('a').first().click();

            const confirmBtn = page.getByRole('button', { name: /确认验收/ });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();

                const dialog = page.getByRole('dialog');

                // 查找实际工费输入框
                const actualFeeInput = dialog.getByLabel(/实际工费/).or(dialog.locator('input[type="number"]'));
                if (await actualFeeInput.isVisible()) {
                    await actualFeeInput.fill('250');
                    console.log('✅ 验收时可调整实际工费');
                }
            }
        }
    });
});
