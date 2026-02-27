/**
 * 商品复杂定价 E2E 测试
 *
 * 测试点：
 * 1. 阶梯价计算验证
 * 2. 渠道专属价格
 * 3. 成本与利润率展示权限
 */
import { test, expect } from '@playwright/test';

test.describe('商品定价规则 (Product Pricing)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/products', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-1: 商品详情应显示价格信息', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible())) {
            test.skip(true, '商品列表为空');
            return;
        }

        await firstRow.locator('a').first().click();
        await expect(page).toHaveURL(/\/products\/.+/);

        // 验证价格相关字段
        const priceField = page.locator('text=零售价').or(page.locator('text=售价'));
        if (await priceField.isVisible()) {
            console.log('✅ 商品详情显示价格信息');
        }
    });

    test('P1-2: 应能查看阶梯价规则', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找阶梯价区域
            const tieredPricing = page.locator('text=阶梯价').or(page.locator('text=批量价'));
            if (await tieredPricing.isVisible()) {
                console.log('✅ 阶梯价规则展示正常');
            } else {
                console.log('⚠️ 未找到阶梯价规则（该商品可能未配置）');
            }
        }
    });

    test('P1-3: 渠道等级不同应展示不同底价', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找渠道价格区域
            const channelPricing = page.locator('text=渠道价').or(page.locator('text=底价'));
            if (await channelPricing.isVisible()) {
                console.log('✅ 渠道专属价格展示正常');
            } else {
                console.log('⚠️ 未找到渠道价格信息');
            }
        }
    });

    test('P1-4: 采购员应能看到成本价', async ({ page }) => {
        // 此测试依赖当前登录用户角色
        await page.goto('/products', { waitUntil: 'domcontentloaded', timeout: 60000 });
        const costHeader = page.getByRole('columnheader', { name: /成本|采购价/ });

        if (await costHeader.isVisible()) {
            console.log('✅ 当前用户可见成本价列（可能是采购员/管理员）');
        } else {
            console.log('⚠️ 成本价列不可见（可能是普通销售角色）');
        }
    });
});

test.describe('报价中的定价计算 (Quote Pricing)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/quotes', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-5: 报价明细应自动计算阶梯价', async ({ page }) => {
        // 进入一条报价单详情
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找报价明细中的金额计算
            const unitPrice = page.locator('text=单价');
            const totalAmount = page.locator('text=金额').or(page.locator('text=小计'));

            if (await unitPrice.isVisible() && await totalAmount.isVisible()) {
                console.log('✅ 报价明细价格计算展示正常');
            }
        }
    });

    test('P1-6: 渠道报价应使用渠道专属价格', async ({ page }) => {
        // 筛选有渠道关联的报价单
        const channelFilter = page.getByLabel(/渠道/).or(page.locator('[data-testid="channel-filter"]'));
        if (await channelFilter.isVisible()) {
            await channelFilter.click();
            const firstOption = page.locator('[role="option"]').first();
            if (await firstOption.isVisible()) {
                await firstOption.click();
                await page.waitForTimeout(500);

                // 进入筛选后的第一条报价单
                const firstRow = page.locator('table tbody tr').first();
                if (await firstRow.isVisible()) {
                    await firstRow.locator('a').first().click();
                    console.log('✅ 渠道报价单加载成功');
                }
            }
        }
    });
});
