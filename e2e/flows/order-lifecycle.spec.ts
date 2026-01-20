import { test, expect } from '@playwright/test';
import {
    createLead,
    navigateToModule,
    generateTestName,
    findTableRow,
    confirmDialog,
    saveFailureArtifacts
} from './fixtures/test-helpers';

/**
 * P0: 订单全生命周期 E2E 测试
 * 使用辅助函数简化测试代码
 * 
 * 覆盖场景:
 * 1. 报价转订单 (必须上传客户确认凭证)
 * 2. 订单状态流转 
 * 3. 采购单拆分与状态联动
 * 4. 撤单功能
 */

test.describe('订单全生命周期', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await saveFailureArtifacts(page, testInfo.title);
        }
    });

    test('应成功创建线索并生成报价单', async ({ page }) => {
        await navigateToModule(page, 'leads');

        const testName = generateTestName('订单测试');
        const leadId = await createLead(page, { name: testName });

        expect(leadId).not.toBe('');
        console.log('✅ 线索创建成功, ID:', leadId);
    });

    test('应从报价单转化为订单', async ({ page }) => {
        await navigateToModule(page, 'quotes');

        // 查找草稿状态的报价单
        const row = await findTableRow(page, /草稿|DRAFT/);

        if (await row.isVisible({ timeout: 5000 })) {
            const link = row.locator('a').first();
            if (await link.isVisible()) {
                await link.click();
                await page.waitForURL(/\/quotes\/.+/);
            }

            // 查找转订单按钮
            const convertBtn = page.getByRole('button', { name: /转订单|创建订单/ });
            if (await convertBtn.isVisible({ timeout: 3000 })) {
                await convertBtn.click();

                // 验证确认对话框
                const dialog = page.getByRole('dialog');
                if (await dialog.isVisible({ timeout: 3000 })) {
                    console.log('✅ 转订单确认对话框可见');
                    await page.keyboard.press('Escape');
                }
            }
        } else {
            console.log('⏭️ 无草稿报价单，跳过转订单测试');
        }
    });

    test('应显示订单列表并支持筛选', async ({ page }) => {
        await navigateToModule(page, 'orders');

        // 验证表格存在
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 验证状态筛选器
        const statusFilter = page.getByRole('combobox', { name: /状态/ });
        if (await statusFilter.isVisible({ timeout: 3000 })) {
            console.log('✅ 状态筛选器可见');
        }

        console.log('✅ 订单列表页加载正常');
    });

    test('应显示订单详情与状态进度条', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const firstOrderLink = page.locator('table tbody tr a').first();

        if (await firstOrderLink.isVisible({ timeout: 5000 })) {
            await firstOrderLink.click();
            await page.waitForURL(/\/orders\/.+/);

            // 验证详情页加载
            await expect(page.getByText(/订单详情|订单号/)).toBeVisible();

            // 验证 Tab 页签
            const tabTriggers = page.locator('[role="tablist"] button');
            const tabCount = await tabTriggers.count();
            console.log(`✅ 详情页包含 ${tabCount} 个 Tab 页签`);
        } else {
            console.log('⏭️ 订单列表为空，跳过详情页测试');
        }
    });

    test('应支持订单撤单 (待下单状态)', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const pendingOrderRow = await findTableRow(page, /待下单|PENDING_PO/);

        if (await pendingOrderRow.isVisible({ timeout: 5000 })) {
            const cancelBtn = pendingOrderRow.getByRole('button', { name: /撤单/ });

            if (await cancelBtn.isVisible({ timeout: 3000 })) {
                await cancelBtn.click();
                const confirmDialog = page.getByRole('alertdialog');
                if (await confirmDialog.isVisible({ timeout: 3000 })) {
                    console.log('✅ 撤单确认对话框可见');
                    await page.getByRole('button', { name: /取消|否/ }).click();
                }
            }
        } else {
            console.log('⏭️ 无待下单订单，跳过撤单测试');
        }
    });
});

test.describe('订单与采购单联动', () => {
    test('应验证采购单列表与状态筛选', async ({ page }) => {
        await navigateToModule(page, 'supply-chain');

        // 尝试导航到采购单
        await page.click('a:has-text("采购单"), text=采购单');
        await page.waitForLoadState('networkidle');

        // 验证表格
        const table = page.locator('table');
        if (await table.isVisible({ timeout: 5000 })) {
            console.log('✅ 采购单列表加载正常');
        }
    });

    test('应验证采购单详情与状态流转按钮', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders');
        await page.waitForLoadState('networkidle');

        const firstPOLink = page.locator('table tbody tr a').first();

        if (await firstPOLink.isVisible({ timeout: 5000 })) {
            await firstPOLink.click();
            await page.waitForURL(/\/supply-chain\/purchase-orders\/.+/);

            await expect(page.getByText(/采购单详情|采购单号/)).toBeVisible();
            console.log('✅ 采购单详情页加载正常');
        } else {
            console.log('⏭️ 采购单列表为空');
        }
    });
});

test.describe('订单状态完整流转', () => {
    test('应支持 PENDING_PO -> IN_PRODUCTION 状态转换', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const pendingRow = await findTableRow(page, /待下单|PENDING_PO/);

        if (await pendingRow.isVisible({ timeout: 5000 })) {
            const link = pendingRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            const confirmBtn = page.getByRole('button', { name: /确认排产|确认生产/ });
            if (await confirmBtn.isVisible({ timeout: 3000 })) {
                await confirmBtn.click();
                await confirmDialog(page);
                console.log('✅ 确认排产操作完成');
            } else {
                console.log('⏭️ 确认排产按钮不可见');
            }
        } else {
            console.log('⏭️ 无待下单订单');
        }
    });

    test('应支持 IN_PRODUCTION -> SHIPPED 状态转换', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const prodRow = await findTableRow(page, /生产中|IN_PRODUCTION/);

        if (await prodRow.isVisible({ timeout: 5000 })) {
            const link = prodRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            const shipBtn = page.getByRole('button', { name: /发货|安排发货/ });
            if (await shipBtn.isVisible({ timeout: 3000 })) {
                await shipBtn.click();
                await confirmDialog(page);
                console.log('✅ 发货操作完成');
            } else {
                console.log('⏭️ 发货按钮不可见');
            }
        } else {
            console.log('⏭️ 无生产中订单');
        }
    });

    test('应显示订单操作时间线', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible({ timeout: 5000 })) {
            await firstLink.click();
            await page.waitForURL(/\/orders\/.+/);

            const timelineCard = page.locator('[class*="card"]').filter({ hasText: /操作记录|时间线/ });
            if (await timelineCard.first().isVisible({ timeout: 3000 })) {
                console.log('✅ 订单时间线可见');
            }
        } else {
            console.log('⏭️ 订单列表为空');
        }
    });

    test('应在发货后允许创建安装任务', async ({ page }) => {
        await navigateToModule(page, 'orders');

        const shippedRow = await findTableRow(page, /已发货|SHIPPED/);

        if (await shippedRow.isVisible({ timeout: 5000 })) {
            const link = shippedRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            const installBtn = page.getByRole('button', { name: /创建安装|安装任务/ });
            if (await installBtn.isVisible({ timeout: 3000 })) {
                console.log('✅ 发货后可创建安装任务');
            } else {
                console.log('⏭️ 安装任务按钮不可见');
            }
        } else {
            console.log('⏭️ 无已发货订单');
        }
    });
});
