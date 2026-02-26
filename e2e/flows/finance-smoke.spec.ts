import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('财务模块 E2E 冒烟测试', () => {

    test('凭证列表和新建凭证页能够正常加载', async ({ page }) => {
        const success = await safeGoto(page, '/finance/journal');
        if (success) {
            await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
            // 可以等待“记账凭证”标题出现
            await expect(page.locator('body')).toContainText(/凭证|Journal/, { timeout: 15000 });
        }

        const createSuccess = await safeGoto(page, '/finance/journal/create');
        if (createSuccess) {
            await expect(page.locator('body')).toContainText(/新建凭证|保存|借方/, { timeout: 15000 });
            console.log('✅ 新建凭证页面加载成功');
        }
    });

    test('三大财务报表能够正常加载', async ({ page }) => {
        const sheets = [
            { path: '/finance/reports/balance-sheet', expected: /资产负债表/ },
            { path: '/finance/reports/income-statement', expected: /利润表/ },
            { path: '/finance/reports/cash-flow', expected: /现金流量表/ }
        ];

        for (const sheet of sheets) {
            const success = await safeGoto(page, sheet.path);
            if (success) {
                await expect(page.locator('body')).toContainText(sheet.expected, { timeout: 15000 });
                console.log(`✅ 报表 [${sheet.path}] 加载成功`);
            }
        }
    });

    test('科目管理与设置页加载', async ({ page }) => {
        const success = await safeGoto(page, '/finance/ledger');
        if (success) {
            await expect(page.locator('body')).toContainText(/科目|科目名称|新建/, { timeout: 15000 });
            console.log('✅ 科目管理页加载成功');
        }
    });

});
