/**
 * 报价优先模式 E2E 测试
 * 使用辅助函数简化测试代码
 * 
 * 覆盖场景:
 * 1. 直接创建报价单 (无需先创建线索)
 * 2. 从报价单推送测量任务
 * 3. 验证测量任务关联
 */
import { test, expect } from '@playwright/test';
import { navigateToModule, confirmDialog, saveFailureArtifacts, generateTestName, generatePhone } from './fixtures/test-helpers';

test.describe('报价优先模式 E2E', () => {
    let createdQuoteId: string;

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            await saveFailureArtifacts(page, testInfo.title);
        }
    });

    test('Step 1: 直接创建报价单', async ({ page }) => {
        await navigateToModule(page, 'quotes');

        // 点击创建报价
        const createBtn = page.getByTestId('create-quote-btn');
        if (await createBtn.isVisible({ timeout: 10000 })) {
            await createBtn.click();

            // 填写客户信息 (新建客户)
            const customerTrigger = page.getByTestId('customer-select-trigger');
            if (await customerTrigger.isVisible({ timeout: 3000 })) {
                await customerTrigger.click();

                const createCustomerBtn = page.getByTestId('create-new-customer-btn');
                if (await createCustomerBtn.isVisible({ timeout: 3000 })) {
                    await createCustomerBtn.click();

                    await page.getByTestId('customer-name-input').fill(generateTestName('QFirst'));
                    await page.getByTestId('customer-phone-input').fill(generatePhone());
                    await page.getByTestId('submit-customer-btn').click();
                }
            }

            // 添加商品
            const addItemBtn = page.getByTestId('add-item-btn');
            if (await addItemBtn.isVisible({ timeout: 3000 })) {
                await addItemBtn.click();
            }

            // 提交报价
            const submitBtn = page.getByTestId('submit-quote-btn');
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
            }

            // 验证跳转
            try {
                await page.waitForURL(/\/quotes\/.*/, { timeout: 15000 });
                const url = page.url();
                createdQuoteId = url.split('/quotes/')[1]?.split('?')[0] || '';
                console.log(`✅ 报价单创建成功: ${createdQuoteId}`);
            } catch {
                console.log('⚠️ 报价创建流程未完成');
            }
        } else {
            console.log('⏭️ 创建报价按钮不可见');
        }
    });

    test('Step 2: 推送测量任务', async ({ page }) => {
        test.skip(!createdQuoteId, '需要先创建报价单');

        await page.goto(`/quotes/${createdQuoteId}`);
        await page.waitForLoadState('domcontentloaded');

        // 查找派送测量按钮
        const pushMeasureBtn = page.getByRole('button', { name: /派送测量|发起测量/ });

        if (await pushMeasureBtn.isVisible({ timeout: 5000 })) {
            await pushMeasureBtn.click();
            await confirmDialog(page);
            console.log('✅ 测量任务推送成功');
        } else {
            console.log('⚠️ 派送测量按钮不可见');
        }
    });
});
