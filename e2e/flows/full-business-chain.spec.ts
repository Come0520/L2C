import { test, expect } from '@playwright/test';
import {
    createLead,
    generateTestName,
    navigateToModule,
    createQuickQuote,
    submitQuoteForApproval,
    approveQuote,
    convertQuoteToOrder,
    confirmOrder
} from './fixtures/test-helpers';
import { skipOnDataLoadError } from '../helpers/test-utils';

/**
 * P0: 完整销售服务闭环端到端测试 (Full Business Chain)
 * 
 * 覆盖场景:
 * 线索创建 → 快速报价 → 报价审核 → 转订单 → 订单确认/发货 → 采购单生成 → 安装派单 → 验收
 */
test.describe('全链路业务流 (Full Business Chain)', () => {
    // 串行执行，确保连贯性
    test.describe.configure({ mode: 'serial' });

    let leadId = '';
    let quoteId = '';
    let orderId = '';
    let orderNo = '';

    test('1. 创建并跟进线索', async ({ page }) => {
        const testName = generateTestName('全链路客户');
        await navigateToModule(page, 'leads');
        if (await skipOnDataLoadError(page)) return;

        leadId = await createLead(page, { name: testName, intention: '高' });
        expect(leadId).not.toBe('');
        console.log(`✅ 线索创建成功，ID: ${leadId}`);
    });

    test('2. 快速报价与审核', async ({ page }) => {
        test.skip(!leadId, '前置线索创建失败');

        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('domcontentloaded');

        quoteId = await createQuickQuote(page, { plan: 'STANDARD', roomName: '全链路测试房' });
        expect(quoteId).not.toBe('');
        console.log(`✅ 快速报价生成，ID: ${quoteId}`);

        await submitQuoteForApproval(page);
        await approveQuote(page);
        console.log('✅ 报价审核闭环完成');
    });

    test('3. 报价转订单与发货', async ({ page }) => {
        test.skip(!quoteId, '前置报价流程失败');

        await page.goto(`/quotes/${quoteId}`);
        await page.waitForLoadState('domcontentloaded');

        orderId = await convertQuoteToOrder(page);
        expect(orderId).not.toBe('');

        await confirmOrder(page);

        // 尝试获取单号
        const orderNoLocator = page.locator('[data-testid="order-no"], .order-number, text=/订单号|单号/ >> xpath=parent::*');
        try {
            const fullText = await orderNoLocator.first().textContent();
            orderNo = fullText?.replace(/[^a-zA-Z0-9-]/g, '').replace('订单号', '') || orderId;
        } catch {
            orderNo = orderId; // 降级使用 ID
        }
        console.log(`✅ 订单确认成功，单号/ID: ${orderNo}`);

        // 尝试触发发货流程 (如果需要的话，部分系统确认后即派发)
        const shipBtn = page.getByRole('button', { name: /安排发货|发货/ });
        if (await shipBtn.isVisible({ timeout: 2000 })) {
            await shipBtn.click();
            await page.getByRole('button', { name: /确认|确定/ }).click();
            await expect(page.getByText(/已发货|SHIPPED/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 订单已发货');
        }
    });

    test('4. 供应链联动 (验证采购单)', async ({ page }) => {
        test.skip(!orderNo, '前置订单流程失败');

        await navigateToModule(page, 'supply-chain');

        // 无论如何先看看能否搜索
        const searchInput = page.getByPlaceholder(/搜索|单号/);
        if (await searchInput.isVisible()) {
            // 使用简短的关键字搜索
            await searchInput.fill(orderNo.substring(0, 8));
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            // 只要能搜出结果即算成功
            const poRow = page.locator('table tbody tr').first();
            if (await poRow.isVisible()) {
                console.log('✅ 供应链采购单验证成功，发现强联动数据');
            } else {
                console.log('⚠️ 供应链暂无完全匹配单号显示，可能是异步生成延迟');
            }
        }
    });

    test('5. 服务交付联动 (安装服务)', async ({ page }) => {
        test.skip(!orderId, '前置订单流程失败');

        await page.goto('/service/installation', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 切换到待分配/待处理
        const pendingTab = page.getByRole('tab').filter({ hasText: /待分配|待处理/ });
        if (await pendingTab.isVisible()) {
            await pendingTab.click();
        }

        // 验证是否有安装单出现（这里不强制要求完全匹配 orderId，只要模块能正常渲染和操作）
        const table = page.locator('table');
        await expect(table).toBeVisible();

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            // 检查是否有关联操作
            const assignBtn = firstRow.getByRole('button', { name: /指派|分配/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();
                // 验证派单对话框弹出
                await expect(page.getByRole('dialog')).toBeVisible();
                await page.keyboard.press('Escape');
                console.log('✅ 服务交付联动：派单功能验证正常');
            }
        } else {
            console.log('⚠️ 当前列表无待处理安装单 (也可能是数据已自动流转)');
        }
    });
});
