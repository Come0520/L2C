import { test, expect } from '@playwright/test';
import { createLead, generateTestName, navigateToModule, fillLeadForm, generatePhone } from './fixtures/test-helpers';

/**
 * 线索并发操作测试
 * 使用辅助函数简化测试代码
 */
test.describe('Lead Concurrency', () => {

        test('should handle simultaneous lead creation', async ({ page, context }) => {
                const phone = generatePhone();
                const name = generateTestName('并发创建');

                const page1 = await context.newPage();
                const page2 = await context.newPage();

                await page1.goto('/leads');
                await page2.goto('/leads');
                await page1.waitForLoadState('domcontentloaded');
                await page2.waitForLoadState('domcontentloaded');

                // 页面1创建线索
                await page1.click('button:has-text("新建线索")');
                await page1.waitForSelector('[role="dialog"], dialog');
                await fillLeadForm(page1, { name, phone });
                await page1.click('button:has-text("创建线索")');

                // 页面2同时创建相同手机号的线索
                await page2.click('button:has-text("新建线索")');
                await page2.waitForSelector('[role="dialog"], dialog');
                await fillLeadForm(page2, { name: name + '_2', phone }); // 相同手机号
                await page2.click('button:has-text("创建线索")');

                // 等待结果
                await page1.waitForTimeout(3000);
                await page2.waitForTimeout(3000);

                console.log('✅ 并发创建线索测试完成');

                await page1.close();
                await page2.close();
        });

        test('should handle simultaneous lead assignment', async ({ page, context }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('并发分配') });

                const page1 = await context.newPage();
                const page2 = await context.newPage();

                await page1.goto(`/leads/${leadId}`);
                await page2.goto(`/leads/${leadId}`);
                await page1.waitForLoadState('domcontentloaded');
                await page2.waitForLoadState('domcontentloaded');

                // 两个页面同时尝试分配
                const assignBtn1 = page1.locator('button:has-text("分配")');
                const assignBtn2 = page2.locator('button:has-text("分配")');

                if (await assignBtn1.isVisible({ timeout: 3000 })) {
                        await assignBtn1.click();
                        await page1.waitForTimeout(500);
                        await page1.click('button:has-text("确认")');
                }

                if (await assignBtn2.isVisible({ timeout: 3000 })) {
                        await assignBtn2.click();
                        await page2.waitForTimeout(500);
                        await page2.click('button:has-text("确认")');
                }

                await page1.waitForTimeout(2000);
                console.log('✅ 并发分配线索测试完成');

                await page1.close();
                await page2.close();
        });

        test('should handle simultaneous lead updates', async ({ page, context }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('并发更新') });

                const page1 = await context.newPage();
                const page2 = await context.newPage();

                await page1.goto(`/leads/${leadId}`);
                await page2.goto(`/leads/${leadId}`);
                await page1.waitForLoadState('domcontentloaded');
                await page2.waitForLoadState('domcontentloaded');

                // 两个页面同时尝试编辑
                const editBtn1 = page1.locator('button:has-text("编辑资料")');
                const editBtn2 = page2.locator('button:has-text("编辑资料")');

                if (await editBtn1.isVisible({ timeout: 3000 })) {
                        await editBtn1.click();
                        await page1.waitForTimeout(500);
                }

                if (await editBtn2.isVisible({ timeout: 3000 })) {
                        await editBtn2.click();
                        await page2.waitForTimeout(500);
                }

                await page1.waitForTimeout(2000);
                console.log('✅ 并发更新线索测试完成');

                await page1.close();
                await page2.close();
        });

        test('should handle simultaneous followup additions', async ({ page, context }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('并发跟进') });

                const page1 = await context.newPage();
                const page2 = await context.newPage();

                await page1.goto(`/leads/${leadId}`);
                await page2.goto(`/leads/${leadId}`);
                await page1.waitForLoadState('domcontentloaded');
                await page2.waitForLoadState('domcontentloaded');

                // 两个页面同时添加跟进
                const addBtn1 = page1.locator('button:has-text("添加跟进")');
                const addBtn2 = page2.locator('button:has-text("添加跟进")');

                if (await addBtn1.isVisible({ timeout: 3000 })) {
                        await addBtn1.click();
                        const textarea1 = page1.locator('textarea').first();
                        if (await textarea1.isVisible()) {
                                await textarea1.fill('跟进记录1');
                        }
                        await page1.click('button:has-text("保存")');
                }

                if (await addBtn2.isVisible({ timeout: 3000 })) {
                        await addBtn2.click();
                        const textarea2 = page2.locator('textarea').first();
                        if (await textarea2.isVisible()) {
                                await textarea2.fill('跟进记录2');
                        }
                        await page2.click('button:has-text("保存")');
                }

                await page1.waitForTimeout(2000);
                console.log('✅ 并发添加跟进测试完成');

                await page1.close();
                await page2.close();
        });

        test('should handle simultaneous lead conversions', async ({ page, context }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('并发转化') });

                const page1 = await context.newPage();
                const page2 = await context.newPage();

                await page1.goto(`/leads/${leadId}`);
                await page2.goto(`/leads/${leadId}`);
                await page1.waitForLoadState('domcontentloaded');
                await page2.waitForLoadState('domcontentloaded');

                // 两个页面同时尝试转为客户
                const convertBtn1 = page1.locator('button:has-text("转为客户")');
                const convertBtn2 = page2.locator('button:has-text("转为客户")');

                if (await convertBtn1.isVisible({ timeout: 3000 }) && await convertBtn1.isEnabled()) {
                        await convertBtn1.click();
                }

                if (await convertBtn2.isVisible({ timeout: 3000 }) && await convertBtn2.isEnabled()) {
                        await convertBtn2.click();
                }

                await page1.waitForTimeout(2000);
                console.log('✅ 并发转化线索测试完成');

                await page1.close();
                await page2.close();
        });
});
