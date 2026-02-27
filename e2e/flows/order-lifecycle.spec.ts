import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * P0: 订单全生命周期端到端测试
 * 
 * 覆盖场景:
 * 报价转订单 → 确认排产 → 拆单/PO生成 → 请求发货 → 确认安装 → 客户验收 → 完成
 */

test.describe('订单全生命周期 E2E', () => {
    test.describe.configure({ mode: 'serial' });

    // 测试数据
    const timestamp = Date.now();
    const testCustomerName = `E2E订单流程_${timestamp}`;
    const testPhone = `138${timestamp.toString().slice(-8)}`;

    // 存储跨测试的状态
    let createdOrderId: string;

    // 失败时保存诊断信息
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const baseName = `${testInfo.project.name}-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
            fs.writeFileSync(path.join(dir, `${baseName}.html`), await page.content());
        }
    });

    test('准备工作: 创建并激活报价单', async ({ page }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 创建线索
        await page.getByTestId('create-lead-btn').click();
        await page.getByTestId('lead-name-input').fill(testCustomerName);
        await page.getByTestId('lead-phone-input').fill(testPhone);
        await page.getByTestId('submit-lead-btn').click();
        await expect(page.getByText(/成功/)).toBeVisible();
        await expect(page.getByTestId('create-lead-dialog')).toBeHidden();

        // 进入报价单预览
        await page.reload();
        const row = page.locator('tr').filter({ hasText: testCustomerName }).first();
        await row.locator('a[href^="/leads/"]').first().click();

        // 创建快速报价
        await page.getByTestId('quick-quote-btn').click();
        await page.waitForURL(/\/leads\/.*\/quick-quote/);

        // 选择方案并填写基本信息
        await page.locator('[data-testid^="plan-"]').first().click();
        await page.locator('input[name="rooms.0.name"]').fill('主卧');
        await page.locator('input[name="rooms.0.width"]').fill('400');
        await page.locator('input[name="rooms.0.height"]').fill('280');
        await page.getByTestId('submit-quote-btn').click();

        // 验证详情页并激活
        await expect(page).toHaveURL(/\/quotes\/.*/);
        const activateBtn = page.getByRole('button', { name: /激活|生效/ });
        await expect(activateBtn).toBeVisible();
        await activateBtn.click();

        // 处理确认框
        const confirmBtn = page.getByRole('button', { name: /确认|确定/ });
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
            await confirmBtn.click();
        }
        await expect(page.getByText(/生效|ACTIVE/)).toBeVisible();
        console.log('✅ 报价单准备就绪');
    });

    test('Step 1: 报价转订单', async ({ page }) => {
        // 查找转订单按钮
        const convertBtn = page.getByRole('button', { name: /转订单|创建订单/ });
        await expect(convertBtn).toBeVisible();
        await convertBtn.click();

        // 处理确认对话框
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        const okBtn = dialog.getByRole('button', { name: /确认|确定|创建/ });
        await okBtn.click();

        // 验证跳转到订单页
        await expect(page).toHaveURL(/\/orders\/.*/, { timeout: 15000 });
        createdOrderId = page.url().split('/orders/')[1]?.split('?')[0] || '';
        expect(createdOrderId).toBeTruthy();

        console.log(`✅ 转订单成功: ${createdOrderId}`);
    });

    test('Step 2: 确认排产', async ({ page }) => {
        test.skip(!createdOrderId, '需要先创建订单');
        await page.goto(`/orders/${createdOrderId}`);
        await page.waitForLoadState('domcontentloaded');

        const confirmBtn = page.getByRole('button', { name: /确认排产|确认生产/ });
        await expect(confirmBtn).toBeVisible({ timeout: 10000 });
        await confirmBtn.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: /确认|确定/ }).click();

        // 验证状态
        await expect(page.getByText(/生产中|IN_PRODUCTION/)).toBeVisible({ timeout: 10000 });
        console.log('✅ 确认排产完成');
    });

    test('Step 3: 拆单与 PO 生成', async ({ page }) => {
        test.skip(!createdOrderId, '需要进入生产中状态');
        await page.goto(`/orders/${createdOrderId}`);

        // 找到拆单按钮
        const splitBtn = page.getByRole('button', { name: /拆单|生成PO/ });
        await expect(splitBtn).toBeVisible();
        await splitBtn.click();

        // 在拆单对话框中选择至少一个供应商或商品
        const dialog = page.getByTestId('split-order-dialog');
        await expect(dialog).toBeVisible();

        // 假设有个全选按钮或勾选框
        const checkboxes = dialog.locator('input[type="checkbox"]');
        if (await checkboxes.count() > 0) {
            await checkboxes.first().check();
        }

        const submitBtn = dialog.getByRole('button', { name: /提交|确定/ });
        await submitBtn.click();

        await expect(page.getByText(/成功|Success/)).toBeVisible();
        console.log('✅ 拆单完成');
    });

    test('Step 4: 请求发货', async ({ page }) => {
        test.skip(!createdOrderId, '需要发货准备');
        await page.goto(`/orders/${createdOrderId}`);

        const shipBtn = page.getByRole('button', { name: /发货|申请发货/ });
        await expect(shipBtn).toBeVisible();
        await shipBtn.click();

        // 填写物流信息对话框
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // 填写单号
        await dialog.locator('input[placeholder*="单号"]').fill('SF123456789');
        await dialog.getByRole('button', { name: /上传|确定|发货/ }).click();

        await expect(page.getByText(/已发货|SHIPPED|PENDING_DELIVERY/)).toBeVisible();
        console.log('✅ 发货请求完成');
    });

    test('Step 5: 确认安装', async ({ page }) => {
        test.skip(!createdOrderId, '需要发货后');
        await page.goto(`/orders/${createdOrderId}`);

        const installBtn = page.getByRole('button', { name: /确认安装|安装完成/ });
        await expect(installBtn).toBeVisible();
        await installBtn.click();

        const okBtn = page.getByRole('button', { name: /确认|确定/ });
        await okBtn.click();

        await expect(page.getByText(/安装完成|INSTALLATION_COMPLETED/)).toBeVisible();
        console.log('✅ 安装确认完成');
    });

    test('Step 6: 客户验收', async ({ page }) => {
        test.skip(!createdOrderId, '需要安装后');
        await page.goto(`/orders/${createdOrderId}`);

        const acceptBtn = page.getByRole('button', { name: /客户验收|确认接收/ });
        await expect(acceptBtn).toBeVisible();
        await acceptBtn.click();

        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: /通过|确认/ }).click();

        await expect(page.getByText(/已完成|COMPLETED/)).toBeVisible();
        console.log('✅ 流程闭环：订单已完成');
    });
});
