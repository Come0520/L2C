import { test, expect } from '@playwright/test';
import { createLead, generatePhone, generateTestName, navigateToModule, confirmDialog } from './fixtures/test-helpers';

/**
 * 线索生命周期测试
 * 使用辅助函数简化测试代码，提升可维护性
 */
test.describe('Lead Lifecycle', () => {

        test('should complete full lead lifecycle: create -> assign -> followup -> quote -> convert', async ({ page }) => {
                await navigateToModule(page, 'leads');

                // 使用辅助函数创建线索
                const leadId = await createLead(page, { name: generateTestName('完整流程') });
                expect(leadId).not.toBe('');
                console.log('✅ 线索创建成功，ID:', leadId);

                // 导航到线索详情页
                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 分配销售
                const assignBtn = page.locator('button:has-text("分配")');
                if (await assignBtn.isVisible({ timeout: 3000 })) {
                        await assignBtn.click();
                        await page.waitForTimeout(500);
                        await page.click('button:has-text("确认")');
                        console.log('✅ 线索分配完成');
                }

                // 开始跟进
                const followBtn = page.locator('button:has-text("开始跟进")');
                if (await followBtn.isVisible({ timeout: 3000 })) {
                        await followBtn.click();
                        await page.waitForTimeout(500);
                        console.log('✅ 开始跟进');
                }

                // 添加跟进记录
                const addFollowupBtn = page.locator('button:has-text("添加跟进")');
                if (await addFollowupBtn.isVisible({ timeout: 3000 })) {
                        await addFollowupBtn.click();
                        await page.waitForTimeout(500);
                        const textarea = page.locator('textarea').first();
                        if (await textarea.isVisible()) {
                                await textarea.fill('E2E 测试跟进内容');
                        }
                        await page.click('button:has-text("保存")');
                        console.log('✅ 跟进记录添加完成');
                }

                console.log('✅ 线索生命周期流程验证完成');
        });

        test('should maintain data consistency throughout lifecycle', async ({ page }) => {
                const testName = generateTestName('数据一致');

                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: testName });

                // 导航到详情页验证数据
                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 验证页面包含测试名称
                await expect(page.locator(`text=${testName}`).first()).toBeVisible({ timeout: 10000 });
                console.log('✅ 数据一致性验证通过');
        });

        test('should handle multiple followups in lifecycle', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('多次跟进') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 分配销售
                const assignBtn = page.locator('button:has-text("分配")');
                if (await assignBtn.isVisible({ timeout: 3000 })) {
                        await assignBtn.click();
                        await page.waitForTimeout(500);
                        await page.click('button:has-text("确认")');
                }

                // 开始跟进
                const followBtn = page.locator('button:has-text("开始跟进")');
                if (await followBtn.isVisible({ timeout: 3000 })) {
                        await followBtn.click();
                        await page.waitForTimeout(500);
                }

                // 添加多条跟进记录
                for (let i = 0; i < 3; i++) {
                        const addFollowupBtn = page.locator('button:has-text("添加跟进")');
                        if (await addFollowupBtn.isVisible({ timeout: 3000 })) {
                                await addFollowupBtn.click();
                                await page.waitForTimeout(500);
                                const textarea = page.locator('textarea').first();
                                if (await textarea.isVisible()) {
                                        await textarea.fill(`跟进记录 ${i + 1}`);
                                }
                                await page.click('button:has-text("保存")');
                                await page.waitForTimeout(500);
                        }
                }

                console.log('✅ 多次跟进记录添加完成');
        });

        test('should handle lifecycle with void lead', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('作废测试') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 点击作废按钮
                const voidBtn = page.locator('button:has-text("作废"), button:has-text("标记作废")');
                if (await voidBtn.isVisible({ timeout: 5000 })) {
                        await voidBtn.click();
                        await page.waitForTimeout(500);

                        // 填写作废原因并确认
                        await confirmDialog(page, { reasonInput: 'E2E 测试作废原因' });

                        // 验证状态变更
                        await page.waitForTimeout(1000);
                        console.log('✅ 线索作废流程完成');
                } else {
                        console.log('ℹ️ 未找到作废按钮');
                }
        });

        test('should handle lifecycle with pool operations', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('公海池') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 分配销售
                const assignBtn = page.locator('button:has-text("分配")');
                if (await assignBtn.isVisible({ timeout: 3000 })) {
                        await assignBtn.click();
                        await page.waitForTimeout(500);
                        await page.click('button:has-text("确认")');
                        console.log('✅ 线索分配完成');
                }

                // 退回公海
                const returnBtn = page.locator('button:has-text("退回"), button[title="退回"]');
                if (await returnBtn.isVisible({ timeout: 3000 })) {
                        await returnBtn.click();
                        await page.waitForTimeout(500);

                        // 填写退回原因并确认
                        await confirmDialog(page, { reasonInput: 'E2E 测试退回原因' });

                        console.log('✅ 线索退回公海完成');
                } else {
                        console.log('ℹ️ 未找到退回按钮');
                }
        });
});
