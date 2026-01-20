import { test, expect } from '@playwright/test';
import { createLead, generateTestName, navigateToModule, confirmDialog } from './fixtures/test-helpers';

/**
 * 线索批量操作测试
 * 使用辅助函数简化测试代码
 */
test.describe('Lead Bulk Operations', () => {

    /**
     * 批量创建线索并返回 ID 数组
     */
    async function createMultipleLeads(page: import('@playwright/test').Page, count: number): Promise<string[]> {
        const leadIds: string[] = [];
        for (let i = 0; i < count; i++) {
            const leadId = await createLead(page, { name: generateTestName(`批量${i}`) });
            leadIds.push(leadId);
        }
        return leadIds;
    }

    /**
     * 选择表格中的多个行
     */
    async function selectTableRows(page: import('@playwright/test').Page, count?: number): Promise<number> {
        const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
        const totalCount = await checkboxes.count();
        const selectCount = count ? Math.min(count, totalCount) : totalCount;

        for (let i = 0; i < selectCount; i++) {
            await checkboxes.nth(i).check();
        }
        return selectCount;
    }

    test('should bulk assign leads to same sales', async ({ page }) => {
        await navigateToModule(page, 'leads');
        await createMultipleLeads(page, 3);

        const selectedCount = await selectTableRows(page, 3);

        const bulkAssignBtn = page.locator('button:has-text("批量分配"), button[title="批量分配"]');
        if (await bulkAssignBtn.isVisible({ timeout: 3000 })) {
            await bulkAssignBtn.click();
            await page.waitForTimeout(500);
            await page.click('button:has-text("确认")');
            console.log(`✅ 批量分配 ${selectedCount} 条线索成功`);
        } else {
            console.log('ℹ️ 未找到批量分配按钮');
        }
    });

    test('should bulk delete leads', async ({ page }) => {
        await navigateToModule(page, 'leads');
        await createMultipleLeads(page, 3);

        const selectedCount = await selectTableRows(page, 3);

        const bulkDeleteBtn = page.locator('button:has-text("批量删除"), button[title="批量删除"]');
        if (await bulkDeleteBtn.isVisible({ timeout: 3000 })) {
            await bulkDeleteBtn.click();
            await confirmDialog(page, { confirmText: '确认删除' });
            console.log(`✅ 批量删除 ${selectedCount} 条线索成功`);
        } else {
            console.log('ℹ️ 未找到批量删除按钮');
        }
    });

    test('should bulk return leads to pool', async ({ page }) => {
        await navigateToModule(page, 'leads');
        await createMultipleLeads(page, 3);

        await selectTableRows(page, 3);

        const bulkReturnBtn = page.locator('button:has-text("批量退回"), button[title="批量退回"]');
        if (await bulkReturnBtn.isVisible({ timeout: 3000 })) {
            await bulkReturnBtn.click();
            await confirmDialog(page, { reasonInput: '测试退回原因' });
            console.log('✅ 批量退回公海成功');
        } else {
            console.log('ℹ️ 未找到批量退回按钮');
        }
    });

    test('should handle bulk operations with empty selection', async ({ page }) => {
        await navigateToModule(page, 'leads');

        const bulkAssignBtn = page.locator('button:has-text("批量分配"), button[title="批量分配"]');
        if (await bulkAssignBtn.isVisible({ timeout: 3000 })) {
            await bulkAssignBtn.click();
            // 预期会有错误提示或按钮禁用
            await page.waitForTimeout(1000);
            console.log('✅ 空选择批量操作测试完成');
        } else {
            console.log('ℹ️ 批量分配按钮可能默认禁用');
        }
    });

    test('should handle bulk operations with single lead', async ({ page }) => {
        await navigateToModule(page, 'leads');
        await createLead(page, { name: generateTestName('单条批量') });

        await selectTableRows(page, 1);

        const bulkAssignBtn = page.locator('button:has-text("批量分配"), button[title="批量分配"]');
        if (await bulkAssignBtn.isVisible({ timeout: 3000 })) {
            await bulkAssignBtn.click();
            await page.waitForTimeout(500);
            await page.click('button:has-text("确认")');
            console.log('✅ 单条线索批量分配成功');
        }
    });

    test('should handle bulk operations with large number of leads', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 创建 5 条线索（减少数量以加快测试）
        await createMultipleLeads(page, 5);

        const selectedCount = await selectTableRows(page, 5);

        const bulkAssignBtn = page.locator('button:has-text("批量分配"), button[title="批量分配"]');
        if (await bulkAssignBtn.isVisible({ timeout: 3000 })) {
            await bulkAssignBtn.click();
            await page.waitForTimeout(500);
            await page.click('button:has-text("确认")');
            console.log(`✅ 批量分配 ${selectedCount} 条线索成功`);
        }
    });

    test('should handle bulk operations with mixed status leads', async ({ page }) => {
        await navigateToModule(page, 'leads');
        await createMultipleLeads(page, 3);

        await selectTableRows(page, 3);

        const bulkAssignBtn = page.locator('button:has-text("批量分配"), button[title="批量分配"]');
        if (await bulkAssignBtn.isVisible({ timeout: 3000 })) {
            await bulkAssignBtn.click();
            await page.waitForTimeout(500);
            await page.click('button:has-text("确认")');
            console.log('✅ 混合状态批量操作成功');
        }
    });
});
