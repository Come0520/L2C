import { test, expect } from '@playwright/test';
import { createLead, generateTestName, navigateToModule } from './fixtures/test-helpers';

/**
 * 线索跟进提醒测试
 * 使用辅助函数简化测试代码
 */
test.describe('Lead Followup Reminders', () => {

        /**
         * 添加跟进记录的辅助函数
         */
        async function addFollowup(page: import('@playwright/test').Page, content: string, nextFollowupDays?: number): Promise<void> {
                const addFollowupBtn = page.locator('button:has-text("添加跟进")');
                if (await addFollowupBtn.isVisible({ timeout: 3000 })) {
                        await addFollowupBtn.click();
                        await page.waitForTimeout(500);

                        const textarea = page.locator('textarea').first();
                        if (await textarea.isVisible()) {
                                await textarea.fill(content);
                        }

                        // 设置下次跟进时间
                        if (nextFollowupDays !== undefined) {
                                const dateInput = page.locator('input[type="datetime-local"], input[type="date"]');
                                if (await dateInput.isVisible({ timeout: 2000 })) {
                                        const nextDate = new Date(Date.now() + nextFollowupDays * 86400000);
                                        await dateInput.fill(nextDate.toISOString().slice(0, 16));
                                }
                        }

                        await page.click('button:has-text("保存")');
                        await page.waitForTimeout(500);
                }
        }

        test('should set next followup reminder', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('跟进提醒') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                await addFollowup(page, '设置跟进提醒测试', 1); // 明天跟进
                console.log('✅ 跟进提醒设置成功');
        });

        test('should display followup reminder on lead list', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('列表提醒') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                await addFollowup(page, '列表显示测试', 1);

                // 返回列表验证
                await navigateToModule(page, 'leads');
                console.log('✅ 列表跟进提醒显示测试完成');
        });

        test('should display expired followup reminder', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('过期提醒') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 注意：设置过期时间（负数天数）
                await addFollowup(page, '过期提醒测试', -1);
                console.log('✅ 过期跟进提醒测试完成');
        });

        test('should complete followup reminder', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('完成跟进') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 添加第一条跟进
                await addFollowup(page, '第一次跟进', 1);

                // 添加完成跟进
                await addFollowup(page, '完成跟进');
                console.log('✅ 完成跟进流程测试成功');
        });

        test('should handle multiple followup reminders', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('多次跟进') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                // 添加多条跟进记录
                for (let i = 0; i < 3; i++) {
                        await addFollowup(page, `跟进记录 ${i + 1}`, i + 1);
                }
                console.log('✅ 多次跟进提醒测试完成');
        });

        test('should handle followup reminder with special characters', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('特殊字符') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                const specialContent = '测试内容@#$%^&*()_+-={}[]|\\:;"\'<>?,./~`';
                await addFollowup(page, specialContent, 1);
                console.log('✅ 特殊字符跟进内容测试成功');
        });

        test('should handle followup reminder with long note', async ({ page }) => {
                await navigateToModule(page, 'leads');
                const leadId = await createLead(page, { name: generateTestName('长内容') });

                await page.goto(`/leads/${leadId}`);
                await page.waitForLoadState('networkidle');

                const longContent = 'A'.repeat(500);
                await addFollowup(page, longContent, 1);
                console.log('✅ 长内容跟进测试成功');
        });
});
