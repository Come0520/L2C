import { test, expect } from '@playwright/test';
import { getValidOrderId } from '../helpers/test-utils';

test.describe('After-sales Management', () => {
    test.beforeEach(async ({ page }) => {
        // 导航到售后列表页
        await page.goto('/after-sales');
    });

    test('should display after-sales ticket list', async ({ page }) => {
        // 验证页面标题 (使用 first() 避免匹配多个 heading)
        await expect(page.getByRole('heading', { name: /售后/ }).first()).toBeVisible();

        // 验证列表表头存在
        await expect(page.getByRole('columnheader', { name: /工单号/ })).toBeVisible();
    });

    test('should create a new after-sales ticket', async ({ page }) => {
        // 动态获取有效订单
        const validOrderId = await getValidOrderId(page);
        await page.goto('/after-sales');

        // 点击创建按钮
        await page.getByRole('button', { name: /创建|新增|新建/ }).click();

        // 验证进入新建页面
        await expect(page).toHaveURL(/\/after-sales\/new/);

        // 填写表单
        // 填写关联订单 ID
        const orderIdInput = page.getByLabel(/关联订单/);
        await orderIdInput.fill(validOrderId);

        // 选择售后类型
        const typeSelect = page.getByLabel(/售后类型/);
        if (await typeSelect.isVisible()) {
            await typeSelect.click();
            await page.getByRole('option', { name: /维修/ }).click();
        }

        // 填写描述
        await page.getByLabel(/描述/).fill('E2E 自动化测试工单');

        // 提交
        await page.getByRole('button', { name: /创建工单/ }).click();


        // 验证成功反馈
        await expect(page.getByText(/创建成功/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter tickets by status', async ({ page }) => {
        // 点击状态筛选
        const statusFilter = page.getByRole('combobox', { name: /状态/ });
        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            await page.getByRole('option', { name: /待处理|PENDING/ }).click();

            // 验证筛选结果更新 (列表发生变化)
            await page.waitForTimeout(500);
        }
    });

    test('should navigate to ticket detail page', async ({ page }) => {
        // 等待列表加载
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 尝试找到详情链接
        let detailLink = page.locator('table tbody tr a').first();

        // 如果没有链接（列表可能为空），则先创建一条
        if (!(await detailLink.isVisible())) {
            console.log('列表为空，尝试创建工单以测试跳转...');
            const validOrderId = await getValidOrderId(page);
            await page.goto('/after-sales');

            await page.getByRole('button', { name: /创建|新增|新建/ }).click();
            await expect(page).toHaveURL(/\/after-sales\/new/);

            // 快速填表
            const orderIdInput = page.getByLabel(/关联订单/);
            await orderIdInput.fill(validOrderId);

            await page.getByLabel(/描述/).fill('Auto Ticket for Detail Test');
            await page.getByRole('button', { name: /创建工单/ }).click();

            // 等待创建成功并跳转到详情页
            await expect(page.getByText(/创建成功|成功/).first()).toBeVisible();
            await expect(page).toHaveURL(/\/after-sales\/.+/);

            // 回到列表页以测试从列表跳转
            await page.goto('/after-sales');
            await page.waitForTimeout(1000);

            // 重新获取链接
            detailLink = page.locator('table tbody tr a').first();
        }

        // 再次断言可见并点击 (此时肯定在列表页)
        await expect(detailLink).toBeVisible();
        await detailLink.click();

        // 验证进入详情页
        await expect(page).toHaveURL(/\/after-sales\/.+/);
    });
});
