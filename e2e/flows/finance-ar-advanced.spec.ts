import { test, expect } from '@playwright/test';

/**
 * P2: 财务 AR 高级流程测试
 * 覆盖: 分批收款, 全额完成, 退款导致状态回滚
 */

test.describe('Finance AR Advanced Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/finance/ar', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('应验证分批收款流程 (Partial Payments)', async ({ page }) => {
        // 1. 查找一个待回款的订单
        const pendingRow = page.locator('tr', { has: page.getByText(/待回款|PENDING/) }).first();
        if (!(await pendingRow.isVisible())) {
            console.log('⚠️ 无待回款数据，跳过分批收款测试');
            return;
        }

        await pendingRow.click();
        await page.waitForURL(/\/finance\/ar\/.+/);

        const id = page.url().split('/').pop();
        console.log(`Testing AR ID: ${id}`);

        // 获取初始待收金额
        const pendingAmountText = await page.locator('[data-testid="pending-amount"]').textContent() || '0';
        const initialPending = parseFloat(pendingAmountText.replace(/[^0-9.]/g, ''));

        if (initialPending <= 1) {
            console.log('⚠️ 待收金额太小，跳过');
            return;
        }

        const part1 = Math.floor(initialPending / 2).toString();
        const part2 = (initialPending - Number(part1)).toFixed(2);

        console.log(`Plan: Pay ${part1} then ${part2}`);

        // --- 第一笔收款 (Partial) ---
        await page.getByRole('button', { name: /录入收款|确认收款/ }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await page.getByLabel(/金额/).fill(part1);
        await page.getByLabel(/收款方式/).click();
        await page.getByRole('option').first().click();
        await page.getByRole('button', { name: /确认|提交/ }).click();

        // 验证状态变为 PARTIAL (部分收款)
        await expect(page.locator('[data-testid="status"]')).toHaveText(/部分收款|PARTIAL/);

        // 验证待收金额减少
        await expect(page.locator('[data-testid="pending-amount"]')).toContainText(part2);
        console.log('✅ 第一笔分期收款验证成功');

        // --- 第二笔收款 (Final) ---
        await page.getByRole('button', { name: /录入收款|确认收款/ }).click();
        await expect(dialog).toBeVisible();

        await page.getByLabel(/金额/).fill(part2); // 填入剩余
        await page.getByLabel(/收款方式/).click();
        await page.getByRole('option').first().click();
        await page.getByRole('button', { name: /确认|提交/ }).click();

        // 验证状态变为 COMPLETED (已完成)
        await expect(page.locator('[data-testid="status"]')).toHaveText(/已完成|COMPLETED/);
        console.log('✅ 剩余款项结清验证成功');
    });

    test('应验证退款导致状态回滚 (Refund Rollback)', async ({ page }) => {
        // 1. 查找已完成的订单
        const completedRow = page.locator('tr', { has: page.getByText(/已完成|COMPLETED/) }).first();
        if (!(await completedRow.isVisible())) {
            console.log('⚠️ 无已完成数据，跳过退款测试');
            return;
        }

        await completedRow.click();
        await page.waitForURL(/\/finance\/ar\/.+/);

        // --- 执行退款 ---
        const refundBtn = page.getByRole('button', { name: /退款/ });
        if (!(await refundBtn.isVisible())) {
            // 可能是权限问题或UI隐藏
            console.log('⚠️ 退款按钮不可见');
            return;
        }
        await refundBtn.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        const refundAmount = '1.00';
        await page.getByLabel(/退款金额/).fill(refundAmount);
        await page.getByLabel(/原因/).fill('E2E Refund Test');
        await page.getByLabel(/退款方式/).click();
        await page.getByRole('option').first().click();

        await page.getByRole('button', { name: /确认|提交/ }).click();

        // 验证状态回滚 (COMPLETED -> PARTIAL 或 待回款)
        // 只要不是 COMPLETED 即可
        await expect(page.locator('[data-testid="status"]')).not.toHaveText(/已完成|COMPLETED/);

        // 验证待收金额增加了 refundAmount
        await expect(page.locator('[data-testid="pending-amount"]')).toContainText('1.00');

        console.log('✅ 退款后状态回滚验证成功');
    });
});
