import { test, expect } from '@playwright/test';

test.describe('审批流超时与非正常干预验证', () => {

    test.beforeEach(async ({ page }) => {
        // 先跳到可能包含待办审批或者发起审批的入口点，作为前置准备
        await page.goto('/workbench/approvals');
    });

    // 提示：这通常需要后端支持 Mock 时间流逝，或是一个特制的 "触发超时任务" API
    test('触发长时间未处理审批，验证自动升级/拒回警示', async ({ page }) => {
        // 1. 拦截获取审批列表的接口，注入一条超时未处理的 Mock 数据
        await page.route('**/api/approvals*', async route => {
            const response = await route.fetch();
            let json = [];
            try {
                json = await response.json();
            } catch (e) {
                // 如果原始接口不可用，提供完全模拟的数据
            }

            // 构造超时的前置审批节点数据
            const mockedData = [
                {
                    id: 'mock-timeout-approval-1',
                    type: 'QUOTE_DISCOUNT',
                    status: 'PENDING',
                    applicantName: '张三 (测试用)',
                    submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48小时前提交
                    currentNode: '销售总监审批',
                    timeoutWarning: true,  // 附带超时警告标识
                    description: '大型折扣申请：低于底价 15%'
                },
                ...(Array.isArray(json) ? json : [])
            ];

            await route.fulfill({ response, json: mockedData });
        });

        // 2. 刷新页面应用 Mock
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 3. 验证列表中是否出现了明显的“超时/催办”UI提示
        const timeoutItem = page.locator('text=mock-timeout-approval-1').locator('..');
        // 根据实际 UI 库，这可能是个红色的 Badge 或者 特殊的 Icon
        await expect(timeoutItem.locator('text=已超时').or(timeoutItem.locator('.text-destructive'))).toBeVisible({ timeout: 10000 });

        // 4. 作为管理员介入：处理该超时审批
        await timeoutItem.click();

        // 弹出审批详情/抽屉
        const dialog = page.getByRole('dialog').or(page.locator('.drawer-content, [role="document"]'));
        await expect(dialog).toBeVisible();

        // 点击驳回或跳过节点 (使用强制避免弹窗动画阻挡)
        const rejectBtn = dialog.getByRole('button', { name: /驳回|拒绝/ });
        await rejectBtn.click({ force: true });

        // 填写驳回理由
        const reasonInput = page.getByPlaceholder('请输入理由').or(page.locator('textarea'));
        if (await reasonInput.isVisible()) {
            await reasonInput.fill('节点审批人超时未处理，系统管理员介入强制驳回');
        }

        // 确认提交
        const confirmBtn = page.getByRole('button', { name: '确定', exact: true }).or(page.getByRole('button', { name: '提交' }));
        await confirmBtn.click();

        // 验证 Toast 提示
        await expect(page.locator('text=操作成功').or(page.locator('text=已驳回'))).toBeVisible({ timeout: 10000 });
    });
});
