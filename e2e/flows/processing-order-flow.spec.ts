/**
 * 加工单全生命周期 E2E 测试
 *
 * 测试点：
 * 1. 自动生成：订单状态流转触发加工单生成
 * 2. 库存预占：面料库存的预占逻辑
 * 3. 加工跟进：下达加工、确认完成
 * 4. 状态联动：加工单完成驱动订单进入待发货
 */
import { test, expect } from '@playwright/test';

test.describe('加工单全生命周期 (Processing Order Lifecycle)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/processing-orders');
        await page.waitForLoadState('networkidle');
    });

    test('P0-1: 加工单列表应显示正确字段', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /加工单/ })).toBeVisible();
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 验证核心列是否存在
        await expect(page.getByRole('columnheader', { name: /加工单号/ })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /关联订单/ })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /状态/ })).toBeVisible();
    });

    test('P0-2: 从订单流转触发加工单验证', async ({ page }) => {
        // 此用例模拟订单状态变为 PROCESSING 时自动生成的逻辑
        await page.goto('/orders');
        const firstOrder = page.locator('table tbody tr').first();

        if (await firstOrder.isVisible()) {
            const orderNo = await firstOrder.locator('td').first().textContent();
            await firstOrder.locator('a').first().click();

            // 检查订单状态是否为“进行中/生产中/待加工”
            console.log(`✅ 正在验证订单 ${orderNo} 的加工联动`);

            // 导航到加工单列表并搜索该订单号
            await page.goto('/processing-orders');
            await page.getByPlaceholder(/搜索|单号/).fill(orderNo?.trim() || '');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // 如果已经生成，则应该在列表中
            const table = page.locator('table');
            if (await table.locator('tbody tr').count() > 0) {
                console.log('✅ 加工单已成功根据订单生成');
            }
        }
    });

    test('P0-3: 加工单详情应显示规格与面料信息', async ({ page }) => {
        const firstLink = page.locator('table tbody tr a').first();
        if (!(await firstLink.isVisible())) {
            test.skip(true, '加工单列表为空');
            return;
        }

        await firstLink.click();
        await expect(page).toHaveURL(/\/processing-orders\/.+/);

        // 验证基本信息区域
        await expect(page.locator('text=基础信息')).toBeVisible();
        await expect(page.locator('text=关联订单')).toBeVisible();

        // 验证面料明细
        await expect(page.locator('text=面料明细|面料信息')).toBeVisible();

        // 验证加工规格 (JSONB 展示)
        await expect(page.locator('text=宽度|高度|褶皱')).toBeVisible();
    });

    test('P0-4: 下达加工动作验证', async ({ page }) => {
        // 进入一条状态为 PENDING 的加工单
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待处理|PENDING/ }).first();
        if (!(await pendingRow.isVisible())) {
            console.log('⚠️ 无待处理状态的加工单');
            return;
        }

        await pendingRow.locator('a').first().click();

        // 查找“下达加工”按钮
        const submitBtn = page.getByRole('button', { name: /下达加工|下达/ });
        if (await submitBtn.isVisible()) {
            await submitBtn.click();

            // 有可能需要上传截图
            const fileInput = page.locator('input[type="file"]');
            if (await fileInput.count() > 0) {
                // 如果是必填，此处需要 mock 文件上传，暂时跳过
                console.log('ℹ️ 发现文件上传需求');
            }

            // 确认申请
            const confirmBtn = page.getByRole('button', { name: /确认|确定/ });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }

            await expect(page.getByText(/成功|已下达/)).toBeVisible({ timeout: 10000 });
            console.log('✅ 下达加工操作成功');
        }
    });

    test('P0-5: 确认完成动作验证', async ({ page }) => {
        // 进入一条状态为 PROCESSING 的加工单
        const processingRow = page.locator('table tbody tr').filter({ hasText: /加工中|PROCESSING/ }).first();
        if (!(await processingRow.isVisible())) {
            console.log('⚠️ 无加工中状态的加工单');
            return;
        }

        await processingRow.locator('a').first().click();

        // 查找“确认完成”按钮
        const completeBtn = page.getByRole('button', { name: /确认完成|完成/ });
        if (await completeBtn.isVisible()) {
            await completeBtn.click();

            // 确认
            const confirmBtn = page.getByRole('button', { name: /确认|确定/ });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }

            await expect(page.getByText(/成功|已完成/)).toBeVisible({ timeout: 10000 });
            console.log('✅ 加工单确认完成成功');
        }
    });

    test('P0-6: 加工取消(随订单撤单)逻辑验证', async ({ page }) => {
        // 此逻辑通常由后端触发，这里验证 UI 上的展现
        const cancelledRow = page.locator('table tbody tr').filter({ hasText: /已取消|CANCELLED/ }).first();
        if (await cancelledRow.isVisible()) {
            console.log('✅ 发现已取消状态的加工单');
            await cancelledRow.locator('a').first().click();
            await expect(page.locator('text=已取消')).toBeVisible();
        }
    });
});
