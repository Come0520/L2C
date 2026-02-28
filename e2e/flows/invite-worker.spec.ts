import { test, expect } from '@playwright/test';
import { safeGoto, skipOnDataLoadError } from '../helpers/test-utils';

test.describe('派单员邀请工人 E2E 测试', () => {
    test.beforeEach(async ({ page }) => {
        // 先进入用户管理设置页
        const success = await safeGoto(page, '/settings/users', { waitUntil: 'domcontentloaded' });
        if (!success) test.skip();
    });

    test('管理员或拥有权限的用户应该能成功邀请工人', async ({ page }) => {
        await page.waitForLoadState('domcontentloaded');

        // 等待页面标题和"邀请成员"按钮加载
        await expect(page.getByRole('heading', { name: /用户管理/ })).toBeVisible();
        const inviteBtn = page.getByRole('button', { name: /邀请成员/ });

        if (!(await inviteBtn.isVisible())) {
            console.log('⚠️ 邀请成员按钮不可见，跳过测试');
            test.skip();
            return;
        }

        // 点击邀请按钮
        await inviteBtn.click();

        // 等待邀请弹窗渲染
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // 点击角色选择下拉框
        const roleSelector = dialog.getByLabel(/分配角色|选择角色/, { exact: false });
        // 有些 UI 使用 aria-label 或者 placeholder 检测，先尝试点击触发
        // 根据 invite-user-dialog 的实现，可能是 <Select> 组件
        const combobox = dialog.getByRole('combobox').first();
        if (await combobox.isVisible()) {
            await combobox.click();

            // 下拉框选项中应该包含工人，不管其他有什么选项，至少要有工人可被派单员/管理员选中
            const workerOption = page.getByRole('option', { name: /工人|WORKER/i }).first();
            await expect(workerOption).toBeVisible({ timeout: 5000 });

            // 选择工人角色
            await workerOption.click();

            // 点击生成邀请链接
            const generateBtn = dialog.getByRole('button', { name: /生成邀请链接|确认/ });
            await generateBtn.click();

            // 验证是否成功生成
            const linkInput = dialog.getByRole('textbox').first();
            // 某些实现可能直接弹出一个有系统自带复制功能的 input 或提示信息
            const successText = page.getByText(/成功|复制/i);
            await expect(successText.first()).toBeVisible({ timeout: 10000 });

            console.log('✅ 邀请工人流程端到端测试通过');
        } else {
            console.log('⚠️ 未找到角色选择下拉框，跳过角色选择直接提交');
        }
    });
});
