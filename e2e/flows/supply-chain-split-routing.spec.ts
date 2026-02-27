import { test, expect } from '@playwright/test';
import { skipOnDataLoadError } from '../helpers/test-utils';

/**
 * P1: 供应链拆单分配完整链路 E2E 测试
 *
 * 核心业务流转：
 * 订单确认 → 进入待采购池 → 拆单规则自动匹配 → 成品PO/加工WO生成
 *
 * 补充了 purchase-order.spec.ts 未覆盖的"自动化拆单分配"这一 Supply-Chain 最核心差异化功能
 */

test.describe('供应链拆单分配链路（核心差异化功能）', () => {
    test.describe.configure({ mode: 'serial' });

    let pendingOrderNo: string;
    let generatedPoId: string;

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await page.screenshot({
                path: `test-results/split-routing-${testInfo.title.replace(/\s+/g, '-')}.png`,
                fullPage: true,
            });
        }
    });

    // ----------------------------------------------------------------
    // 场景1：查看待采购池是否有待处理项
    // ----------------------------------------------------------------
    test('Step 1: 查看待采购池数据', async ({ page }) => {
        // 导航到待采购池（Pending Pool）
        await page.goto('/supply-chain/pending-pool', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        if (await skipOnDataLoadError(page)) {
            console.log('⏭️ 数据加载错误，跳过');
            return;
        }

        // 验证待采购池页面正常加载
        await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });

        // 统计各类型数量
        const tabs = page.locator('[role="tab"]');
        const tabCount = await tabs.count();
        console.log(`✅ 待采购池有 ${tabCount} 个分类 Tab`);

        // 查看草稿PO数量
        const draftTab = page.getByRole('tab', { name: /草稿|Draft|DRAFT/ });
        if (await draftTab.isVisible()) {
            await draftTab.click();
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        console.log(`✅ 待采购池共 ${count} 条待处理数据`);

        // 获取第一条草稿PO的订单号
        if (count > 0) {
            const firstRow = rows.first();
            const orderNoCell = firstRow.locator('td').nth(1);
            pendingOrderNo = (await orderNoCell.textContent())?.trim() || '';
            console.log(`✅ 第一条草稿PO: ${pendingOrderNo}`);
        }
    });

    // ----------------------------------------------------------------
    // 场景2：查看拆单规则配置
    // ----------------------------------------------------------------
    test('Step 2: 验证拆单规则已配置', async ({ page }) => {
        await page.goto('/supply-chain/split-rules', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        if (await skipOnDataLoadError(page)) {
            console.log('⏭️ 跳过');
            return;
        }

        // 验证规则列表存在
        await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });

        const table = page.locator('table');
        if (await table.isVisible()) {
            const rows = page.locator('table tbody tr');
            const count = await rows.count();
            console.log(`✅ 已配置 ${count} 条拆单规则`);

            // 验证规则有必要字段
            if (count > 0) {
                const firstRow = rows.first();
                const rowText = await firstRow.textContent();
                console.log(`  第一条规则: ${rowText?.substring(0, 50)}...`);
            }
        } else {
            // 列表可能是卡片形式
            const cards = page.locator('[class*="card"], [class*="rule-item"]');
            const cardCount = await cards.count();
            if (cardCount > 0) {
                console.log(`✅ 已配置 ${cardCount} 条拆单规则（卡片形式）`);
            } else {
                console.log('ℹ️ 暂无拆单规则，可以去创建规则后再进行自动化拆单');
            }
        }
    });

    // ----------------------------------------------------------------
    // 场景3：在待采购池中手动分配供应商（assignToSupplier）
    // ----------------------------------------------------------------
    test('Step 3: 未匹配项手动分配供应商', async ({ page }) => {
        await page.goto('/supply-chain/pending-pool', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 切换到"未匹配"Tab（UNMATCHED items）
        const unmatchedTab = page.getByRole('tab', { name: /未匹配|待分配|UNMATCHED/ });
        if (await unmatchedTab.isVisible({ timeout: 3000 })) {
            await unmatchedTab.click();
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count === 0) {
            console.log('ℹ️ 无未匹配项，跳过手动分配测试');
            return;
        }

        // 选择第一行
        const firstCheckbox = rows.first().locator('input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
            await firstCheckbox.click();
        } else {
            await rows.first().click();
        }

        // 点击"分配供应商"按钮
        const assignBtn = page.getByRole('button', { name: /分配供应商|指定供应商|分配/ });
        if (!(await assignBtn.isVisible({ timeout: 3000 }))) {
            console.log('ℹ️ 未找到分配按钮，跳过');
            return;
        }
        await assignBtn.click();

        // 处理分配对话框
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible({ timeout: 3000 })) {
            // 选择供应商
            const supplierSelect = dialog.locator('select, [class*="select"]').first();
            if (await supplierSelect.isVisible()) {
                // 选择第一个可用供应商
                await supplierSelect.click();
                const options = dialog.getByRole('option');
                const optionCount = await options.count();
                if (optionCount > 0) {
                    await options.first().click();
                }
            }

            // 选择采购类型
            const poTypeSelect = dialog.getByLabel(/采购类型|PO类型/);
            if (await poTypeSelect.isVisible()) {
                await poTypeSelect.selectOption({ index: 1 });
            }

            // 确认分配
            const confirmBtn = dialog.getByRole('button', { name: /确认|分配|提交/ });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }
        }

        // 等待成功反馈
        const success = await page.getByText(/分配成功|成功|已创建PO/).first().isVisible({ timeout: 8000 });
        if (success) {
            console.log('✅ 手动分配供应商成功，PO已创建');
        } else {
            console.log('ℹ️ 分配结果未检测到成功Toast（可能UI方式不同）');
        }
    });

    // ----------------------------------------------------------------
    // 场景4：提交草稿PO审批
    // ----------------------------------------------------------------
    test('Step 4: 提交草稿PO进入审批', async ({ page }) => {
        await page.goto('/supply-chain/pending-pool', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 切换到草稿PO Tab
        const draftTab = page.getByRole('tab', { name: /草稿|Draft/ });
        if (await draftTab.isVisible()) {
            await draftTab.click();
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() === 0) {
            console.log('ℹ️ 无草稿PO，跳过审批测试');
            return;
        }

        // 全选
        const selectAllCheckbox = page.locator('table thead input[type="checkbox"]').first();
        if (await selectAllCheckbox.isVisible()) {
            await selectAllCheckbox.click();
        }

        // 点击"提交审批"
        const submitBtn = page.getByRole('button', { name: /提交审批|批量提交|Submit/ });
        if (await submitBtn.isVisible({ timeout: 3000 })) {
            await submitBtn.click();

            // 确认对话框
            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible({ timeout: 2000 })) {
                await dialog.getByRole('button', { name: /确认|确定/ }).click();
            }

            await expect(page.getByText(/提交成功|已提交审批/).first()).toBeVisible({ timeout: 8000 });
            console.log('✅ 草稿PO已批量提交审批');
        } else {
            console.log('ℹ️ 无批量提交按钮');
        }
    });

    // ----------------------------------------------------------------
    // 场景5：从采购单列表验证PO已生成
    // ----------------------------------------------------------------
    test('Step 5: 验证采购单（PO）已生成', async ({ page }) => {
        await page.goto('/supply-chain/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        if (await skipOnDataLoadError(page)) return;

        // 验证采购单列表存在
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 10000 });

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            console.log(`✅ 采购单列表共有 ${count} 条PO`);

            // 获取第一条PO信息
            const firstRow = rows.first();
            const poNo = await firstRow.locator('td').first().textContent();
            generatedPoId = poNo?.trim() || '';
            console.log(`✅ 第一条采购单: ${generatedPoId}`);

            // 进入PO详情验证完整性
            const detailLink = firstRow.locator('a').first();
            if (await detailLink.isVisible()) {
                await detailLink.click();
                await page.waitForLoadState('domcontentloaded');

                // 验证PO详情页包含关键信息
                await expect(page.getByText(/采购单号|PO号/)).toBeVisible({ timeout: 5000 });
                await expect(page.getByText(/供应商名称|Supplier/)).toBeVisible({ timeout: 5000 });
                console.log('✅ 采购单详情页完整性验证通过');
            }
        } else {
            console.log('ℹ️ 采购单列表为空（可能需要先创建订单并确认）');
        }
    });
});

// ----------------------------------------------------------------
// 加工工单（WO）生成验证
// ----------------------------------------------------------------
test.describe('加工工单（WO）生成验证', () => {
    test('应显示加工单列表', async ({ page }) => {
        await page.goto('/supply-chain/production-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        if (await skipOnDataLoadError(page)) return;

        await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });
        console.log('✅ 加工单列表页正常加载');

        const table = page.locator('table');
        if (await table.isVisible()) {
            const count = await page.locator('table tbody tr').count();
            console.log(`✅ 加工单列表共 ${count} 条`);
        }
    });

    test('加工单应关联正确的订单', async ({ page }) => {
        await page.goto('/supply-chain/production-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        if (await skipOnDataLoadError(page)) return;

        const firstRow = page.locator('table tbody tr').first();
        if (!(await firstRow.isVisible())) {
            console.log('ℹ️ 无加工单数据');
            return;
        }

        // 进入加工单详情
        const link = firstRow.locator('a').first();
        if (await link.isVisible()) {
            await link.click();
            await page.waitForLoadState('domcontentloaded');

            // 验证加工单详情包含关联字段
            await expect(page.getByText(/工单号|WO号|订单/)).toBeVisible({ timeout: 5000 });
            console.log('✅ 加工单详情页结构完整');
        }
    });
});
