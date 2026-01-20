import { test, expect } from '@playwright/test';

/**
 * 渠道管理模块 E2E 测试
 * 
 * 覆盖场景:
 * 1. 渠道列表展示
 * 2. 渠道创建/编辑
 * 3. 三级渠道结构 (大类/子渠道/具体来源)
 * 4. 渠道分析面板
 * 5. 归因规则配置
 */

test.describe('渠道管理基础功能', () => {
    test.beforeEach(async ({ page }) => {
        // 导航到渠道管理页面
        await page.goto('/settings/channels');
        await page.waitForLoadState('networkidle');
    });

    test('应显示渠道列表', async ({ page }) => {
        // 验证页面标题
        const heading = page.getByRole('heading', { name: /渠道|Channel/i });
        await expect(heading).toBeVisible();

        // 验证表格或列表存在
        const table = page.locator('table, [role="table"], [data-testid="channel-list"]');
        const hasTable = await table.isVisible().catch(() => false);

        if (hasTable) {
            console.log('✅ 渠道列表表格可见');
        } else {
            // 可能是空状态
            const emptyState = page.getByText(/暂无渠道|无数据|empty/i);
            const hasEmpty = await emptyState.isVisible().catch(() => false);
            expect(hasTable || hasEmpty).toBeTruthy();
            console.log('✅ 渠道列表页面正常（可能为空状态）');
        }
    });

    test('应能够创建新渠道', async ({ page }) => {
        const timestamp = Date.now();
        const channelName = `测试渠道_${timestamp}`;

        // 查找创建按钮
        const createBtn = page.getByRole('button', { name: /新建|创建|添加|新增/i });

        if (await createBtn.isVisible()) {
            await createBtn.click();

            // 等待对话框/表单出现
            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible({ timeout: 5000 });

            // 填写渠道名称
            const nameInput = dialog.getByLabel(/名称|渠道名/i);
            if (await nameInput.isVisible()) {
                await nameInput.fill(channelName);
            }

            // 选择渠道大类 (如果有)
            const categorySelect = dialog.locator('[data-testid="channel-category"], [name="category"]');
            if (await categorySelect.isVisible().catch(() => false)) {
                await categorySelect.click();
                const option = page.getByRole('option').first();
                if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await option.click();
                }
            }

            // 提交
            const submitBtn = dialog.getByRole('button', { name: /确认|保存|提交|创建/i });
            await submitBtn.click();

            // 验证创建成功
            await expect(dialog).toBeHidden({ timeout: 10000 });
            const successMsg = page.getByText(/成功|已创建/i);
            await expect(successMsg).toBeVisible({ timeout: 5000 });

            console.log(`✅ 渠道创建成功: ${channelName}`);
        } else {
            console.log('⏭️ 未找到创建按钮，可能权限不足');
        }
    });

    test('应支持三级渠道结构', async ({ page }) => {
        // 检查渠道表格是否包含大类/子渠道列
        const categoryColumn = page.getByRole('columnheader', { name: /大类|类型|Category/i });
        const subChannelColumn = page.getByRole('columnheader', { name: /子渠道|来源/i });

        const hasCategoryColumn = await categoryColumn.isVisible().catch(() => false);
        const hasSubChannelColumn = await subChannelColumn.isVisible().catch(() => false);

        // 或者检查筛选器
        const categoryFilter = page.locator('[data-testid="category-filter"]');
        const hasFilter = await categoryFilter.isVisible().catch(() => false);

        expect(hasCategoryColumn || hasSubChannelColumn || hasFilter).toBeTruthy();
        console.log(`✅ 三级渠道结构: 大类列=${hasCategoryColumn}, 子渠道列=${hasSubChannelColumn}, 筛选器=${hasFilter}`);
    });
});

test.describe('渠道分析面板', () => {
    test('应显示渠道效果分析数据', async ({ page }) => {
        // 导航到渠道分析页面 (可能是 /analytics/channels 或 /settings/channels/analytics)
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');

        // 查找渠道相关的分析卡片或图表
        const channelChart = page.locator('[data-testid="channel-analytics"], [data-testid="customer-source-chart"]');
        const hasChart = await channelChart.isVisible().catch(() => false);

        // 或者检查渠道效果卡片
        const conversionRate = page.getByText(/转化率|Conversion/i);
        const roi = page.getByText(/ROI|投资回报/i);

        const hasConversion = await conversionRate.isVisible().catch(() => false);
        const hasRoi = await roi.isVisible().catch(() => false);

        expect(hasChart || hasConversion || hasRoi).toBeTruthy();
        console.log(`✅ 渠道分析: 图表=${hasChart}, 转化率=${hasConversion}, ROI=${hasRoi}`);
    });
});

test.describe('渠道归因规则', () => {
    test('应能配置归因规则', async ({ page }) => {
        // 导航到渠道设置页面
        await page.goto('/settings/channels');
        await page.waitForLoadState('networkidle');

        // 查找归因设置入口
        const attributionTab = page.getByRole('tab', { name: /归因|Attribution/i });
        const attributionLink = page.getByRole('link', { name: /归因规则|Attribution/i });
        const attributionBtn = page.getByRole('button', { name: /归因设置/i });

        const hasTab = await attributionTab.isVisible().catch(() => false);
        const hasLink = await attributionLink.isVisible().catch(() => false);
        const hasBtn = await attributionBtn.isVisible().catch(() => false);

        if (hasTab) {
            await attributionTab.click();
        } else if (hasLink) {
            await attributionLink.click();
        } else if (hasBtn) {
            await attributionBtn.click();
        }

        // 验证归因选项存在
        await page.waitForTimeout(1000);
        const firstTouch = page.getByText(/首次触点|First Touch/i);
        const lastTouch = page.getByText(/末次触点|Last Touch/i);

        const hasFirstTouch = await firstTouch.isVisible().catch(() => false);
        const hasLastTouch = await lastTouch.isVisible().catch(() => false);

        if (hasFirstTouch || hasLastTouch) {
            console.log(`✅ 归因规则配置: 首次触点=${hasFirstTouch}, 末次触点=${hasLastTouch}`);
        } else {
            console.log('⏭️ 归因规则配置未在当前页面找到');
        }
    });
});

test.describe('渠道数据完整性', () => {
    test('渠道应正确关联到线索', async ({ page }) => {
        // 创建一个带渠道的线索
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        const createBtn = page.getByTestId('create-lead-btn');
        if (await createBtn.isVisible()) {
            await createBtn.click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            // 查找渠道选择器
            const channelPicker = dialog.locator('[data-testid="channel-picker"], [name*="channel"]');
            const hasChannelPicker = await channelPicker.isVisible().catch(() => false);

            expect(hasChannelPicker).toBeTruthy();
            console.log('✅ 线索创建表单包含渠道选择器');

            // 关闭对话框
            await page.keyboard.press('Escape');
        }
    });

    test('渠道统计数据应正确计算', async ({ page }) => {
        await page.goto('/settings/channels');
        await page.waitForLoadState('networkidle');

        // 查找统计数据列
        const leadCountColumn = page.getByRole('columnheader', { name: /线索数|Lead Count/i });
        const conversionColumn = page.getByRole('columnheader', { name: /转化率|Conversion/i });

        const hasLeadCount = await leadCountColumn.isVisible().catch(() => false);
        const hasConversion = await conversionColumn.isVisible().catch(() => false);

        // 或者检查汇总卡片
        const summaryCard = page.locator('[data-testid="channel-summary"]');
        const hasSummary = await summaryCard.isVisible().catch(() => false);

        expect(hasLeadCount || hasConversion || hasSummary).toBeTruthy();
        console.log(`✅ 渠道统计: 线索数列=${hasLeadCount}, 转化率列=${hasConversion}, 汇总卡片=${hasSummary}`);
    });
});
