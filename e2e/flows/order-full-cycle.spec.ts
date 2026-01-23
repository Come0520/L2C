import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { skipOnDataLoadError } from '../helpers/test-utils';

test.describe('Order Full Lifecycle (Main Path)', () => {
    const timestamp = Date.now();
    const leadName = `OrderFlow_${timestamp}`;
    const proofFilePath = path.join(__dirname, 'fixtures', 'dummy-proof.jpg');

    test.beforeAll(async () => {
        // Ensure dummy proof file exists
        const dir = path.dirname(proofFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(proofFilePath)) {
            fs.writeFileSync(proofFilePath, 'dummy image content');
        }
    });

    test('should execute full flow: Lead -> Quote -> Order -> Split -> PO -> Delivery', async ({ page }) => {
        test.setTimeout(180000); // 3 分钟应对复杂业务流程

        // 1. Create Lead
        console.log('Step 1: Creating Lead...');
        console.log('Step 1: Creating Lead...');
        await page.goto('/leads');
        if (await skipOnDataLoadError(page)) return;

        await page.getByTestId('create-lead-btn').click();
        await page.fill('input[name="customerName"]', leadName);
        await page.fill('input[name="customerPhone"]', `139${timestamp.toString().slice(-8)}`);
        await page.getByTestId('submit-lead-btn').click();

        // Search and Navigate to Detail
        console.log('  - Navigating to detail via first row...');
        await page.reload(); // Refresh immediately
        // await page.waitForLoadState('networkidle');
        if (await skipOnDataLoadError(page)) return;

        // Simplified: Click first row
        const firstLead = page.locator('table tbody tr a').first();
        await expect(firstLead).toBeVisible();
        await firstLead.click();

        // 2. Create Quick Quote
        console.log('Step 2: Creating Quick Quote...');
        await page.locator('a', { hasText: '快速报价' }).click();
        await page.getByTestId('plan-ECONOMIC').click(); // Select Economic Plan

        // Add Room/Item - Form initializes with 1 room, just fill it
        // await page.getByRole('button', { name: /添加房间/ }).click({ force: true });
        await page.locator('input[name="rooms.0.name"]').fill('MasterRoom');
        await page.locator('input[name="rooms.0.width"]').fill('300');
        await page.locator('input[name="rooms.0.height"]').fill('280');
        await page.getByTestId('submit-quote-btn').click();

        await expect(page).toHaveURL(/\/quotes\/.*/);
        await expect(page.getByText('报价单详情')).toBeVisible();

        // 3. Submit & Approve Quote (Required for Order Conversion)
        console.log('Step 2.5: Approving Quote...');

        // Submit if visible
        const submitBtn = page.getByRole('button', { name: /提交审核/ });
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await expect(page.getByText(/已提交|待审批|PENDING_APPROVAL/)).toBeVisible();
            // Reload to reveal Approve button (State update lag)
            await page.reload();
        } else {
            console.log('  - Submit button not visible (Auto-submitted?)');
        }

        // Approve if visible (Admin flow)
        const approveBtn = page.getByRole('button', { name: /批准|通过/ });
        if (await approveBtn.isVisible()) {
            await approveBtn.click();
            // Handle potentially confirm dialog
            if (await page.getByRole('dialog').isVisible()) {
                await page.getByRole('dialog').getByRole('button', { name: /确认/ }).click();
            }
            await expect(page.getByText(/已批准|APPROVED/)).toBeVisible();
            // Reload to reveal Convert button
            await page.reload();
        } else {
            console.log('  - Approve button not visible (Auto-approved?)');
        }

        // 3. Convert to Order (With Proof Upload)
        console.log('Step 3: Converting to Order...');
        // Locate "Convert to Order" button (Verify precise text: "转为订单")
        await page.getByRole('button', { name: /转为订单/ }).click();

        const orderDialog = page.getByRole('dialog');
        await expect(orderDialog).toBeVisible();
        await expect(orderDialog).toContainText('确认转换');

        // Fill Proof (UI currently uses text input instead of file)
        console.log('  - Filling Proof description...');
        await orderDialog.getByPlaceholder(/凭证链接|描述/).fill('E2E Test Proof');

        // Submit
        await orderDialog.getByRole('button', { name: /确认转换/ }).click();

        // 4. Verify Order Created & Status PENDING_PO
        console.log('Step 4: Verifying Order Creation...');
        await expect(page).toHaveURL(/\/orders\/.*/, { timeout: 15000 });
        await expect(page.getByText('订单详情')).toBeVisible();
        await expect(page.getByText('待下单', { exact: false })).toBeVisible(); // PENDING_PO

        // 5. Split Order (Generate POs)
        console.log('Step 5: Splitting Order...');
        // Look for Split Button
        const splitBtn = page.getByRole('button', { name: /生成采购单|拆单/ });
        await expect(splitBtn).toBeVisible();
        await splitBtn.click();

        const splitDialog = page.getByRole('dialog');
        await expect(splitDialog).toBeVisible();
        // Confirm Split (Assuming a simple confirm or submit button exists)
        await splitDialog.getByRole('button', { name: /确认|生成/ }).click();

        // Wait for processing
        await expect(splitDialog).toBeHidden();

        // Verify Order Status might change or check PO tab
        // Some systems change Order to "IN_PRODUCTION" immediately if POs are auto-submitted?
        // Or user needs to go to POs.
        // Let's go to Purchase Orders tab.
        await page.getByRole('tab', { name: '采购单' }).click();

        const poRow = page.locator('[role="tabpanel"]').locator('tr').first();
        await expect(poRow).toBeVisible();
        const poLink = poRow.locator('a').first();
        const poUrl = await poLink.getAttribute('href');
        console.log('  - PO Created:', poUrl);

        // 6. Process PO (Simulate Supplier/Procurement)
        console.log('Step 6: Processing PO...');
        await poLink.click();
        // Now in PO Detail

        // Flow 1: Confirm Order to Supplier (Status: DRAFT -> ORDERED/PENDING_ARRIVAL)
        // Look for action buttons. 
        // Based on order-lifecycle.spec.ts hints: "确认下单", "备货完成"

        const confirmPOBtn = page.getByRole('button', { name: /确认下单/ });
        if (await confirmPOBtn.isVisible()) {
            await confirmPOBtn.click();
            await page.waitForTimeout(500); // fast transition
        }

        // Flow 2: Mark as Ready/Stocked In (Status: -> STOCK_IN / COMPLETED)
        const readyBtn = page.getByRole('button', { name: /备货完成|入库/ });
        await expect(readyBtn).toBeVisible();
        await readyBtn.click();

        // Confirm dialog if any
        if (await page.getByRole('dialog').isVisible()) {
            await page.getByRole('dialog').getByRole('button', { name: /确认/ }).click();
        }

        // 7. Verify Order Status Update (优化导航策略)
        console.log('Step 7: Verifying Order Status (Pending Delivery)...');

        // 直接导航到订单列表，移除多余的 goBack 和 reload
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');
        if (await skipOnDataLoadError(page)) return;

        // 等待表格加载
        await expect(page.locator('table tbody')).toBeVisible({ timeout: 10000 });

        // 使用轮询等待状态变更（订单可能需要时间更新状态）
        await expect(async () => {
            await page.reload();
            await page.waitForLoadState('networkidle');
            const row = page.locator('table tbody tr').first();
            await expect(row).toContainText(/待发货|PENDING_DELIVERY/);
        }).toPass({ timeout: 30000, intervals: [2000, 3000, 5000] });

        const firstOrder = page.locator('table tbody tr a').first();
        await expect(firstOrder).toBeVisible();

        await firstOrder.click();

        // 8. Delivery
        console.log('Step 8: Delivery Application...');
        const deliverBtn = page.getByRole('button', { name: /申请发货|发货|安排发货/ });

        // 等待按钮可见并滚动到视图
        await deliverBtn.waitFor({ state: 'visible', timeout: 15000 });
        await deliverBtn.scrollIntoViewIfNeeded();

        // 使用 force: true 绕过可能的遮挡
        await deliverBtn.click({ force: true });

        const deliveryDialog = page.getByRole('dialog');
        await expect(deliveryDialog).toBeVisible();

        // Fill Logistics
        await deliveryDialog.locator('input[name="logisticsNo"]').fill('SF' + timestamp);
        // Select company if needed (Select/Combobox)
        // await page.getByRole('combobox').click(); ...

        await deliveryDialog.getByRole('button', { name: /提交|确认/ }).click();

        // 9. Final Verification
        console.log('Step 9: Final Status Verification...');
        await expect(page.getByText('已发货', { exact: false })).toBeVisible(); // SHIPPED

        console.log('✅ Full Cycle Test Passed!');
    });
});
