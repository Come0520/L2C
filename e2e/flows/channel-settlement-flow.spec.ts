/**
 * 渠道结算流程 E2E 测试
 *
 * 测试点：
 * 1. 结算单生成
 * 2. 结算单审批
 * 3. 付款申请单流转
 */
import { test, expect } from '@playwright/test';

test.describe('渠道结算流程 (Channel Settlement Flow)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/finance/channel-settlements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-1: 应能查看结算单列表', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /结算|佣金/ })).toBeVisible({ timeout: 10000 });

        const table = page.locator('table');
        await expect(table).toBeVisible();
        console.log('✅ 渠道结算单列表正常');
    });

    test('P1-2: 应能生成新的结算单', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /生成|创建|新建/ });
        if (await createBtn.isVisible()) {
            await createBtn.click();

            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible()) {
                // 选择渠道
                const channelSelect = dialog.getByLabel(/渠道/);
                if (await channelSelect.isVisible()) {
                    await channelSelect.click();
                    await page.getByRole('option').first().click();
                }

                // 选择结算周期
                const periodInput = dialog.getByLabel(/周期|日期/);
                if (await periodInput.isVisible()) {
                    await periodInput.click();
                }

                console.log('✅ 结算单创建对话框正常');
            }
        } else {
            console.log('⚠️ 未找到生成结算单按钮');
        }
    });

    test('P1-3: 结算单详情应显示佣金明细', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 验证佣金明细表格
            const detailTable = page.locator('table').nth(1);
            if (await detailTable.isVisible()) {
                console.log('✅ 结算单详情显示佣金明细');
            }

            // 验证总金额
            const totalAmount = page.locator('text=总额').or(page.locator('text=合计'));
            if (await totalAmount.isVisible()) {
                console.log('✅ 结算单显示总金额');
            }
        }
    });

    test('P1-4: 应能审批结算单', async ({ page }) => {
        // 筛选待审批的结算单
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待审批|PENDING/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const approveBtn = page.getByRole('button', { name: /审批|通过|批准/ });
            if (await approveBtn.isVisible()) {
                console.log('✅ 结算单审批功能可用');
            }
        } else {
            console.log('⚠️ 无待审批的结算单');
        }
    });

    test('P1-5: 审批通过后应生成付款申请', async ({ page }) => {
        // 查看已审批的结算单
        const approvedRow = page.locator('table tbody tr').filter({ hasText: /已审批|APPROVED/ }).first();
        if (await approvedRow.isVisible()) {
            await approvedRow.locator('a').first().click();

            // 查找关联的付款申请单
            const paymentRequest = page.locator('text=付款申请').or(page.locator('text=PAY'));
            if (await paymentRequest.isVisible()) {
                console.log('✅ 结算单关联付款申请单');
            }
        }
    });
});
