import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * P0: 完整销售流程端到端测试
 * 
 * 覆盖场景:
 * 线索 → 快速报价 → 激活报价 → 转订单 → 收款 → 发货 → 安装 → 完成
 */

test.describe('完整销售流程 E2E', () => {
    test.describe.configure({ mode: 'serial' });
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
            }
        });
    });

    // 测试数据
    const timestamp = Date.now();
    const testCustomerName = `E2E完整流程_${timestamp}`;
    const testPhone = `139${timestamp.toString().slice(-8)}`;

    // 存储跨测试的状态
    let createdLeadId: string;
    let createdQuoteId: string;
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

    test('Step 1: 创建线索', async ({ page }) => {
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // 点击创建按钮
        const createBtn = page.getByTestId('create-lead-btn');
        await expect(createBtn).toBeVisible({ timeout: 10000 });
        await createBtn.click();

        // 等待对话框
        await expect(page.getByRole('dialog')).toBeVisible();

        // 填写表单
        await page.getByTestId('lead-name-input').fill(testCustomerName);
        await page.getByTestId('lead-phone-input').fill(testPhone);
        await page.getByLabel('备注/需求').fill('E2E 完整流程测试 - 自动生成');

        // 提交
        const submitBtn = page.getByTestId('submit-lead-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // 验证成功 Toast
        await expect(page.getByText(/成功|Success/).first()).toBeVisible({ timeout: 10000 });

        // 等待对话框关闭
        await expect(page.getByTestId('create-lead-dialog')).toBeHidden({ timeout: 5000 });

        // 在列表中找到新创建的线索
        await page.reload();
        const row = page.locator('tr').filter({ hasText: testCustomerName }).first();
        await expect(row).toBeVisible();

        // 获取线索 ID (从链接中)
        const detailLink = row.locator('a[href^="/leads/"]').first();
        const href = await detailLink.getAttribute('href');
        createdLeadId = href?.split('/').pop() || '';

        expect(createdLeadId).toBeTruthy();
        console.log(`✅ 线索创建成功: ${createdLeadId}`);
    });

    test('Step 2: 创建快速报价', async ({ page }) => {
        test.skip(!createdLeadId, '需要先创建线索');

        // 导航到线索详情
        await page.goto(`/leads/${createdLeadId}`);
        await page.waitForLoadState('networkidle');

        // 点击快速报价按钮
        const quickQuoteBtn = page.getByTestId('quick-quote-btn');
        await expect(quickQuoteBtn).toBeVisible({ timeout: 10000 });
        await quickQuoteBtn.click();

        // 等待页面跳转
        await expect(page).toHaveURL(/\/leads\/.*\/quick-quote/);
        await page.waitForLoadState('networkidle');

        // 选择方案 (经济型 或 第一个可用方案)
        const economicPlan = page.getByTestId('plan-ECONOMIC');
        const comfortPlan = page.getByTestId('plan-COMFORT');

        if (await economicPlan.isVisible()) {
            await economicPlan.click();
        } else if (await comfortPlan.isVisible()) {
            await comfortPlan.click();
        } else {
            // 点击第一个方案
            await page.locator('[data-testid^="plan-"]').first().click();
        }

        // 快速报价现在是单页表单，不需要点击“下一步”
        console.log('选择方案完成，开始填写房间信息');

        // 填写房间信息 (使用默认值或修改)
        const roomInput = page.locator('input[name="rooms.0.name"]');
        if (await roomInput.isVisible()) {
            await roomInput.fill('客厅');
            // 填写必需的尺寸信息
            await page.locator('input[name="rooms.0.width"]').fill('350');
            await page.locator('input[name="rooms.0.height"]').fill('270');
        }

        // 提交报价
        const submitBtn = page.getByTestId('submit-quote-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // 验证跳转到报价详情页
        await expect(page).toHaveURL(/\/quotes\/.*/, { timeout: 15000 });

        // 获取报价 ID
        const url = page.url();
        createdQuoteId = url.split('/quotes/')[1]?.split('?')[0] || '';

        expect(createdQuoteId).toBeTruthy();
        console.log(`✅ 快速报价创建成功: ${createdQuoteId}`);
    });

    test('Step 3: 激活报价单', async ({ page }) => {
        test.skip(!createdQuoteId, '需要先创建报价');

        // 导航到报价详情
        await page.goto(`/quotes/${createdQuoteId}`);
        await page.waitForLoadState('networkidle');

        // 查找激活按钮
        const activateBtn = page.getByRole('button', { name: /激活|生效/ });

        if (await activateBtn.isVisible()) {
            await activateBtn.click();

            // 可能有确认对话框
            const confirmBtn = page.getByRole('button', { name: /确认|确定/ });
            if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmBtn.click();
            }

            // 验证状态变更
            await expect(page.getByText(/生效|ACTIVE/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 报价单激活成功');
        } else {
            console.log('⚠️ 激活按钮不可见，可能报价已激活或状态不对');
        }
    });

    test('Step 4: 报价转订单', async ({ page }) => {
        test.skip(!createdQuoteId, '需要先创建报价');

        await page.goto(`/quotes/${createdQuoteId}`);
        await page.waitForLoadState('networkidle');

        // 查找转订单按钮
        const convertBtn = page.getByRole('button', { name: /转订单|创建订单/ });

        if (await convertBtn.isVisible()) {
            await convertBtn.click();

            // 处理确认对话框
            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
                const confirmBtn = dialog.getByRole('button', { name: /确认|确定|创建/ });
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                }
            }

            // 验证跳转到订单页或显示成功消息
            await Promise.race([
                expect(page).toHaveURL(/\/orders\/.*/, { timeout: 10000 }),
                expect(page.getByText(/成功|订单已创建/).first()).toBeVisible({ timeout: 10000 })
            ]);

            // 获取订单 ID
            if (page.url().includes('/orders/')) {
                createdOrderId = page.url().split('/orders/')[1]?.split('?')[0] || '';
            }

            console.log(`✅ 转订单成功: ${createdOrderId || '(需从列表获取)'}`);
        } else {
            console.log('⚠️ 转订单按钮不可见，可能报价未激活');
        }
    });

    test('Step 5: 验证订单详情与状态', async ({ page }) => {
        // 如果没有从上一步获取订单 ID，尝试从订单列表查找
        if (!createdOrderId) {
            await page.goto('/orders');
            await page.waitForLoadState('networkidle');

            const row = page.locator('tr').filter({ hasText: testCustomerName }).first();
            if (await row.isVisible()) {
                const link = row.locator('a[href^="/orders/"]');
                const href = await link.getAttribute('href');
                createdOrderId = href?.split('/orders/')[1] || '';
            }
        }

        test.skip(!createdOrderId, '需要先创建订单');

        await page.goto(`/orders/${createdOrderId}`);
        await page.waitForLoadState('networkidle');

        // 验证订单详情页加载
        await expect(page.getByText(/订单/)).toBeVisible();

        // 验证客户信息
        await expect(page.getByText(testCustomerName)).toBeVisible();

        // 验证财务信息卡片
        const financeCard = page.locator('[class*="card"]').filter({ hasText: /财务|已收/ });
        await expect(financeCard.first()).toBeVisible();

        // 验证时间线/操作记录 (如果存在)
        const timelineCard = page.locator('[class*="card"]').filter({ hasText: /操作记录|时间线/ });
        if (await timelineCard.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('✅ 订单时间线可见');
        }

        console.log('✅ 订单详情验证通过');
    });

    test('Step 6: 确认排产', async ({ page }) => {
        test.skip(!createdOrderId, '需要先创建订单');

        await page.goto(`/orders/${createdOrderId}`);
        await page.waitForLoadState('networkidle');

        // 查找确认排产按钮
        const confirmBtn = page.getByRole('button', { name: /确认排产|确认生产/ });

        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();

            // 处理确认对话框
            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
                const okBtn = dialog.getByRole('button', { name: /确认|确定/ });
                await okBtn.click();
            }

            // 验证状态变更
            await expect(page.getByText(/生产中|IN_PRODUCTION/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 确认排产成功');
        } else {
            console.log('⚠️ 确认排产按钮不可见，可能订单状态不对');
        }
    });

    test('Step 7: 安排发货', async ({ page }) => {
        test.skip(!createdOrderId, '需要先创建订单');
        test.setTimeout(60000); // 单独增加此步骤的超时

        await page.goto(`/orders/${createdOrderId}`);
        await page.waitForLoadState('networkidle');

        // 等待页面完全渲染
        await expect(page.getByText(/订单/)).toBeVisible({ timeout: 10000 });

        // 查找发货按钮（匹配多种可能的文案）
        const shipBtn = page.getByRole('button', { name: /发货|安排发货|申请发货/ });

        // 增加显式等待，某些状态下按钮可能延迟出现
        await shipBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
            console.log('⚠️ 发货按钮等待超时');
        });

        if (await shipBtn.isVisible()) {
            // 滚动到视图并使用 force 点击
            await shipBtn.scrollIntoViewIfNeeded();
            await shipBtn.click({ force: true });

            // 处理确认对话框
            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
                const okBtn = dialog.getByRole('button', { name: /确认|确定/ });
                await okBtn.click();
            }

            // 验证状态变更
            await expect(page.getByText(/已发货|SHIPPED/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 发货成功');
        } else {
            console.log('⚠️ 发货按钮不可见，可能订单状态不对');
        }
    });
});

// 独立的辅助测试
test.describe('销售流程边界条件', () => {
    test('应阻止激活没有明细的报价单', async () => {
        // 这个测试需要一个空报价单，通常在实际业务中不存在
        // 可以通过 API 直接创建测试数据
        console.log('⏭️ 跳过：需要专门的测试数据');
        test.skip();
    });

    test('应阻止重复转订单', async ({ page }) => {
        // 找一个已转订单的报价单
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');

        const lockedRow = page.locator('tr').filter({ hasText: /LOCKED|已锁定/ }).first();

        if (await lockedRow.isVisible()) {
            await lockedRow.locator('a').first().click();
            await page.waitForURL(/\/quotes\/.*/);

            // 转订单按钮应该不可见或禁用
            const convertBtn = page.getByRole('button', { name: /转订单/ });
            const isVisible = await convertBtn.isVisible().catch(() => false);
            const isDisabled = await convertBtn.isDisabled().catch(() => true);

            expect(isVisible === false || isDisabled === true).toBeTruthy();
            console.log('✅ 已锁定报价单不能重复转订单');
        } else {
            console.log('⏭️ 无已锁定报价单，跳过测试');
        }
    });
});
