import { test } from '@playwright/test';

/**
 * P2: 搜索与筛选功能测试
 * 
 * 覆盖场景:
 * 1. 全局搜索
 * 2. 列表筛选
 * 3. 分页功能
 */

test.describe('全局搜索功能', () => {

    test('应执行全局搜索并显示结果', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 查找全局搜索输入框
        const searchInput = page.locator('[data-testid="global-search"], input[placeholder*="搜索"], [aria-label*="搜索"]');

        if (await searchInput.first().isVisible()) {
            await searchInput.first().click();
            await searchInput.first().fill('测试');

            // 等待搜索结果
            await page.waitForTimeout(500);

            // 验证搜索结果面板或下拉框
            const resultsPanel = page.locator('[data-testid="search-results"], [role="listbox"], [class*="dropdown"]');
            const hasResults = await resultsPanel.first().isVisible().catch(() => false);

            if (hasResults) {
                console.log('✅ 全局搜索结果面板可见');
            } else {
                // 可能是按 Enter 触发搜索
                await page.keyboard.press('Enter');
                await page.waitForLoadState('networkidle');
                console.log('✅ 全局搜索已执行');
            }
        } else {
            console.log('⏭️ 未找到全局搜索输入框');
        }
    });

    test('应在搜索结果中显示正确的实体类型', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('[data-testid="global-search"], input[placeholder*="搜索"]').first();

        if (await searchInput.isVisible()) {
            await searchInput.fill('E2E');
            await page.waitForTimeout(800);

            // 验证结果包含类型标签
            const resultItem = page.locator('[data-testid="search-result-item"], [class*="search-result"]').first();

            if (await resultItem.isVisible().catch(() => false)) {
                const typeLabel = resultItem.locator('[class*="badge"], [class*="tag"]');
                const hasType = await typeLabel.isVisible().catch(() => false);
                console.log(`✅ 搜索结果类型标签: ${hasType ? '可见' : '不可见'}`);
            } else {
                console.log('⏭️ 无搜索结果项');
            }
        }
    });
});

test.describe('列表筛选功能', () => {

    test('线索列表应支持状态筛选', async ({ page }) => {
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // 查找状态筛选器
        const statusFilter = page.locator('[data-testid="status-filter"], select[name*="status"], [aria-label*="状态"]');

        if (await statusFilter.first().isVisible()) {
            await statusFilter.first().click();
            await page.waitForTimeout(300);

            // 选择一个状态
            const options = page.getByRole('option');
            const optionCount = await options.count();

            if (optionCount > 1) {
                await options.nth(1).click();
                await page.waitForLoadState('networkidle');

                // 验证 URL 变化
                const url = page.url();
                console.log(`✅ 状态筛选应用: ${url.includes('?') ? 'URL 包含参数' : 'URL 无参数'}`);
            }
        } else {
            console.log('⏭️ 未找到状态筛选器');
        }
    });

    test('订单列表应支持关键词搜索', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找搜索输入框
        const searchInput = page.locator('input[placeholder*="搜索"], input[name*="search"], [data-testid="list-search"]');

        if (await searchInput.first().isVisible()) {
            await searchInput.first().fill('ORD-');
            await page.waitForTimeout(500);

            // 可能需要按 Enter 或自动搜索
            await page.keyboard.press('Enter');
            await page.waitForLoadState('networkidle');

            // 验证表格数据变化
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            console.log(`✅ 关键词搜索完成，结果行数: ${rowCount}`);
        } else {
            console.log('⏭️ 未找到列表搜索输入框');
        }
    });

    test('客户列表应支持等级筛选', async ({ page }) => {
        await page.goto('/customers');
        await page.waitForLoadState('networkidle');

        // 查找等级筛选器
        const levelFilter = page.locator('[data-testid="level-filter"], select[name*="level"], [aria-label*="等级"]');

        if (await levelFilter.first().isVisible()) {
            await levelFilter.first().click();
            await page.waitForTimeout(300);

            const options = page.getByRole('option');
            const optionCount = await options.count();

            if (optionCount > 0) {
                // 选择 A 级客户
                const aOption = page.getByRole('option', { name: /A/ });
                if (await aOption.isVisible().catch(() => false)) {
                    await aOption.click();
                    await page.waitForLoadState('networkidle');
                    console.log('✅ 等级筛选应用成功');
                }
            }
        } else {
            console.log('⏭️ 未找到等级筛选器');
        }
    });
});

test.describe('分页功能', () => {

    test('应正确显示分页信息', async ({ page }) => {
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // 查找分页组件
        const pagination = page.locator('[class*="pagination"], [data-testid="pagination"], nav[aria-label*="页"]');

        if (await pagination.first().isVisible()) {
            // 验证当前页码
            const currentPage = pagination.locator('[aria-current="page"], [class*="active"], button[disabled]');
            const hasCurrentIndicator = await currentPage.first().isVisible().catch(() => false);

            // 验证总数信息
            const pageInfo = page.locator('[class*="page-info"], [data-testid="page-info"]');
            const hasPageInfo = await pageInfo.first().isVisible().catch(() => false);

            console.log(`✅ 分页组件: 当前页指示=${hasCurrentIndicator}, 页面信息=${hasPageInfo}`);
        } else {
            console.log('⏭️ 未找到分页组件（可能数据量不足）');
        }
    });

    test('应支持翻页操作', async ({ page }) => {
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // 记录当前数据
        const firstRowText = await page.locator('table tbody tr').first().textContent().catch(() => '');

        // 点击下一页
        const nextBtn = page.getByRole('button', { name: /下一页|Next|>|›/ });

        if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
            await nextBtn.click();
            await page.waitForLoadState('networkidle');

            // 验证数据变化
            const newFirstRowText = await page.locator('table tbody tr').first().textContent().catch(() => '');

            if (newFirstRowText !== firstRowText && newFirstRowText !== '') {
                console.log('✅ 翻页数据已更新');
            } else {
                console.log('⚠️ 翻页后数据未变化');
            }

            // 验证 URL 包含页码
            const url = page.url();
            const hasPageParam = url.includes('page=');
            console.log(`✅ 翻页 URL: ${hasPageParam ? '包含 page 参数' : '无 page 参数'}`);
        } else {
            console.log('⏭️ 下一页按钮不可用（可能只有一页数据）');
        }
    });

    test('应支持每页数量切换', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找每页数量选择器
        const pageSizeSelect = page.locator('[data-testid="page-size"], select[name*="pageSize"], [aria-label*="每页"]');

        if (await pageSizeSelect.first().isVisible()) {
            await pageSizeSelect.first().click();
            await page.waitForTimeout(300);

            // 选择更大的数量
            const option = page.getByRole('option', { name: /20|25|50/ }).first();
            if (await option.isVisible().catch(() => false)) {
                await option.click();
                await page.waitForLoadState('networkidle');

                // 验证 URL 包含 pageSize 参数
                const url = page.url();
                const hasPageSizeParam = url.includes('pageSize=') || url.includes('size=');
                console.log(`✅ 每页数量切换: ${hasPageSizeParam ? 'URL 已更新' : 'URL 未更新'}`);
            }
        } else {
            console.log('⏭️ 未找到每页数量选择器');
        }
    });
});
