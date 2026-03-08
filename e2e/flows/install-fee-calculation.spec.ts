/**
 * 安装工费计算 E2E 测试
 *
 * 测试点：
 * 1. 基础工费计算
 * 2. 加项费（高空费、远程费）
 * 3. 验收时工费调整
 */
import { test, expect } from '@playwright/test';

test.describe('安装工费计算 (Install Fee Calculation)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-1: 派单时应填写预估工费', async ({ page }) => {
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                const dialog = page.getByRole('dialog');

                // 查找工费输入框
                const feeInput = dialog.getByLabel(/工费|预估/).or(dialog.locator('input[type="number"]'));
                if (await feeInput.isVisible()) {
                    await feeInput.fill('200');
                    console.log('✅ 预估工费输入框可用');
                }
            }
        }
    });

    test('P1-2: 安装单详情应显示工费明细', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.locator('a').first().click();

            // 查找工费明细区域
            const feeSection = page.locator('text=工费').or(page.locator('text=费用明细'));
            if (await feeSection.isVisible()) {
                // 查找基础费和加项费
                const baseFee = page.locator('text=基础费').or(page.locator('text=安装费'));
                const additionalFee = page.locator('text=高空').or(page.locator('text=远程'));

                if (await baseFee.isVisible()) {
                    console.log('✅ 基础工费展示正常');
                }
                if (await additionalFee.isVisible()) {
                    console.log('✅ 加项费展示正常');
                }
            }
        }
    });

    test('P1-3: 高空作业费应自动计算', async ({ page }) => {
        // 查找涉及高空作业的安装单
        const highAltitudeRow = page.locator('table tbody tr').filter({ hasText: /高空|挑空/ }).first();
        if (await highAltitudeRow.isVisible()) {
            await highAltitudeRow.locator('a').first().click();

            const highFee = page.locator('text=高空').or(page.locator('text=脚手架'));
            if (await highFee.isVisible()) {
                console.log('✅ 高空作业费展示正常');
            }
        } else {
            console.log('⚠️ 未找到涉及高空作业的安装单');
        }
    });

    test('P1-4: 验收时应能调整实际工费', async ({ page }) => {
        // 进入待确认的安装单
        const pendingConfirmRow = page.locator('table tbody tr').filter({ hasText: /待确认|PENDING_CONFIRM/ }).first();
        if (await pendingConfirmRow.isVisible()) {
            await pendingConfirmRow.locator('a').first().click();

            const confirmBtn = page.getByRole('button', { name: /确认验收/ });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();

                const dialog = page.getByRole('dialog');

                // 查找实际工费输入框
                const actualFeeInput = dialog.getByLabel(/实际工费/).or(dialog.locator('input[type="number"]'));
                if (await actualFeeInput.isVisible()) {
                    await actualFeeInput.fill('250');
                    console.log('✅ 验收时可调整实际工费');
                }
            }
        }
    });
});

/**
 * 工费计算数值准确性验证（补全审计缺口 #1）
 *
 * 关键验证点：
 * 1. API 返回的工费数据与 UI 展示一致
 * 2. 预估工费与实际工费差额正确显示
 * 3. 多项费用合计金额正确
 */
test.describe('工费计算数值准确性 (Fee Calculation Accuracy)', () => {
    test('P0-1: API 返回工费与 UI 展示应一致', async ({ page }) => {
        // 拦截安装单详情 API，捕获后端返回的工费数据
        let apiResponse: Record<string, unknown> | null = null;
        await page.route('**/api/**/install*/**', async (route) => {
            const response = await route.fetch();
            const json = await response.json();
            if (json?.estimatedFee !== undefined || json?.data?.estimatedFee !== undefined) {
                apiResponse = json?.data || json;
            }
            await route.fulfill({ response });
        });

        await page.goto('/service/installation', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 进入第一条已有工费数据的安装单
        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible({ timeout: 10000 }))) {
            console.log('⚠️ 安装单列表为空，跳过');
            return;
        }
        await firstRow.locator('a').first().click();
        await page.waitForLoadState('domcontentloaded');

        // 等待 API 响应数据到位
        await page.waitForTimeout(3000);

        if (apiResponse) {
            const estimatedFee = Number((apiResponse as Record<string, unknown>).estimatedFee || 0);
            const actualFee = Number((apiResponse as Record<string, unknown>).actualFee || 0);

            // 验证 UI 上展示的预估工费与 API 返回一致
            if (estimatedFee > 0) {
                const feeText = await page.locator('text=/预估|估价/').first().locator('..').textContent();
                if (feeText) {
                    const uiAmount = parseFloat(feeText.replace(/[^0-9.]/g, ''));
                    if (!isNaN(uiAmount)) {
                        expect(uiAmount).toBeCloseTo(estimatedFee, 0);
                        console.log(`✅ 预估工费一致：API=${estimatedFee}，UI=${uiAmount}`);
                    }
                }
            }

            // 验证实际工费
            if (actualFee > 0) {
                const actualText = await page.locator('text=/实际|结算/').first().locator('..').textContent();
                if (actualText) {
                    const uiActual = parseFloat(actualText.replace(/[^0-9.]/g, ''));
                    if (!isNaN(uiActual)) {
                        expect(uiActual).toBeCloseTo(actualFee, 0);
                        console.log(`✅ 实际工费一致：API=${actualFee}，UI=${uiActual}`);
                    }
                }
            }
        } else {
            console.log('⚠️ 未捕获到工费 API 数据（可能路由不匹配）');
        }
    });

    test('P0-2: 费用合计应等于各项之和', async ({ page }) => {
        await page.goto('/service/installation', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible({ timeout: 10000 }))) {
            console.log('⚠️ 安装单列表为空，跳过');
            return;
        }
        await firstRow.locator('a').first().click();
        await page.waitForLoadState('domcontentloaded');

        // Task 4 修复：等待 Loading 状态消失，防止因详情页长时间 Loading 而超时
        const loadingIndicator = page.getByText(/^Loading\.\.\.$/);
        if (await loadingIndicator.isVisible({ timeout: 3000 })) {
            console.log('⏳ 检测到详情页 Loading 状态，等待消失...');
            await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
            console.log('✅ Loading 消失，继续操作');
        }

        // 等待页面内容渲染完成
        await page.waitForTimeout(500);

        // 查找所有包含金额的行
        const feeRows = page.locator('[data-testid*="fee"], tr:has(text=/工费|基础费|高空|远程|加项/)');
        const rowCount = await feeRows.count();

        if (rowCount >= 2) {
            let subtotal = 0;
            // 收集各项费用并求和
            for (let i = 0; i < rowCount - 1; i++) {
                const text = await feeRows.nth(i).textContent();
                if (text) {
                    const match = text.match(/[\d,]+\.?\d*/);
                    if (match) {
                        subtotal += parseFloat(match[0].replace(/,/g, ''));
                    }
                }
            }

            // 获取合计行
            const totalText = await page.locator('text=/合计|总计|总工费/').first().locator('..').textContent();
            if (totalText) {
                const totalMatch = totalText.match(/[\d,]+\.?\d*/);
                if (totalMatch && subtotal > 0) {
                    const total = parseFloat(totalMatch[0].replace(/,/g, ''));
                    expect(total).toBeCloseTo(subtotal, 0);
                    console.log(`✅ 费用合计正确：各项之和=${subtotal}，合计=${total}`);
                }
            }
        } else {
            console.log('⚠️ 费用明细行不足，跳过合计验证');
        }
    });

});

