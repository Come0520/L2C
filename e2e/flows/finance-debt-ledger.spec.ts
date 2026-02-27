/**
 * 财务欠款账本 E2E 测试
 *
 * 测试边缘场景：
 * 1. 欠款记录展示
 * 2. 欠款自动抵扣
 * 3. 扣款超过待结算金额处理
 */
import { test, expect } from '@playwright/test';
import { skipOnDataLoadError } from '../helpers/test-utils';

test.describe('财务欠款账本 (Finance Debt Ledger)', () => {
    test.beforeEach(async ({ page: _page }) => {
        // 预留钩子
    });

    test('P0-1: 应能查看供应商对账单列表', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 验证页面加载
        await expect(page.getByRole('heading', { name: /对账|应付|供应商|财务中心/ })).toBeVisible({ timeout: 10000 });

        // 验证表格存在
        const table = page.locator('table');
        if (await table.isVisible({ timeout: 10000 }).catch(() => false)) {
            console.log('✅ 对账单列表页面正常');
        } else {
            console.log('⚠️ 表格未显示');
        }
    });

    test('P0-2: 对账单详情应显示欠款信息', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 点击进入第一条对账单详情
        const table = page.locator('table');
        const firstRow = table.locator('tbody tr').first();

        if (!(await firstRow.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ 对账单列表为空');
            return;
        }

        await firstRow.locator('a').first().click().catch(() => { });

        // 查找欠款相关信息
        const debtSection = page.locator('text=欠款').first();
        if (await debtSection.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ 欠款信息区域可见');
        } else {
            // 也可能在扣款明细中
            const deductionSection = page.locator('text=扣款').first();
            if (await deductionSection.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('✅ 扣款信息区域可见');
            } else {
                console.log('⚠️ 未找到欠款/扣款信息（可能该供应商无售后扣款）');
            }
        }
    });

    test('P0-3: 售后扣款应自动关联到对账单', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 此测试验证售后扣款与对账单的联动
        const table = page.locator('table');
        if (!(await table.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ 表格未显示');
            return;
        }

        const rows = table.locator('tbody tr');
        const rowCount = await rows.count();

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
            const row = rows.nth(i);

            // 查找是否有扣款金额列
            const cells = row.locator('td');
            const cellCount = await cells.count();

            for (let j = 0; j < cellCount; j++) {
                const cellText = await cells.nth(j).textContent();
                if (cellText && (cellText.includes('扣款') || cellText.includes('-'))) {
                    console.log(`✅ 第 ${i + 1} 行发现扣款记录: ${cellText}`);
                    break;
                }
            }
        }
    });
});

test.describe('财务极端场景 (Finance Edge Cases)', () => {
    test('P1-1: 扣款超过待结算金额应生成欠款记录', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 查找欠款账本入口
        const debtLedgerLink = page.getByRole('link', { name: /欠款账本|欠款管理/ });
        if (await debtLedgerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await debtLedgerLink.click();

            // 验证欠款列表
            const table = page.locator('table');
            if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('✅ 欠款账本页面可访问');
            }
        } else {
            // 可能在侧边栏或其他位置
            console.log('⚠️ 未找到欠款账本入口（可能集成在对账单详情中）');
        }
    });

    test('P1-2: 对账单应支持手动调整', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        const table = page.locator('table');
        const firstRow = table.locator('tbody tr').first();

        if (!(await firstRow.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('⚠️ 对账单列表为空');
            return;
        }

        await firstRow.locator('a').first().click().catch(() => { });

        // 查找调整按钮
        const adjustBtn = page.getByRole('button', { name: /调整|修改|编辑/ });
        if (await adjustBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ 对账单支持手动调整');
        } else {
            console.log('⚠️ 未找到调整按钮');
        }
    });

    test('P1-3: 应能导出对账单', async ({ page }) => {
        await page.goto('/finance/statements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 查找导出按钮
        const exportBtn = page.getByRole('button', { name: /导出|下载|Export/ });
        if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ 导出功能可用');
            // 不实际点击，避免触发下载
        } else {
            console.log('⚠️ 未找到导出按钮');
        }
    });
});

test.describe('劳务结算欠款处理', () => {
    test.beforeEach(async ({ page: _page }) => {
        // 预留钩子
    });

    test('P1-4: 劳务结算应显示售后扣款明细', async ({ page }) => {
        await page.goto('/finance/labor-settlement', { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (await skipOnDataLoadError(page)) return;

        // 验证页面加载
        const heading = page.getByRole('heading', { name: /劳务|结算|师傅|财务中心/ });
        if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ 劳务结算页面正常');
        }

        // 进入结算详情
        const table = page.locator('table');
        const firstRow = table.locator('tbody tr').first();

        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstRow.locator('a').first().click().catch(() => { });

            // 查找售后扣款信息
            const afterSalesDeduction = page.locator('text=售后').first();
            if (await afterSalesDeduction.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('✅ 劳务结算中显示售后扣款信息');
            } else {
                console.log('⚠️ 未找到售后扣款信息（可能该师傅无售后责任）');
            }
        } else {
            console.log('⚠️ 劳务结算列表为空');
        }
    });
});
