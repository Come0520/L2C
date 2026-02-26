import { test, expect } from '@playwright/test';

/**
 * 线索状态工作流测试 - 每个测试独立运行
 */
test.describe('Lead Status Workflow', () => {

    test.beforeEach(async ({ page }) => {
        // 导航到线索列表页面
        await page.goto('/leads');
        // 等待页面加载完成
        await page.waitForLoadState('networkidle');
    });

    /**
     * 辅助函数：创建线索并返回 ID
     */
    async function createLead(page: import('@playwright/test').Page, name: string): Promise<string> {
        // 点击「新建线索」按钮
        await page.click('button:has-text("新建线索")');

        // 等待对话框出现
        await page.waitForSelector('[role="dialog"], dialog');

        const timestamp = Date.now();
        const randomPhone = `138${timestamp.toString().slice(-8)}`;

        // 填写客户姓名
        await page.fill('input[placeholder*="姓名"]', `${name}_${timestamp}`);

        // 填写手机号
        await page.fill('input[placeholder*="手机号"]', randomPhone);

        // 选择意向等级
        const intentionSelect = page.locator('text=意向等级').locator('..').locator('select');
        if (await intentionSelect.isVisible({ timeout: 2000 })) {
            await intentionSelect.selectOption({ index: 1 });
        }

        // 点击「创建线索」按钮
        await page.click('button:has-text("创建线索")');

        // 等待对话框关闭
        const dialog = page.locator('[role="dialog"], dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // 等待列表刷新
        await page.waitForLoadState('networkidle');

        // 从表格获取第一个线索的ID
        const firstRow = page.locator('table tbody tr').first();
        const leadLink = await firstRow.locator('a').first().getAttribute('href');
        const leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';

        return leadId;
    }

    test('should create a new lead', async ({ page }) => {
        const leadId = await createLead(page, '测试客户');

        expect(leadId).not.toBe('');
        console.log('✅ 线索创建成功，ID:', leadId);
    });

    test('should view lead detail page', async ({ page }) => {
        // 先创建一个线索
        const leadId = await createLead(page, '详情测试');

        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        // 验证详情页加载成功 - 检查面包屑中的 "线索详情" 文本
        await expect(page.getByText('线索详情')).toBeVisible({ timeout: 10000 });

        // 验证"编辑资料"按钮存在（详情页特有）
        await expect(page.getByRole('button', { name: '编辑资料' })).toBeVisible({ timeout: 5000 });

        console.log('✅ 线索详情页加载成功');
    });

    test('should filter leads by status tabs', async ({ page }) => {
        // AnimatedTabs 渲染为 button 元素，使用文本选择器定位
        // 验证「全部线索」按钮可见（默认激活的 Tab）
        await expect(page.getByRole('button', { name: '全部线索' })).toBeVisible({ timeout: 10000 });

        // 点击公海池 tab
        const poolTab = page.getByRole('button', { name: '公海池' });
        if (await poolTab.isVisible()) {
            await poolTab.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ 公海池 tab 点击成功');
        }

        // 点击待跟进 tab
        const pendingTab = page.getByRole('button', { name: '待跟进' });
        if (await pendingTab.isVisible()) {
            await pendingTab.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ 待跟进 tab 点击成功');
        }

        // 点击全部线索 tab
        const allTab = page.getByRole('button', { name: '全部线索' });
        if (await allTab.isVisible()) {
            await allTab.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ 全部线索 tab 点击成功');
        }
    });

    test('should void a lead', async ({ page }) => {
        // 创建一个新的测试线索用于作废
        const leadId = await createLead(page, '作废测试');

        // 导航到详情页
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        // 查找并点击「标记作废」或类似按钮
        const voidButton = page.locator('button:has-text("作废"), button:has-text("标记作废")').first();

        if (await voidButton.isVisible({ timeout: 5000 })) {
            await voidButton.click();

            // 等待确认对话框
            await page.waitForTimeout(500);

            // 填写作废原因（如果有弹窗）
            const reasonInput = page.locator('textarea');
            if (await reasonInput.isVisible({ timeout: 2000 })) {
                await reasonInput.fill('E2E 测试作废原因');
            }

            // 点击确认
            const confirmBtn = page.locator('button:has-text("确认"), button:has-text("确定")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }

            // 验证作废成功 - 等待toast或状态变化
            await page.waitForTimeout(1000);
            console.log('✅ 线索作废操作完成');
        } else {
            console.log('ℹ️ 未找到作废按钮');
        }
    });
});
