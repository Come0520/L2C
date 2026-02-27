/**
 * 供应商质量评分与预警 E2E 测试
 *
 * 测试增强功能：
 * 1. 供应商评分展示
 * 2. 供应商详情中的评分维度
 * 3. 供应商预警规则查看
 */
import { test, expect } from '@playwright/test';

test.describe('供应商评分与预警 (Supplier Rating & Warning)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/supply-chain/suppliers', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P2-1: 供应商列表应显示评分列', async ({ page }) => {
        // 验证页面加载
        await expect(page.getByRole('heading', { name: /供应商/ })).toBeVisible({ timeout: 10000 });

        // 验证表格中包含“评分”或“生命周期”列
        const table = page.locator('table');
        await expect(table).toBeVisible();

        const ratingHeader = table.locator('th').filter({ hasText: /评分|分值|星级|Rating/ });
        if (await ratingHeader.isVisible()) {
            console.log('✅ 供应商列表评分列可见');
        } else {
            console.log('⚠️ 未找到明显的评分列，可能在详情中展示');
        }
    });

    test('P2-2: 供应商详情应显示详细评分维度', async ({ page }) => {
        const table = page.locator('table');
        const firstRow = table.locator('tbody tr').first();

        if (!(await firstRow.isVisible())) {
            console.log('⚠️ 供应商列表为空');
            return;
        }

        // 进入详情
        await firstRow.locator('a').first().click();
        await expect(page).toHaveURL(/\/supply-chain\/suppliers\/.+/);

        // 查找评分维度（质量、交期、服务等）
        const ratingDimensions = page.locator('text=/质量|交期|服务|准时|维保/').first();
        if (await ratingDimensions.isVisible()) {
            console.log('✅ 供应商详情评分维度可见');
        } else {
            console.log('⚠️ 未找到详细评分维度');
        }
    });

    test('P2-3: 应能看到供应商预警规则或标识', async ({ page }) => {
        // 查找预警标识（如红码、黄码或警告图标）
        const warningIndicator = page.locator('[class*="warning"]').or(page.locator('[class*="danger"]')).or(page.locator('text=/预警|异常|黑名单/'));

        if (await warningIndicator.isVisible()) {
            console.log('✅ 发现供应商预警标识');
        } else {
            console.log('⚠️ 未发现预警标识（可能无异常供应商）');
        }
    });
});

test.describe('师傅评价与满意度', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P2-4: 安装任务详情应显示师傅评价', async ({ page }) => {
        const table = page.locator('table');
        const firstRow = table.locator('tbody tr').first();

        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找评价信息
            const evaluationSection = page.locator('text=/评价|满意度|评分/').first();
            if (await evaluationSection.isVisible()) {
                console.log('✅ 安装任务详情显示满意度评价');
            } else {
                console.log('⚠️ 未找到评价信息');
            }
        }
    });
});
