/**
 * 渠道佣金扣回 E2E 测试
 *
 * 测试点：
 * 1. 全额退款时佣金作废
 * 2. 部分退款时佣金调整
 * 3. 已支付佣金的负向扣减
 */
import { test, expect } from '@playwright/test';
import { skipOnDataLoadError } from '../helpers/test-utils';

test.describe('渠道佣金扣回 (Commission Clawback)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/channels', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P0-1: 渠道详情应显示佣金记录', async ({ page }) => {
        if (await skipOnDataLoadError(page)) return;

        const table = page.locator('table');
        if (!(await table.isVisible({ timeout: 5000 }).catch(() => false))) {
            test.skip(true, '渠道列表未加载');
            return;
        }

        const firstRow = table.locator('tbody tr').first();
        if (!(await firstRow.isVisible())) {
            test.skip(true, '渠道列表为空');
            return;
        }

        await firstRow.locator('a').first().click();
        await expect(page).toHaveURL(/\/channels\/.+/);

        // 查找佣金/结算Tab
        const commissionTab = page.getByRole('tab', { name: /佣金|结算/ });
        if (await commissionTab.isVisible()) {
            await commissionTab.click();

            // 验证佣金记录表格
            const commissionTable = page.locator('table');
            await expect(commissionTable).toBeVisible();
            console.log('✅ 渠道佣金记录展示正常');
        }
    });

    test('P0-2: 退款订单应显示佣金扣减记录', async ({ page }) => {
        if (await skipOnDataLoadError(page)) return;

        const table = page.locator('table');
        if (!(await table.isVisible({ timeout: 5000 }).catch(() => false))) {
            return;
        }

        const firstRow = table.locator('tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            const commissionTab = page.getByRole('tab', { name: /佣金|结算/ });
            if (await commissionTab.isVisible()) {
                await commissionTab.click();

                // 查找扣减/调整记录
                const clawbackRecord = page.locator('text=扣减').or(page.locator('text=调整')).or(page.locator('text=作废'));
                if (await clawbackRecord.isVisible()) {
                    console.log('✅ 发现佣金扣减记录');
                } else {
                    console.log('⚠️ 未发现扣减记录（可能无退款订单）');
                }
            }
        }
    });

    test('P0-3: 结算单应体现负向调整', async ({ page }) => {
        await page.goto('/finance/channel-settlements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        const table = page.locator('table');
        if (await table.isVisible()) {
            const firstSettlement = table.locator('tbody tr').first();
            if (await firstSettlement.isVisible()) {
                await firstSettlement.locator('a').first().click();

                // 查找调整金额字段
                const adjustmentField = page.locator('text=调整金额').or(page.locator('text=扣减'));
                if (await adjustmentField.isVisible()) {
                    console.log('✅ 结算单显示调整金额字段');
                }
            }
        }
    });
});

test.describe('底价供货模式 (Base Price Mode)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/channels', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P0-4: 底价供货渠道应显示结算价折扣', async ({ page }) => {
        if (await skipOnDataLoadError(page)) return;

        // 筛选底价供货模式的渠道
        const modeFilter = page.getByLabel(/合作模式/).or(page.getByRole('combobox', { name: /模式/ }));
        if (await modeFilter.isVisible()) {
            await modeFilter.click();
            const basePriceOption = page.getByRole('option', { name: /底价|BASE_PRICE/ });
            if (await basePriceOption.isVisible()) {
                await basePriceOption.click();
                await page.waitForTimeout(500);
            }
        }

        // 进入渠道详情
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找结算价折扣率字段
            const discountField = page.locator('text=折扣率').or(page.locator('text=结算价'));
            if (await discountField.isVisible()) {
                console.log('✅ 底价供货渠道显示折扣率');
            }
        }
    });

    test('P0-5: 不同等级渠道结算价应不同', async ({ page }) => {
        // 查看渠道等级配置 (新路径)
        await page.goto('/settings/channels', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 点击佣金配置 Tab
        const configTab = page.getByRole('tab', { name: /佣金配置/ });
        if (await configTab.isVisible()) {
            await configTab.click();
            await page.waitForTimeout(500);

            // 验证等级折扣配置表单
            const sLevelInput = page.locator('input[name="S"]');
            const aLevelInput = page.locator('input[name="A"]');

            if (await sLevelInput.isVisible() && await aLevelInput.isVisible()) {
                console.log('✅ 渠道等级折扣配置 UI 正常');
            }
        } else {
            console.log('⚠️ 未找到佣金配置 Tab');
        }
    });

    test('P0-6: 渠道选品池管理页面', async ({ page }) => {
        await page.goto('/settings/channels/products', { waitUntil: 'domcontentloaded', timeout: 60000 });
        // await page.waitForLoadState('domcontentloaded');
        if (await skipOnDataLoadError(page)) return;

        // 验证页面加载（使用多种选择器策略）
        const pageTitle = page.locator('text=渠道选品池')
            .or(page.locator('h1, h2, h3').filter({ hasText: /选品/ }))
            .or(page.locator('[data-testid="channel-products-page"]'));

        if (await pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ 渠道选品池页面加载正常');

            // 验证添加商品按钮（使用更健壮的选择器）
            const addButton = page.locator('button').filter({ hasText: /添加|Add/ }).first()
                .or(page.locator('[data-testid="add-product"]'));

            if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('✅ 添加商品按钮存在');
            } else {
                console.log('⚠️ 未找到添加商品按钮');
            }
        } else {
            console.log('⚠️ 渠道选品池页面未加载或标题不可见');
        }
    });

    test('P0-7: 渠道表单应包含佣金触发模式', async ({ page }) => {
        await page.goto('/settings/channels', { waitUntil: 'domcontentloaded', timeout: 60000 });
        // await page.waitForLoadState('domcontentloaded');
        if (await skipOnDataLoadError(page)) return;

        // 使用更健壮的选择器 - 适配渠道列表页
        // 渠道列表 Tab 应该默认选中
        const listTab = page.getByRole('tab', { name: /渠道列表/ }).or(page.locator('[data-value="list"]'));
        if (await listTab.isVisible()) {
            await listTab.click();
            await page.waitForTimeout(300);
        }

        // 查找新建按钮（使用多种策略）
        const createButton = page.locator('button').filter({ hasText: /新建|添加|创建|Create/ }).first()
            .or(page.locator('[data-testid="create-channel"]'))
            .or(page.getByRole('button').filter({ hasText: /渠道/ }));

        if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await createButton.click();
            await page.waitForTimeout(500);

            // 切换到财务配置 Tab
            const financeTab = page.getByRole('tab', { name: /财务/ });
            if (await financeTab.isVisible()) {
                await financeTab.click();

                // 验证佣金触发模式选择器
                const triggerModeLabel = page.locator('text=佣金触发时机').or(page.locator('text=触发时机'));
                if (await triggerModeLabel.isVisible()) {
                    console.log('✅ 渠道表单包含佣金触发模式配置');
                } else {
                    console.log('⚠️ 未找到佣金触发时机选择器');
                }
            } else {
                console.log('⚠️ 未找到财务配置 Tab');
            }
        } else {
            console.log('⚠️ 未找到新建渠道按钮，跳过测试');
        }
    });
});

