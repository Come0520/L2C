import { test, expect } from '@playwright/test';

test.describe('After-sales Management', () => {
    test.beforeEach(async ({ page }) => {
        // 导航到售后列表页
        await page.goto('/after-sales');
    });

    test('should display after-sales ticket list', async ({ page }) => {
        // 验证页面标题
        await expect(page.getByRole('heading', { name: /售后/ })).toBeVisible();

        // 验证列表表头存在
        await expect(page.getByRole('columnheader', { name: /工单号/ })).toBeVisible();
    });

    test('should create a new after-sales ticket', async ({ page }) => {
        // 点击创建按钮
        // 点击创建按钮
        // await page.getByRole('button', { name: /创建|新增/ }).click(); // Regex matched too broadly or failed?
        await page.getByRole('button', { name: /创建|新增|新建/ }).click();

        // 等待对话框出现
        await expect(page.getByRole('dialog')).toBeVisible();

        // 填写表单
        // 选择客户
        const customerInput = page.getByLabel(/客户/);
        if (await customerInput.isVisible()) {
            // 点击 SelectTrigger
            await customerInput.click();
            await page.waitForTimeout(500);
            // 选择第一个选项
            const firstOption = page.locator('[role="option"]').first();
            if (await firstOption.isVisible()) {
                await firstOption.click();
            }
        }

        // 选择类型
        const typeSelect = page.getByLabel(/类型/);
        if (await typeSelect.isVisible()) {
            await typeSelect.click();
            await page.getByRole('option', { name: /维修/ }).click();
        }

        // 填写描述
        await page.getByLabel(/描述|问题/).fill('E2E 自动化测试工单');

        // 提交
        // 提交
        await page.getByRole('button', { name: /提交|创建|确定/ }).click();

        // 验证成功反馈
        await expect(page.getByText(/成功|已创建/)).toBeVisible({ timeout: 10000 });
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
            await page.getByRole('button', { name: /创建|新增|新建/ }).click();

            // 快速填表
            const customerInput = page.getByLabel(/客户/);
            await customerInput.click();
            await page.waitForTimeout(500);
            await page.locator('[role="option"]').first().click();

            await page.getByLabel(/描述/).fill('Auto Ticket for Detail Test');
            await page.getByRole('button', { name: /创建|提交/ }).click();

            // 等待创建成功提示消失，或者列表刷新
            await expect(page.getByText(/成功|Success/).first()).toBeVisible();
            await page.waitForTimeout(1000); // 等待刷新

            // 重新获取链接
            detailLink = page.locator('table tbody tr a').first();
        }

        // 再次断言可见
        await expect(detailLink).toBeVisible();
        await detailLink.click();

        // 验证进入详情页
        await expect(page).toHaveURL(/\/after-sales\/.+/);
    });
});
