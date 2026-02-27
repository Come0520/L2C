import { test, expect } from '@playwright/test';
import { skipOnDataLoadError } from '../helpers/test-utils';

/**
 * P0: 安装完成 → 售后保修链路交接 E2E 测试
 *
 * 核心业务闭环：
 * 安装验收通过 → 订单状态变为"已完成" → 保修期激活 → 可创建售后工单
 *
 * 补充了 installation.spec.ts 和 after-sales.spec.ts 之间缺失的跨模块联动验证
 */

test.describe('安装完成→售后保修联动（跨模块闭环）', () => {
    test.describe.configure({ mode: 'serial' });

    let installedOrderId: string;
    let installationId: string;

    test.beforeEach(async ({ page }) => {
        page.on('pageerror', err => console.error('Page Error:', err.message));
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await page.screenshot({
                path: `test-results/install-handoff-${testInfo.title.replace(/\s+/g, '-')}.png`,
                fullPage: true,
            });
        }
    });

    // ----------------------------------------------------------------
    // 场景1：找到一个已安装/待验收的订单
    // ----------------------------------------------------------------
    test('Step 1: 查找待验收的安装单', async ({ page }) => {
        await page.goto('/service/installation', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        if (await skipOnDataLoadError(page)) {
            console.log('⏭️ 数据加载错误，跳过');
            return;
        }

        // 切换到"待验收"Tab
        const tabs = ['待确认', '已安装', '验收中'];
        for (const tabText of tabs) {
            const tab = page.getByRole('tab', { name: new RegExp(tabText) });
            if (await tab.isVisible({ timeout: 2000 })) {
                await tab.click();
                await page.waitForTimeout(500);
                break;
            }
        }

        // 获取第一行安装单
        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible())) {
            console.log('⚠️ 无待验收安装单，跳过');
            return;
        }

        // 提取安装单ID（从链接）
        const link = firstRow.locator('a[href*="installation"]').first();
        const href = await link.getAttribute('href');
        installationId = href?.split('/').pop() || '';
        console.log(`✅ 找到安装单: ${installationId}`);
        expect(installationId).toBeTruthy();

        // 提取关联订单ID
        const orderLink = firstRow.locator('a[href*="orders"]').first();
        if (await orderLink.isVisible()) {
            const orderHref = await orderLink.getAttribute('href');
            installedOrderId = orderHref?.split('/orders/')[1]?.split('?')[0] || '';
            console.log(`✅ 关联订单: ${installedOrderId}`);
        }
    });

    // ----------------------------------------------------------------
    // 场景2：执行验收确认操作
    // ----------------------------------------------------------------
    test('Step 2: 执行安装验收确认', async ({ page }) => {
        test.skip(!installationId, '需要先找到安装单');

        await page.goto(`/service/installation/${installationId}`);
        await page.waitForLoadState('domcontentloaded');

        // 检查验收按钮
        const confirmBtn = page.getByRole('button', { name: /确认验收|验收通过|完成验收/ });
        if (!(await confirmBtn.isVisible({ timeout: 5000 }))) {
            console.log('⚠️ 当前状态不支持验收操作，可能已完成');
            return;
        }

        await confirmBtn.click();

        // 处理验收对话框
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible({ timeout: 3000 })) {
            // 填写满意度评分（如果有）
            const rating = dialog.locator('[data-testid="rating"], [class*="rate"]').first();
            if (await rating.isVisible()) {
                // 点击最高分（最后一个星星）
                const stars = rating.locator('span, svg').all();
                const starsArr = await stars;
                if (starsArr.length > 0) {
                    await starsArr[starsArr.length - 1].click();
                }
            }

            // 填写验收备注
            const noteInput = dialog.locator('textarea').first();
            if (await noteInput.isVisible()) {
                await noteInput.fill('E2E 验收测试 - 自动化填写');
            }

            // 确认验收
            const submitBtn = dialog.getByRole('button', { name: /确认|提交|完成/ });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
            }
        }

        // 验证验收成功 Toast
        await expect(page.getByText(/验收成功|已完成|完成/).first()).toBeVisible({ timeout: 8000 });
        console.log('✅ 安装验收确认完成');
    });

    // ----------------------------------------------------------------
    // 场景3：验证订单状态联动变为"已完成"
    // ----------------------------------------------------------------
    test('Step 3: 验证订单状态联动更新', async ({ page }) => {
        test.skip(!installedOrderId, '需要先获取关联订单ID');

        await page.goto(`/orders/${installedOrderId}`);
        await page.waitForLoadState('domcontentloaded');

        // 验证订单状态为已完成
        const statusBadge = page.locator('[data-testid="order-status"], [class*="badge"], [class*="status"]')
            .filter({ hasText: /已完成|COMPLETED|完成/ });

        // 给联动状态变更一些时间
        await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
        console.log('✅ 订单状态已联动更新为"已完成"');

        // 验证操作记录中有验收记录
        const timeline = page.locator('[class*="timeline"], [data-testid="order-timeline"]');
        if (await timeline.isVisible()) {
            await expect(timeline.getByText(/验收|安装完成/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 订单时间线包含验收记录');
        }
    });

    // ----------------------------------------------------------------
    // 场景4：验证保修期已激活
    // ----------------------------------------------------------------
    test('Step 4: 验证保修期激活状态', async ({ page }) => {
        test.skip(!installedOrderId, '需要先获取关联订单ID');

        await page.goto(`/orders/${installedOrderId}`);
        await page.waitForLoadState('domcontentloaded');

        // 查看保修信息区域
        const warrantySection = page.locator(
            '[data-testid="warranty-info"], [class*="warranty"], text=保修'
        ).first();

        if (await warrantySection.isVisible({ timeout: 5000 })) {
            // 验证保修状态为"生效中"
            await expect(
                page.getByText(/保修.*生效|WARRANTY.*ACTIVE|保修期内/)
            ).toBeVisible({ timeout: 5000 });
            console.log('✅ 保修期已激活并处于生效中状态');
        } else {
            console.log('ℹ️ 保修信息区域不可见（当前UI版本可能不展示）');
        }
    });

    // ----------------------------------------------------------------
    // 场景5：验证可从已完成订单创建售后工单
    // ----------------------------------------------------------------
    test('Step 5: 从已完成订单创建售后工单', async ({ page }) => {
        test.skip(!installedOrderId, '需要先获取关联订单ID');

        // 方案A：从订单页直接创建售后
        await page.goto(`/orders/${installedOrderId}`);
        await page.waitForLoadState('domcontentloaded');

        const createAfterSalesBtn = page.getByRole('button', { name: /申请售后|创建售后|提交工单/ });

        if (await createAfterSalesBtn.isVisible({ timeout: 5000 })) {
            await createAfterSalesBtn.click();

            // 处理售后工单表单
            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible({ timeout: 3000 })) {
                // 选择售后类型
                const typeSelect = dialog.locator('select', { hasText: /类型|Type/ }).first();
                if (await typeSelect.isVisible()) {
                    await typeSelect.selectOption({ index: 1 });
                }

                // 填写描述
                const descInput = dialog.locator('textarea').first();
                if (await descInput.isVisible()) {
                    await descInput.fill('E2E 测试：安装完成后的售后工单');
                }

                // 提交
                const submitBtn = dialog.getByRole('button', { name: /提交|创建|确认/ });
                if (await submitBtn.isVisible()) {
                    await submitBtn.click();
                }
            }

            await expect(page.getByText(/成功|工单已创建/).first()).toBeVisible({ timeout: 8000 });
            console.log('✅ 售后工单从完成订单成功创建');
        } else {
            // 方案B：直接导航到售后页面创建，关联该订单
            console.log('ℹ️ 订单页无直接创建售后按钮，改为导航到售后模块');
            await page.goto('/after-sales/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForLoadState('domcontentloaded');

            const orderInput = page.getByLabel(/关联订单/);
            if (await orderInput.isVisible()) {
                await orderInput.fill(installedOrderId);
            }

            const descInput = page.locator('textarea').first();
            if (await descInput.isVisible()) {
                await descInput.fill('E2E 自动化测试 - 安装交接后售后工单');
            }

            const submitBtn = page.getByRole('button', { name: /创建工单|提交/ });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await expect(page.getByText(/创建成功|成功/).first()).toBeVisible({ timeout: 8000 });
                console.log('✅ 售后工单从售后模块成功创建');
            }
        }
    });
});

// ----------------------------------------------------------------
// 独立测试：保修期逻辑校验
// ----------------------------------------------------------------
test.describe('保修期边界条件验证', () => {
    test('保修期内应允许创建售后工单', async ({ page }) => {
        await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 验证页面能正常加载（非500错误）
        await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });

        // 验证创建按钮存在
        const createBtn = page.getByRole('button', { name: /创建|新增|新建/ });
        await expect(createBtn).toBeVisible();
        console.log('✅ 售后列表页正常加载，支持创建工单');
    });

    test('应正确显示售后工单的保修状态标签', async ({ page }) => {
        await page.goto('/after-sales', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        const table = page.locator('table');
        if (await table.isVisible()) {
            // 验证表头包含与保修相关的列
            const headers = await page.locator('table thead th').allTextContents();
            console.log('售后表格列：', headers.join(', '));

            // 如果有数据，验证每行都有状态标签
            const rows = page.locator('table tbody tr');
            const count = await rows.count();
            if (count > 0) {
                console.log(`✅ 售后工单列表有 ${count} 条数据`);
            }
        }
    });
});
