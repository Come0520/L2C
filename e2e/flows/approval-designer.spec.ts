import { test, expect } from '@playwright/test';

test.describe('Approval Flow Designer', () => {
    test('should allow creating and publishing a simple flow', async ({ page }) => {
        // 1. Navigate to Settings -> Approvals
        await page.goto('/settings/approvals');

        // 2. Select "Approval Flows" tab
        await page.getByRole('tab', { name: '审批流程' }).click();

        // 3. Select a Flow
        const firstFlow = page.locator('.cursor-pointer').first();
        await expect(firstFlow).toBeVisible({ timeout: 10000 });
        await firstFlow.click();

        // 4. Designer Check
        await expect(page.getByText('开始')).toBeVisible();
        await expect(page.getByText('结束')).toBeVisible();

        // Debug
        const buttons = await page.getByRole('button').allInnerTexts();
        console.log('Available buttons:', buttons);

        // 5. Add Approver Node
        // Using force click to ensure we hit it even if slight overlay
        await page.getByRole('button', { name: '添加审批人' }).click({ force: true });

        // Check if node added (might need wait)
        await expect(page.getByText('审批节点').last()).toBeVisible();

        // 6. Configure Node (Click new node)
        const nodes = page.getByText('审批节点');
        await nodes.last().click();

        // 7. Check Config Panel
        await expect(page.getByText('节点配置')).toBeVisible();
        await page.getByLabel('节点名称').fill('E2E Test Step');

        // 8. Save
        await page.getByRole('button', { name: '保存' }).click();
        await expect(page.getByText('流程保存成功')).toBeVisible(); // Toast check

        // 9. Publish
        await page.getByRole('button', { name: '发布' }).click();
        await expect(page.getByText('流程已发布并生效')).toBeVisible();
    });
});
