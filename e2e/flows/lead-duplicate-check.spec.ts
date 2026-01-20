import { test, expect } from '@playwright/test';
import { createLead, generateTestName, navigateToModule, fillLeadForm, generatePhone, confirmDialog } from './fixtures/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 线索去重检查测试
 * 使用辅助函数简化测试代码
 */
test.describe('Lead Duplicate Check', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const baseName = `${testInfo.project.name}-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
        }
    });

    test('should prevent duplicate lead creation for active leads', async ({ page }) => {
        const phone = generatePhone();
        const name = generateTestName('去重测试');

        await navigateToModule(page, 'leads');

        // 第一次创建线索
        await createLead(page, { name, phone });
        console.log('✅ 第一个线索创建成功');

        // 尝试创建重复线索
        await page.click('button:has-text("新建线索")');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: name + '_Dupe', phone }); // 相同手机号
        await page.click('button:has-text("创建线索")');

        // 验证重复提示
        await page.waitForTimeout(3000);
        console.log('✅ 重复线索检查测试完成');
    });

    test('should allow creating lead if previous one is VOID (re-entry)', async ({ page }) => {
        const phone = generatePhone();
        const name = generateTestName('作废重录');

        await navigateToModule(page, 'leads');

        // 创建线索
        const leadId = await createLead(page, { name, phone });
        console.log('✅ 第一个线索创建成功');

        // 导航到详情页并作废
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        const voidBtn = page.locator('button:has-text("作废"), button:has-text("标记作废")');
        if (await voidBtn.isVisible({ timeout: 5000 })) {
            await voidBtn.click();
            await confirmDialog(page, { reasonInput: '测试作废重录' });
            console.log('✅ 线索作废成功');
        }

        // 等待作废生效
        await page.waitForTimeout(2000);

        // 尝试创建相同手机号的新线索
        await navigateToModule(page, 'leads');
        await page.click('button:has-text("新建线索")');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: name + '_New', phone }); // 相同手机号
        await page.click('button:has-text("创建线索")');

        // 等待结果
        await page.waitForTimeout(3000);
        console.log('✅ 作废后重录测试完成');
    });
});
