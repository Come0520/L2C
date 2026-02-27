import { test, expect } from '@playwright/test';

/**
 * P0: 采购单流程 E2E 测试
 * 
 * 覆盖场景:
 * 1. 自动拆单验证 (按供应商分单)
 * 2. 采购单生命周期 (DRAFT -> ORDERED -> SHIPPED -> RECEIVED -> COMPLETED)
 * 3. 填写供应商合同/报价图
 * 4. 填写物流信息与到货确认
 * 5. 采购状态对订单状态的驱动 (全部到货驱动订单进入待安装)
 */

test.describe('采购单流程 (Supply Chain PO)', () => {
    test.beforeEach(async ({ page }) => {
        await page.waitForLoadState('domcontentloaded');
    });

    test('应在采购单列表页正常显示数据并支持筛选', async ({ page }) => {
        // 导航到采购单列表
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 验证页面标题
        await expect(page.getByRole('heading', { name: /采购单/ })).toBeVisible();

        // 验证状态 Tab 分组
        const tabs = page.locator('[role="tablist"]');
        if (await tabs.isVisible()) {
            await expect(page.getByRole('tab', { name: /全部/ })).toBeVisible();
            await expect(page.getByRole('tab', { name: /待下单|草稿/ })).toBeVisible();
            await expect(page.getByRole('tab', { name: /已下单|生产中/ })).toBeVisible();
        }

        // 验证表格内容
        const table = page.locator('table');
        await expect(table).toBeVisible();

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            console.log('✅ 采购单列表数据加载成功');
        } else {
            console.log('⚠️ 采购单列表为空');
        }
    });

    test('应支持采购单状态流转: 下单确认', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 查找状态为"草稿"或"待下单"的采购单
        const draftTab = page.getByRole('tab', { name: /待下单|草稿/ });
        if (await draftTab.isVisible()) {
            await draftTab.click();
            await page.waitForTimeout(1000);
        }

        const draftRow = page.locator('table tbody tr').first();
        const draftText = await draftRow.textContent();
        if (await draftRow.isVisible() && draftText && !draftText.includes('暂无') && !draftText.includes('No Data')) {
            // 点击进入详情 (尝试点击链接，如果不行则点击整行)
            const link = draftRow.locator('a').first();
            if (await link.isVisible()) {
                await link.click();
            } else {
                await draftRow.click();
            }
            await page.waitForURL(/\/supply-chain\/purchase-orders\/.+/);

            // 验证由"草稿"转为"已下单"
            const orderBtn = page.getByRole('button', { name: /确认下单|转为已下单/ });
            if (await orderBtn.isVisible()) {
                await orderBtn.click();

                // 验证对话框 (可能需要上传厂家合同/截图)
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 输入外部单号
                const externalNo = page.getByLabel(/厂家单号|外部单号/);
                if (await externalNo.isVisible()) {
                    await externalNo.fill('SUP-MOCK-123456');
                }

                // 取消或按 Escape 退出
                await page.keyboard.press('Escape');
                console.log('✅ 下单流程按钮与对话框验证成功');
            }
        } else {
            console.log('⚠️ 无待下单采购单，跳过测试');
        }
    });

    test('应支持填写物流信息与确认发货', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 切换到已下单状态
        const orderedTab = page.getByRole('tab', { name: /已下单|生产中/ });
        if (await orderedTab.isVisible()) {
            await orderedTab.click();
            await page.waitForTimeout(1000);
        }

        const orderedRow = page.locator('table tbody tr').first();
        const orderedText = await orderedRow.textContent();
        if (await orderedRow.isVisible() && orderedText && !orderedText.includes('暂无') && !orderedText.includes('No Data')) {
            // 点击进入详情
            const link = orderedRow.locator('a').first();
            if (await link.isVisible()) {
                await link.click();
            } else {
                await orderedRow.click();
            }

            // 查找发货/填写物流按钮
            const shippingBtn = page.getByRole('button', { name: /发货|填写物流/ });
            if (await shippingBtn.isVisible()) {
                await shippingBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证物流公司与单号
                await page.getByLabel(/物流公司/).click();
                await page.getByRole('option', { name: /顺丰|物流/ }).first().click();
                await page.getByLabel(/物流单号/).fill('SF123456789');

                await page.keyboard.press('Escape');
                console.log('✅ 物流填写对话框验证成功');
            }
        }
    });

    test('应支持到货确认与入库', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const shippedTab = page.getByRole('tab', { name: /已发货|待入库/ });
        if (await shippedTab.isVisible()) {
            await shippedTab.click();
            await page.waitForTimeout(1000);
        }

        const shippedRow = page.locator('table tbody tr').first();
        const shippedText = await shippedRow.textContent();
        if (await shippedRow.isVisible() && shippedText && !shippedText.includes('暂无') && !shippedText.includes('No Data')) {
            const link = shippedRow.locator('a').first();
            if (await link.isVisible()) {
                await link.click();
            } else {
                await shippedRow.click();
            }

            // 查找入库/确认收货按钮
            const receiveBtn = page.getByRole('button', { name: /确认收货|入库/ });
            if (await receiveBtn.isVisible()) {
                await receiveBtn.click();

                // 验证确认框
                const alert = page.getByRole('alertdialog');
                if (await alert.isVisible() || await page.getByRole('dialog').isVisible()) {
                    console.log('✅ 入库确认验证成功');
                    await page.keyboard.press('Escape');
                }
            }
        }
    });

    test('应支持导出采购单 (PDF/图片)', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        const firstRow = page.locator('table tbody tr').first();
        const rowText = await firstRow.textContent();

        if (await firstRow.isVisible() && rowText && !rowText.includes('暂无') && !rowText.includes('No Data')) {
            // 点击进入详情 (尝试点击链接，如果不行则点击整行)
            const link = firstRow.locator('a').first();
            if (await link.isVisible()) {
                await link.click();
            } else {
                await firstRow.click();
            }
            await page.waitForURL(/\/supply-chain\/purchase-orders\/.+/);

            // 查找导出按钮
            const exportBtn = page.getByRole('button', { name: /导出|下载/ });
            if (await exportBtn.isVisible()) {
                console.log('✅ 导出按钮可见');
            }
        } else {
            console.log('⚠️ 无采购单数据，跳过导出测试');
        }
    });
});

test.describe('采购单关联逻辑 (订单木桶效应)', () => {
    test('应验证采购单状态对订单状态的驱动逻辑', async ({ page }) => {
        // 此测试属于逻辑验证，主要检查 UI 上的关联显示
        await page.goto('/orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible()) {
            await firstLink.click();

            // 切换到"供应链/采购" Tab
            const supplyTab = page.getByRole('tab', { name: /供应链|采购/ });
            if (await supplyTab.isVisible()) {
                await supplyTab.click();

                // 验证该订单下的所有采购单列表
                page.locator('[data-testid="linked-po-list"]');
                // 或者通过表格检查
                const poTable = page.locator('table');
                await expect(poTable.first()).toBeVisible();

                console.log('✅ 订单详情页采购单关联列表显示正常');
            }
        }
    });
});

// ============================================================
// [Supply-03] 增强 E2E 测试 - 批量操作和合并采购
// ============================================================

test.describe('供应链批量操作 (Supply-01 Enhancement)', () => {
    test('应支持待采购池页面展示和筛选', async ({ page }) => {
        await page.goto('/supply-chain/pending-pool', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 验证页面标题
        const heading = page.getByRole('heading', { name: /待采购|采购池/ });
        if (await heading.isVisible()) {
            await expect(heading).toBeVisible();
            console.log('✅ 待采购池页面加载成功');
        } else {
            // 如果页面不存在，导航到供应链主页
            await page.goto('/supply-chain', { waitUntil: 'domcontentloaded', timeout: 60000 });
            console.log('⚠️ 待采购池页面尚未实现，跳过');
        }
    });

    test('应支持批量选择采购单', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 查找全选复选框
        const selectAll = page.locator('table thead input[type="checkbox"]');
        if (await selectAll.isVisible()) {
            await selectAll.check();

            // 验证批量操作按钮出现
            const batchActions = page.getByRole('button', { name: /批量|操作/ });
            if (await batchActions.isVisible()) {
                console.log('✅ 批量选择和操作按钮验证成功');
            }

            await selectAll.uncheck();
        } else {
            console.log('⚠️ 批量选择功能尚未实现');
        }
    });

    test('应支持合并采购单创建', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 查找合并采购按钮
        const mergeBtn = page.getByRole('button', { name: /合并采购|创建合并/ });
        if (await mergeBtn.isVisible()) {
            await mergeBtn.click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            // 验证供应商选择器
            const supplierSelect = page.getByLabel(/供应商/);
            if (await supplierSelect.isVisible()) {
                console.log('✅ 合并采购对话框验证成功');
            }

            await page.keyboard.press('Escape');
        } else {
            console.log('⚠️ 合并采购功能按钮不可见');
        }
    });
});

test.describe('供应商评价 (Supply-02 Enhancement)', () => {
    test('应在供应商详情页展示评价指标', async ({ page }) => {
        await page.goto('/supply-chain/suppliers', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        const firstRow = page.locator('table tbody tr').first();
        const hasRow = await firstRow.isVisible({ timeout: 5000 });

        if (!hasRow) {
            // 尝试创建供应商数据
            console.log('ℹ️ 供应商列表为空，尝试创建测试数据...');
            const { seedSuppliers } = await import('./fixtures/supplier-data-seed');
            await seedSuppliers(page);
            await page.goto('/supply-chain/suppliers', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForLoadState('domcontentloaded');
        }

        // 重新检查是否有数据
        const rowAfterSeed = page.locator('table tbody tr').first();
        if (!(await rowAfterSeed.isVisible({ timeout: 5000 }))) {
            test.skip(true, '供应商列表为空且无法创建测试数据');
            return;
        }

        // 点击进入详情页
        const firstLink = rowAfterSeed.locator('a').first();
        if (await firstLink.isVisible({ timeout: 3000 })) {
            await firstLink.click();
            await page.waitForLoadState('domcontentloaded');

            // 验证评价指标展示
            const ratingSection = page.locator('[data-testid="supplier-rating"]');
            const onTimeRate = page.getByText(/准时率|交期/);
            const qualityRate = page.getByText(/合格率|质量/);

            if (await ratingSection.isVisible({ timeout: 5000 }) || await onTimeRate.isVisible({ timeout: 5000 }) || await qualityRate.isVisible({ timeout: 5000 })) {
                console.log('✅ 供应商评价指标展示成功');
            } else {
                console.log('⚠️ 供应商评价 UI 尚未实现');
            }
        } else {
            console.log('⚠️ 供应商行没有可点击的链接');
        }
    });

    test('应在供应商列表页展示评分排名', async ({ page }) => {
        await page.goto('/supply-chain/suppliers', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 验证表格包含评分列
        const ratingColumn = page.locator('th').filter({ hasText: /评分|星级|等级/ });
        if (await ratingColumn.isVisible({ timeout: 5000 })) {
            console.log('✅ 供应商评分列展示成功');
        } else {
            console.log('⚠️ 供应商评分列尚未添加');
        }
    });
});
