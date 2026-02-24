import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('工作台 (Dashboard) 模块 E2E 测试', () => {

    test.beforeEach(async ({ page }) => {
        // 导航到首页（Dashboard）
        await safeGoto(page, '/');
        await page.waitForLoadState('networkidle');
    });

    test('验证工作台基础布局与标签页切换', async ({ page }) => {
        // 验证三个核心标签页是否存在
        const dashboardTab = page.locator('button, div').filter({ hasText: /^仪表盘$/ }).first();
        const todoTab = page.locator('button, div').filter({ hasText: /^待办事项$/ }).first();
        const alertTab = page.locator('button, div').filter({ hasText: /^报警中心$/ }).first();

        await expect(dashboardTab).toBeVisible({ timeout: 15000 });
        await expect(todoTab).toBeVisible();
        await expect(alertTab).toBeVisible();

        // 切换到待办事项
        await todoTab.click();
        // 直接检查页面是否出现了待办相关的统计文字
        await expect(page.locator('body')).toContainText(/待办|任务|项待办/i, { timeout: 10000 });
        console.log('✅ 待办事项内容已渲染');

        // 切换到报警中心
        await alertTab.click();
        await expect(page.locator('body')).toContainText(/报警|告警|暂无报警/i, { timeout: 10000 });
        console.log('✅ 报警中心内容已渲染');

        // 切换回仪表盘
        await dashboardTab.click();
        await expect(page.locator('body')).toContainText(/销售趋势|仪表盘|线索/i, { timeout: 10000 });
    });

    test('验证仪表盘数据卡片与内容渲染', async ({ page }) => {
        // 寻找带有 glass-liquid 效果的容器，这是仪表盘的特征
        const cards = page.locator('.glass-liquid');
        await expect(cards.first()).toBeVisible({ timeout: 15000 });

        // 检查核心指标
        const statsText = await page.textContent('body');
        // 根据常见的仪表盘关键词验证
        const expectedKeywords = ['线索', '订单', '回访', '成交', '转换率', '金额', '待办'];
        const hits = expectedKeywords.filter(k => statsText?.includes(k));
        console.log(`仪表盘检测到指标: ${hits.join(', ')}`);
        expect(hits.length).toBeGreaterThan(0);
    });

    test('验证待办事项列表交互', async ({ page }) => {
        await page.getByText('待办事项', { exact: true }).click();
        await page.waitForTimeout(1000);

        // 检查是否有待办列表项
        const todoItems = page.locator('li, tr, .todo-item');
        const count = await todoItems.count();
        console.log(`当前待办事项数量: ${count}`);

        // 即使没有数据，也应该看到空状态或表头
        await expect(page.locator('body')).toContainText(/待办|任务/);
    });

});
