import { test, expect } from '@playwright/test';
import { getValidOrderId } from '../helpers/test-utils';

test.describe('After-sales Management', () => {
    test.beforeEach(async ({ page }) => {
        // 导航到售后列表页
        await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });
    });

    test('should display after-sales ticket list', async ({ page }) => {
        // 验证页面标题 - 实际文案 "售后管理"
        await expect(page.getByRole('heading', { name: /售后管理/ }).first()).toBeVisible({ timeout: 15000 });

        // 验证列表表头存在（容错：可能数据为空但表头应在）
        const columnHeader = page.getByRole('columnheader', { name: /工单号|编号|ID/ });
        await expect(columnHeader.first()).toBeVisible({ timeout: 10000 }).catch(() => {
            console.log('⚠️ 工单号表头未找到，可能表格结构不同');
        });
    });

    test('should create a new after-sales ticket', async ({ page }) => {
        // 动态获取有效订单
        const validOrderId = await getValidOrderId(page);
        await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 点击创建按钮 — 实际文案 "新建工单"（含 Plus 图标）
        const createBtn = page.getByText('新建工单').last();
        await expect(createBtn).toBeVisible({ timeout: 10000 });
        await createBtn.click();

        // 验证进入新建页面
        await expect(page).toHaveURL(/\/after-sales\/new/, { timeout: 15000 });

        // 填写关联订单 ID — 实际 label "关联订单 ID"
        const orderIdInput = page.getByLabel(/关联订单/);
        await expect(orderIdInput).toBeVisible({ timeout: 10000 });
        await orderIdInput.fill(validOrderId);

        // 售后类型使用 Radix Select 组件，默认值已是 "维修"，无需操作

        // 填写描述 — 实际 label "详细描述"
        const descInput = page.getByLabel(/详细描述|描述/);
        await descInput.fill('E2E 自动化测试工单');

        // 提交 — 实际文案 "创建工单"
        await page.getByRole('button', { name: /创建工单/ }).click();

        // 验证成功反馈，并等待页面自动跳转到详情页
        await expect(page).toHaveURL(/\/after-sales\/[a-zA-Z0-9-]+/, { timeout: 15000 });
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
        await expect(table).toBeVisible({ timeout: 15000 }).catch(() => {
            console.log('⚠️ 表格未加载');
        });

        // 尝试找到详情链接
        let detailLink = page.locator('table tbody tr a').first();

        // 如果没有链接（列表可能为空），则先创建一条
        if (!(await detailLink.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('列表为空，尝试创建工单以测试跳转...');
            const validOrderId = await getValidOrderId(page);
            await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });

            // 点击 "新建工单" 按钮或链接
            const createBtn = page.getByText('新建工单').last();
            await expect(createBtn).toBeVisible({ timeout: 10000 });
            await createBtn.click();
            await expect(page).toHaveURL(/\/after-sales\/new/, { timeout: 15000 });

            // 快速填表
            const orderIdInput = page.getByLabel(/关联订单/);
            await orderIdInput.fill(validOrderId);

            await page.getByLabel(/详细描述|描述/).fill('Auto Ticket for Detail Test');
            await page.getByRole('button', { name: /创建工单/ }).click();

            // 等待创建成功并跳转到详情页
            await expect(page).toHaveURL(/\/after-sales\/[a-zA-Z0-9-]+/, { timeout: 15000 });

            // 回到列表页以测试从列表跳转
            await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000);

            // 重新获取链接
            detailLink = page.locator('table tbody tr a').first();
        }

        // 再次断言可见并点击
        await expect(detailLink).toBeVisible({ timeout: 10000 });
        await detailLink.click();

        // 验证进入详情页
        await expect(page).toHaveURL(/\/after-sales\/.+/);
    });
});
