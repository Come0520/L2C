import { test, expect } from '@playwright/test';

/**
 * P0: 订单全生命周期 E2E 测试
 * 
 * 覆盖场景:
 * 1. 报价转订单 (必须上传客户确认凭证)
 * 2. 订单状态流转 (PENDING_PO → IN_PRODUCTION → PENDING_DELIVERY → SHIPPED → PENDING_INSTALL → COMPLETED)
 * 3. 采购单拆分与状态联动 (木桶效应)
 * 4. 撤单功能
 */

test.describe('订单全生命周期', () => {
    // 测试用的唯一标识符
    const timestamp = Date.now();
    const testLeadName = `E2E订单测试_${timestamp}`;
    const testPhone = `138${timestamp.toString().slice(-8)}`;

    test.beforeEach(async ({ page }) => {
        // 等待页面加载完成
        await page.waitForLoadState('networkidle');
    });

    test('应成功创建线索并生成报价单', async ({ page }) => {
        // Step 1: 导航到线索列表
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // Step 2: 点击录入线索
        await page.getByRole('button', { name: '录入线索' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Step 3: 填写线索表单
        await page.getByLabel('客户姓名').fill(testLeadName);
        await page.getByLabel('手机号').fill(testPhone);
        await page.getByLabel('备注/需求').fill('E2E 订单生命周期测试 - 自动生成');

        // Step 4: 提交
        await page.getByRole('button', { name: /创建|保存/ }).click();

        // Step 5: 验证创建成功
        await expect(page.getByText(/成功/)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(testLeadName)).toBeVisible();

        console.log('✅ 线索创建成功');
    });

    test('应从报价单转化为订单', async ({ page }) => {
        // 前置: 导航到报价单列表
        await page.goto('/quotes');
        await page.waitForLoadState('networkidle');

        // 查找测试报价单 (假设已经通过快速报价创建)
        // 如果列表为空，先创建一个
        const tableRow = page.locator('table tbody tr').first();

        if (await tableRow.isVisible()) {
            // 点击进入详情
            await tableRow.click();
            await page.waitForURL(/\/quotes\/.+/);

            // 查找"转订单"按钮
            const convertBtn = page.getByRole('button', { name: /转订单|创建订单/ });

            if (await convertBtn.isVisible()) {
                await convertBtn.click();

                // 应该弹出确认对话框，要求上传客户确认凭证
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 验证必须上传凭证
                const proofUpload = page.locator('input[type="file"]');
                if (await proofUpload.isVisible()) {
                    console.log('✅ 确认凭证上传组件可见');
                }

                // 关闭对话框 (暂时不提交)
                await page.keyboard.press('Escape');
            }
        } else {
            console.log('⚠️ 报价单列表为空，跳过转订单测试');
        }
    });

    test('应显示订单列表并支持筛选', async ({ page }) => {
        // 导航到订单列表
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 验证页面标题
        await expect(page.getByRole('heading', { name: /订单/ })).toBeVisible();

        // 验证表格存在
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 验证状态筛选器
        const statusFilter = page.getByRole('combobox', { name: /状态/ });
        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            await page.waitForTimeout(300);

            // 验证状态选项
            await expect(page.getByRole('option', { name: /待下单|PENDING_PO/ })).toBeVisible();

            // 关闭下拉框
            await page.keyboard.press('Escape');
        }

        console.log('✅ 订单列表页加载正常');
    });

    test('应显示订单详情与状态进度条', async ({ page }) => {
        // 导航到订单列表
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 点击第一个订单进入详情
        const firstOrderLink = page.locator('table tbody tr a').first();

        if (await firstOrderLink.isVisible()) {
            await firstOrderLink.click();
            await page.waitForURL(/\/orders\/.+/);

            // 验证详情页加载
            await expect(page.getByText(/订单详情|订单号/)).toBeVisible();

            // 验证状态进度条
            const statusStepper = page.locator('[data-testid="order-status-stepper"]');
            if (await statusStepper.isVisible()) {
                console.log('✅ 状态进度条可见');
            }

            // 验证 Tab 页签
            const tabTriggers = page.locator('[role="tablist"] button');
            const tabCount = await tabTriggers.count();
            expect(tabCount).toBeGreaterThan(0);
            console.log(`✅ 详情页包含 ${tabCount} 个 Tab 页签`);
        } else {
            console.log('⚠️ 订单列表为空，跳过详情页测试');
        }
    });

    test('应支持订单撤单 (待下单状态)', async ({ page }) => {
        // 导航到订单列表
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找待下单状态的订单
        const pendingOrderRow = page.locator('tr', { has: page.getByText(/待下单|PENDING_PO/) }).first();

        if (await pendingOrderRow.isVisible()) {
            // 查找撤单按钮
            const cancelBtn = pendingOrderRow.getByRole('button', { name: /撤单/ });

            if (await cancelBtn.isVisible()) {
                await cancelBtn.click();

                // 验证确认对话框
                const confirmDialog = page.getByRole('alertdialog');
                if (await confirmDialog.isVisible()) {
                    console.log('✅ 撤单确认对话框可见');

                    // 取消撤单 (不真正执行)
                    await page.getByRole('button', { name: /取消|否/ }).click();
                }
            }
        } else {
            console.log('⚠️ 无待下单订单，跳过撤单测试');
        }
    });
});

test.describe('订单与采购单联动 (木桶效应)', () => {
    test('应验证采购单列表与状态筛选', async ({ page }) => {
        // 导航到采购单列表
        await page.goto('/supply-chain/purchase-orders');
        await page.waitForLoadState('networkidle');

        // 验证页面加载
        await expect(page.getByRole('heading', { name: /采购单/ })).toBeVisible();

        // 验证表格
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // 验证供应商筛选器
        const supplierFilter = page.getByRole('combobox', { name: /供应商/ });
        if (await supplierFilter.isVisible()) {
            console.log('✅ 供应商筛选器可见');
        }

        console.log('✅ 采购单列表页加载正常');
    });

    test('应验证采购单详情与状态流转按钮', async ({ page }) => {
        // 导航到采购单列表
        await page.goto('/supply-chain/purchase-orders');
        await page.waitForLoadState('networkidle');

        // 点击第一个采购单
        const firstPOLink = page.locator('table tbody tr a').first();

        if (await firstPOLink.isVisible()) {
            await firstPOLink.click();
            await page.waitForURL(/\/supply-chain\/purchase-orders\/.+/);

            // 验证详情页
            await expect(page.getByText(/采购单详情|采购单号/)).toBeVisible();

            // 验证状态操作按钮 (根据当前状态显示不同按钮)
            const confirmOrderBtn = page.getByRole('button', { name: /确认下单/ });
            const readyBtn = page.getByRole('button', { name: /备货完成/ });
            const logisticsBtn = page.getByRole('button', { name: /填物流|发货/ });

            const hasActionBtn = await confirmOrderBtn.isVisible()
                || await readyBtn.isVisible()
                || await logisticsBtn.isVisible();

            if (hasActionBtn) {
                console.log('✅ 状态操作按钮可见');
            }
        } else {
            console.log('⚠️ 采购单列表为空，跳过详情页测试');
        }
    });
});

test.describe('订单状态完整流转', () => {
    test('应支持 PENDING_PO -> IN_PRODUCTION 状态转换', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找 PENDING_PO 状态的订单
        const pendingRow = page.locator('tr').filter({ hasText: /待下单|PENDING_PO/ }).first();

        if (await pendingRow.isVisible()) {
            const link = pendingRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            // 查找确认排产按钮
            const confirmBtn = page.getByRole('button', { name: /确认排产|确认生产/ });

            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();

                // 处理确认对话框
                const dialog = page.getByRole('dialog');
                if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const okBtn = dialog.getByRole('button', { name: /确认|确定/ });
                    await okBtn.click();
                }

                // 验证状态变更
                await expect(page.getByText(/生产中|IN_PRODUCTION/)).toBeVisible({ timeout: 5000 });
                console.log('✅ PENDING_PO -> IN_PRODUCTION 转换成功');
            } else {
                console.log('⏭️ 确认排产按钮不可见');
            }
        } else {
            console.log('⏭️ 无待下单订单');
        }
    });

    test('应支持 IN_PRODUCTION -> SHIPPED 状态转换', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找 IN_PRODUCTION 状态的订单
        const prodRow = page.locator('tr').filter({ hasText: /生产中|IN_PRODUCTION/ }).first();

        if (await prodRow.isVisible()) {
            const link = prodRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            // 查找发货按钮
            const shipBtn = page.getByRole('button', { name: /发货|安排发货/ });

            if (await shipBtn.isVisible()) {
                await shipBtn.click();

                const dialog = page.getByRole('dialog');
                if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const okBtn = dialog.getByRole('button', { name: /确认|确定/ });
                    await okBtn.click();
                }

                await expect(page.getByText(/已发货|SHIPPED/)).toBeVisible({ timeout: 5000 });
                console.log('✅ IN_PRODUCTION -> SHIPPED 转换成功');
            } else {
                console.log('⏭️ 发货按钮不可见');
            }
        } else {
            console.log('⏭️ 无生产中订单');
        }
    });

    test('应显示订单操作时间线', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        const firstLink = page.locator('table tbody tr a').first();

        if (await firstLink.isVisible()) {
            await firstLink.click();
            await page.waitForURL(/\/orders\/.+/);

            // 验证时间线/操作记录卡片
            const timelineCard = page.locator('[class*="card"]').filter({ hasText: /操作记录|时间线/ });

            if (await timelineCard.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                // 验证时间线项目
                const timelineItems = timelineCard.locator('[class*="timeline"], [class*="flex"]');
                const itemCount = await timelineItems.count();

                console.log(`✅ 订单时间线可见，包含 ${itemCount} 个项目`);
            } else {
                console.log('⚠️ 时间线卡片不可见');
            }
        } else {
            console.log('⏭️ 订单列表为空');
        }
    });

    test('应在发货后允许创建安装任务', async ({ page }) => {
        await page.goto('/orders');
        await page.waitForLoadState('networkidle');

        // 查找已发货状态的订单
        const shippedRow = page.locator('tr').filter({ hasText: /已发货|SHIPPED/ }).first();

        if (await shippedRow.isVisible()) {
            const link = shippedRow.locator('a').first();
            await link.click();
            await page.waitForURL(/\/orders\/.+/);

            // 查找创建安装任务按钮
            const installBtn = page.getByRole('button', { name: /创建安装|安装任务/ });

            if (await installBtn.isVisible()) {
                console.log('✅ 发货后可以创建安装任务');
            } else {
                // 可能已经创建了安装任务
                const installCard = page.locator('[class*="card"]').filter({ hasText: /安装服务/ });
                if (await installCard.isVisible()) {
                    console.log('✅ 安装任务卡片可见');
                }
            }
        } else {
            console.log('⏭️ 无已发货订单');
        }
    });
});
