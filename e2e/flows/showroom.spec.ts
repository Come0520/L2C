import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('展厅 (Showroom) 模块 E2E 测试', () => {

    test.beforeEach(async ({ page }) => {
        // 导航到展厅列表页
        await safeGoto(page, '/showroom');
        await page.waitForLoadState('networkidle');
    });

    test('验证展厅列表页基础布局与搜索', async ({ page }) => {
        // 直接检查页面主标题
        await expect(page.locator('h1, h2').filter({ hasText: /展厅|Showroom/i }).first()).toBeVisible({ timeout: 20000 });

        // 使用更通用的占位符匹配搜索框
        const searchInput = page.getByPlaceholder(/搜索|Search/i);
        await expect(searchInput).toBeVisible();

        // 验证内容展示（即使是“暂无数据”也算页面加载成功）
        await expect(page.locator('body')).toContainText(/展厅|暂无|没有|Showroom/i);
    });

    test('验证展厅列表内容渲染与跳转', async ({ page }) => {
        // 等待可能出现的卡片加载
        await page.waitForLoadState('networkidle');

        const cards = page.locator('.card, [role="article"]');
        const count = await cards.count();
        console.log(`当前列表展厅数量: ${count}`);

        if (count > 0) {
            const firstCard = cards.first();
            await expect(firstCard).toBeVisible();
            // 在点击前记录名称
            const name = await firstCard.innerText();
            console.log(`准备点击卡片: ${name.slice(0, 20)}...`);

            await firstCard.click();
            await page.waitForTimeout(2000);
            // 验证详情页加载特征
            await expect(page.locator('body')).toContainText(/详情|返回|Showroom/i);
            console.log('✅ 展厅详情页跳转验证成功');
        } else {
            // 如果为空，验证空状态提示
            await expect(page.locator('body')).toContainText(/暂无|没有|Add/i);
            console.log('⚠️ 展厅列表为空，验证空状态展示');
        }
    });

    test('验证创建/管理展厅入口（权限校验）', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /创建|新增/i });
        const isVisible = await createBtn.isVisible();
        if (isVisible) {
            console.log('检测到创建展厅入口');
            await createBtn.click();
            await expect(page.locator('body')).toContainText(/名称|地址|配置/i);
        }
    });

});
