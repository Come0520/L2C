import { test, expect } from '@playwright/test';

test.describe('Approval Flow Designer', () => {
    test('should allow entering the flow designer and seeing designer controls', async ({ page }) => {
        // 1. 导航到审批设置页面
        await page.goto('/settings/approvals', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 2. 点击"审批流程"选项卡
        const tab = page.getByRole('tab', { name: '审批流程' });
        await expect(tab).toBeVisible({ timeout: 15000 });
        await tab.click();

        // 3. 等待页面加载完成，确认流程卡片存在
        await page.waitForTimeout(2000);
        const flowCard = page.getByText('通用审批').first();
        await expect(flowCard).toBeVisible({ timeout: 15000 });

        // 4. 点击进入流程设计器
        await flowCard.click();

        // 5. 验证设计器核心 UI 元素可见
        // 等待 ReactFlow 画布渲染完成
        await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

        // 验证"返回列表"按钮
        await expect(page.getByText('返回列表')).toBeVisible();

        // 验证设计器工具栏按钮存在
        await expect(page.getByText('添加审批人')).toBeVisible();
        await expect(page.getByText('添加条件')).toBeVisible();
        await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
        await expect(page.getByRole('button', { name: '发布' })).toBeVisible();

        // 验证流程起始节点和结束节点存在
        await expect(page.getByText('开始')).toBeVisible();
        await expect(page.getByText('结束')).toBeVisible();
    });
});
