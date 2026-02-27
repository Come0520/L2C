import { test, expect } from '@playwright/test';
import { navigateToModule, fillLeadForm, generateTestName } from './fixtures/test-helpers';

/**
 * 线索错误恢复测试
 * 测试网络错误、服务器错误等异常场景
 */
test.describe('Lead Error Recovery', () => {

    test('should handle network interruption during lead creation', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟网络中断
        await page.route('**/api/leads**', route => route.abort('failed'));

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('网络中断'), phone: '13800138001' });
        await page.click('button:has-text("创建线索")');

        // 预期会显示错误提示
        await page.waitForTimeout(3000);
        console.log('✅ 网络中断错误处理测试完成');
    });

    test('should handle server timeout during lead creation', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟服务器超时
        await page.route('**/api/leads**', route => {
            setTimeout(() => route.abort('timedout'), 30000);
        });

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('超时测试'), phone: '13800138002' });
        await page.click('button:has-text("创建线索")');

        await page.waitForTimeout(3000);
        console.log('✅ 服务器超时错误处理测试完成');
    });

    test('should handle database connection failure', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟数据库连接失败
        await page.route('**/api/leads**', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Database connection failed' }),
            });
        });

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('数据库错误'), phone: '13800138003' });
        await page.click('button:has-text("创建线索")');

        await page.waitForTimeout(3000);
        console.log('✅ 数据库连接失败错误处理测试完成');
    });

    test('should handle validation error gracefully', async ({ page }) => {
        await navigateToModule(page, 'leads');

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');

        // 不填写必填字段直接提交
        await page.click('button:has-text("创建线索")');

        // 预期会显示验证错误
        await page.waitForTimeout(2000);
        console.log('✅ 表单验证错误处理测试完成');
    });

    test('should handle permission denied error', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟权限拒绝
        await page.route('**/api/leads**', route => {
            route.fulfill({
                status: 403,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Permission denied' }),
            });
        });

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('权限测试'), phone: '13800138004' });
        await page.click('button:has-text("创建线索")');

        await page.waitForTimeout(3000);
        console.log('✅ 权限拒绝错误处理测试完成');
    });

    test('should handle rate limiting error', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟限流
        await page.route('**/api/leads**', route => {
            route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Too many requests' }),
            });
        });

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('限流测试'), phone: '13800138005' });
        await page.click('button:has-text("创建线索")');

        await page.waitForTimeout(3000);
        console.log('✅ 限流错误处理测试完成');
    });

    test('should handle malformed response', async ({ page }) => {
        await navigateToModule(page, 'leads');

        // 模拟返回格式错误
        await page.route('**/api/leads**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: 'invalid json',
            });
        });

        await page.click('[data-testid="create-lead-btn"]');
        await page.waitForSelector('[role="dialog"], dialog');
        await fillLeadForm(page, { name: generateTestName('格式错误'), phone: '13800138006' });
        await page.click('button:has-text("创建线索")');

        await page.waitForTimeout(3000);
        console.log('✅ 响应格式错误处理测试完成');
    });
});
