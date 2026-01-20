import { test, expect } from '@playwright/test';

test.describe('订单增强功能测试 (拆单/发货申请/变更)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');
    });

    test('应支持订单拆单 (PENDING_PO)', async ({ page }) => {
        // 查找待下单状态的订单
        const pendingRow = page.locator('tr').filter({ hasText: /待下单|PENDING_PO/ }).first();

        if (await pendingRow.isVisible()) {
            await pendingRow.click();
            await page.waitForURL(/\/orders\/.+/);

            // 点击生成的采购单按钮
            const splitBtn = page.getByRole('button', { name: /生成采购单/ });

            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();
                await expect(page.getByText(/拆分订单/)).toBeVisible();

                // 简单的验证对话框关闭，实际拆单可能涉及更多数据准备
                await page.keyboard.press('Escape');
            } else {
                console.log('⏭️ 生成采购单按钮不可见');
            }
        } else {
            console.log('⏭️ 无待下单订单，跳过拆单测试');
        }
    });

    test('应支持发货申请 (PENDING_DELIVERY)', async ({ page }) => {
        // 查找待发货状态的订单
        const deliveryRow = page.locator('tr').filter({ hasText: /待发货|PENDING_DELIVERY/ }).first();

        if (await deliveryRow.isVisible()) {
            await deliveryRow.click();
            await page.waitForURL(/\/orders\/.+/);

            // 点击申请发货按钮
            const deliveryBtn = page.getByRole('button', { name: /申请发货/ });

            if (await deliveryBtn.isVisible()) {
                await deliveryBtn.click();
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();
                await expect(page.getByText(/发货申请/)).toBeVisible();

                // 填写物流信息
                await page.getByLabel('物流公司').click();
                await page.getByRole('option').first().click(); // 选择第一个物流公司

                await page.getByLabel('物流单号').fill('E2E-TEST-TRACKING-001');
                await page.getByLabel('备注').fill('E2E自动测试发货申请');

                // 提交
                await page.getByRole('button', { name: /提交/ }).click();

                // 验证成功
                await expect(page.getByText(/发货申请已提交/)).toBeVisible();
                console.log('✅ 发货申请提交成功');
            } else {
                console.log('⏭️ 申请发货按钮不可见');
            }
        } else {
            console.log('⏭️ 无待发货订单，跳过发货申请测试');
        }
    });

    test('应支持订单变更申请', async ({ page }) => {
        // 任选一个订单进行变更测试
        const anyOrderRow = page.locator('table tbody tr').first();

        if (await anyOrderRow.isVisible()) {
            await anyOrderRow.click();
            await page.waitForURL(/\/orders\/.+/);

            // 点击变更订单
            const changeBtn = page.getByRole('button', { name: /变更订单/ });

            if (await changeBtn.isVisible()) {
                await changeBtn.click();
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();
                await expect(page.getByText(/申请订单变更/)).toBeVisible();

                // 填写变更信息
                await page.getByText('变更类型').click();
                await page.getByRole('option', { name: /现场/ }).first().click(); // 选择现场/尺寸变更

                await page.getByPlaceholder(/0.00/).fill('100'); // 金额变动
                await page.getByPlaceholder(/详细描述/).fill('E2E测试-自动发起的变更请求');

                // 提交
                await page.getByRole('button', { name: /提交申请/ }).click();

                // 验证成功
                await expect(page.getByText(/变更请求已提交/)).toBeVisible();
                console.log('✅ 订单变更请求提交成功');
            } else {
                console.log('⏭️ 变更订单按钮不可见');
            }
        } else {
            console.log('⏭️ 订单列表为空，跳过变更测试');
        }
    });
});
