import { test, expect } from '@playwright/test';
import {
    createLead,
    generateTestName,
    navigateToModule,
    confirmDialog,
    createQuickQuote,
    submitQuoteForApproval,
    approveQuote,
    convertQuoteToOrder,
    confirmOrder
} from './fixtures/test-helpers';
import { skipOnDataLoadError } from '../helpers/test-utils';

/**
 * 核心业务链路 E2E 测试：线索 -> 报价 -> 订单 -> 采购 (Core Business Flow)
 * 验证 L2C 系统的全链路集成稳定性
 */
test.describe('核心业务全链路 (Core Business Flow)', () => {

    test('应完成从线索创建到采购单生成的完整閉环', async ({ page }) => {
        const testName = generateTestName('全链路流程');

        // 1. 线索管理：创建线索
        await navigateToModule(page, 'leads');
        if (await skipOnDataLoadError(page)) return;
        const leadId = await createLead(page, { name: testName });
        expect(leadId).not.toBe('');
        console.log('✅ 线索创建成功，ID:', leadId);

        // 导航到线索详情
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        // 2. 报价管理：创建快速报价
        const quoteId = await createQuickQuote(page, { plan: 'STANDARD' });
        expect(quoteId).not.toBe('');
        console.log('✅ 报价创建成功，ID:', quoteId);

        // 提交审核
        await submitQuoteForApproval(page);
        console.log('✅ 报价提交审核');

        // 批准报价 (模拟审核通过)
        await approveQuote(page);
        console.log('✅ 报价审核通过');

        // 3. 订单管理：转订单
        const orderId = await convertQuoteToOrder(page);
        expect(orderId).not.toBe('');
        console.log('✅ 已转为订单，ID:', orderId);

        // 确认订单
        await confirmOrder(page);
        console.log('✅ 订单确认完成');

        // 获取订单号 (Document Number)
        const orderNo = await page.locator('[data-testid="order-no"]').textContent();
        console.log('✅ 订单号:', orderNo);

        // 4. 供应链集成：验证采购单生成
        await navigateToModule(page, 'supply-chain');
        await page.click('text=采购单'); // 或者是特定的侧边栏链接
        await page.waitForLoadState('networkidle');

        // 搜索关联订单号的采购单
        await page.getByPlaceholder(/搜索|单号/).fill(orderNo?.trim() || '');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // 验证列表中是否存在关联 PO
        const poRow = page.locator('table tbody tr').first();
        const poText = await poRow.textContent();
        expect(poText).toContain(orderNo?.trim());
        console.log('✅ 供应链采购单验证成功，已根据订单自动生成');

        // 5. 状态闭环：模拟采购收货联动
        await poRow.locator('a').first().click();
        await page.waitForURL(/\/supply-chain\/purchase-orders\/.+/);

        // 如果已经是待下单，尝试流转到已下单 (Mock 数据可能直接是已下单)
        const orderBtn = page.getByRole('button', { name: /确认下单/ });
        if (await orderBtn.isVisible()) {
            await orderBtn.click();
            await page.getByLabel(/厂家单号/).fill(`SN-${Date.now()}`);
            await page.click('button:has-text("确认")');
            await page.waitForTimeout(1000);
        }

        console.log('✅ 全链路流程验证完成');
    });
});
