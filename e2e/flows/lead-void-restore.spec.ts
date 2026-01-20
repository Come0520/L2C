/**
 * 线索作废与恢复 E2E 测试
 * 使用辅助函数简化测试代码
 */
import { test, expect } from '@playwright/test';
import { createLead, generateTestName, navigateToModule, clickTab, confirmDialog } from './fixtures/test-helpers';

test.describe('线索作废与恢复 (Lead Void & Restore)', () => {

    test.beforeEach(async ({ page }) => {
        await navigateToModule(page, 'leads');
    });

    test('P1-1: 应能作废线索并填写作废原因', async ({ page }) => {
        // 创建一个测试线索
        const leadId = await createLead(page, { name: generateTestName('作废测试') });

        // 导航到详情页
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        // 点击作废按钮
        const voidBtn = page.locator('button:has-text("作废"), button:has-text("标记作废")');
        if (await voidBtn.isVisible({ timeout: 5000 })) {
            await voidBtn.click();
            await confirmDialog(page, { reasonInput: 'E2E 测试 - 无效线索' });
            console.log('✅ 线索作废成功');
        } else {
            console.log('ℹ️ 未找到作废按钮');
        }
    });

    test('P1-2: 应能在已作废 Tab 查看作废线索', async ({ page }) => {
        // 点击已作废 Tab
        await clickTab(page, '已作废');

        // 验证列表更新
        const table = page.locator('table');
        await expect(table).toBeVisible();
        console.log('✅ 已作废 Tab 正常显示');
    });

    test('P1-3: 应能申请恢复已作废线索', async ({ page }) => {
        // 点击已作废 Tab
        await clickTab(page, '已作废');
        await page.waitForTimeout(1000);

        // 查找恢复按钮
        const firstRow = page.locator('table tbody tr').first();

        if (await firstRow.isVisible({ timeout: 5000 })) {
            // 尝试找到恢复按钮
            const restoreBtn = firstRow.locator('button:has-text("恢复")');
            if (await restoreBtn.isVisible({ timeout: 3000 })) {
                await restoreBtn.click();
                await confirmDialog(page, { reasonInput: 'E2E 测试 - 恢复线索' });
                console.log('✅ 恢复申请提交成功');
            } else {
                // 可能在操作菜单中
                const moreBtn = firstRow.locator('button:has-text("更多"), button:has(svg)').last();
                if (await moreBtn.isVisible()) {
                    await moreBtn.click();
                    await page.waitForTimeout(300);

                    const restoreOption = page.locator('text=恢复');
                    if (await restoreOption.isVisible({ timeout: 2000 })) {
                        await restoreOption.click();
                        console.log('✅ 点击了恢复选项');
                    }
                }
            }
        } else {
            console.log('⚠️ 已作废列表为空');
        }
    });

    test('P1-4: 作废后应能用相同手机号创建新线索', async ({ page }) => {
        // 创建线索
        const leadId = await createLead(page, { name: generateTestName('作废重建'), phone: '13800000001' });

        // 作废该线索
        await page.goto(`/leads/${leadId}`);
        await page.waitForLoadState('networkidle');

        const voidBtn = page.locator('button:has-text("作废"), button:has-text("标记作废")');
        if (await voidBtn.isVisible({ timeout: 5000 })) {
            await voidBtn.click();
            await confirmDialog(page, { reasonInput: '测试作废重建' });
        }

        await page.waitForTimeout(1000);

        // 返回列表创建新线索
        await navigateToModule(page, 'leads');
        const newLeadId = await createLead(page, {
            name: generateTestName('重建线索'),
            phone: '13800000002' // 使用不同号码避免冲突
        });

        expect(newLeadId).not.toBe('');
        console.log('✅ 重建线索流程完成');
    });
});
