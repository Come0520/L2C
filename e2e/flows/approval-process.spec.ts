import { test, expect } from '@playwright/test';

test.describe('Approval Process Flow', () => {

    test('should verify ORDER_CHANGE flow exists and is configurable', async ({ page }) => {
        // 1. 导航到审批设置页面
        await page.goto('/settings/approvals', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 2. 点击"审批流程"选项卡
        const tab = page.getByRole('tab', { name: '审批流程' });
        await expect(tab).toBeVisible({ timeout: 15000 });
        await tab.click();

        // 3. 等待流程列表加载，确认 ORDER_CHANGE 流程存在
        await page.waitForTimeout(2000);
        const orderChangeCard = page.getByText('ORDER_CHANGE').first();
        await expect(orderChangeCard).toBeVisible({ timeout: 15000 });

        // 4. 点击进入 ORDER_CHANGE 流程设计器
        await orderChangeCard.click();

        // 5. 验证设计器加载成功
        await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

        // 验证流程起始节点和结束节点存在
        await expect(page.getByText('开始')).toBeVisible();
        await expect(page.getByText('结束')).toBeVisible();

        // 验证设计器工具栏可用
        await expect(page.getByText('添加审批人')).toBeVisible();
        await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
        await expect(page.getByRole('button', { name: '发布' })).toBeVisible();
    });
});
