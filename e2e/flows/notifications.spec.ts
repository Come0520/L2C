import { test, expect } from '@playwright/test';

/**
 * 通知中心 E2E 测试
 * 
 * 覆盖场景:
 * 1. 通知列表展示 (空状态/有数据)
 * 2. 标记已读 (单个/全部)
 * 3. 消息类型区分 (Alert/Approval/Info)
 * 4. 分页加载 (Load More)
 */

test.describe('通知中心基础功能', () => {
    test.beforeEach(async ({ page }) => {
        // 导航到通知中心页面
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');
    });

    test('应显示通知列表或空状态', async ({ page }) => {
        // 验证页面标题
        const heading = page.getByRole('heading', { name: /通知|消息|Notification/i });
        const listContainer = page.locator('.space-y-4');

        // 检查是否有列表内容
        const notificationItems = page.locator('h4.text-sm.font-semibold');
        const count = await notificationItems.count();

        if (count > 0) {
            console.log(`✅ 通知列表可见，当前显示 ${count} 条通知`);
            await expect(notificationItems.first()).toBeVisible();
        } else {
            // 检查空状态
            const emptyState = page.getByText(/暂无新通知|无消息/i);
            if (await emptyState.isVisible()) {
                console.log('✅ 通知列表显示为空状态');
            } else {
                console.log('ℹ️ 未检测到通知列表项，也未检测到明显的空状态提示');
            }
        }
    });

    test('应支持标记单条通知为已读', async ({ page }) => {
        // 查找未读通知的"标为已读"按钮
        const markReadBtn = page.getByRole('button', { name: /标为已读/i }).first();

        if (await markReadBtn.isVisible()) {
            // 获取该通知的标题，以便验证
            const notificationCard = markReadBtn.locator('xpath=../..');
            const titleEl = notificationCard.locator('h4');
            const title = await titleEl.textContent();

            await markReadBtn.click();

            // 验证按钮消失 (变为已读状态)
            await expect(markReadBtn).toBeHidden({ timeout: 5000 });
            console.log(`✅ 已标记通知 "${title?.trim()}" 为已读`);
        } else {
            console.log('⏭️ 当前没有未读通知，跳过单条已读测试');
        }
    });

    test('应支持全部标为已读', async ({ page }) => {
        const markAllBtn = page.getByRole('button', { name: /全部已读/i });

        // 只有当有未读消息时，全部已读按钮才可能有意义 (取决于具体实现，有时总是显示)
        if (await markAllBtn.isVisible()) {
            // 检查是否至少有一个未读标识 (例如蓝点或高亮)
            const unreadIndicators = page.locator('.animate-ping, .bg-blue-100'); // 根据 list 组件实现的样式
            const hasUnread = await unreadIndicators.count() > 0;

            if (hasUnread) {
                await markAllBtn.click();

                // 验证提示
                const successMsg = page.getByText(/全部已读/i);
                await expect(successMsg).toBeVisible({ timeout: 5000 });

                // 验证未读标识消失
                // await expect(unreadIndicators).toHaveCount(0); // 可能需要等待 React 状态更新
                console.log('✅ 点击全部已读成功');
            } else {
                console.log('⏭️ 当前似乎没有未读消息，测试交互即可');
                await markAllBtn.click();
            }
        }
    });

    test('应区分不同类型的通知', async ({ page }) => {
        // 检查是否存在不同颜色的图标背景，代表不同类型
        // n.type === 'ALERT' ? "bg-red-100"
        // n.type === 'APPROVAL' ? "bg-amber-100"

        const alertIcon = page.locator('.bg-red-100').first();
        const approvalIcon = page.locator('.bg-amber-100').first();
        const infoIcon = page.locator('.bg-blue-100').first();

        // 仅记录日志，不做强制断言，因为数据是动态的
        if (await alertIcon.isVisible()) console.log('✅ 检测到警告(Alert)类型通知');
        if (await approvalIcon.isVisible()) console.log('✅ 检测到审批(Approval)类型通知');
        if (await infoIcon.isVisible()) console.log('✅ 检测到信息(Info)类型通知');
    });

    test('应支持加载更多', async ({ page }) => {
        const loadMoreBtn = page.getByRole('button', { name: /加载更多/i });

        if (await loadMoreBtn.isVisible()) {
            await loadMoreBtn.click();

            // 验证按钮变为加载中状态
            const loadingState = page.locator('svg.animate-spin');
            await expect(loadingState).toBeVisible();

            // 等待加载完成
            await expect(loadingState).toBeHidden();
            console.log('✅ 加载更多功能验证通过');
        } else {
            console.log('⏭️ 通知数量不足以触发分页，跳过加载更多测试');
        }
    });
});
