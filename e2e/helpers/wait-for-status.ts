import { Page, expect } from '@playwright/test';

/**
 * 等待订单状态变更（带重试）
 * 
 * @param page - Playwright Page 对象
 * @param orderId - 订单 ID
 * @param expectedStatus - 期望的状态正则表达式
 * @param maxRetries - 最大重试次数，默认 5 次
 */
export async function waitForOrderStatus(
    page: Page,
    orderId: string,
    expectedStatus: RegExp,
    maxRetries = 5
): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
        await page.goto(`/orders/${orderId}`);
        await page.waitForLoadState('networkidle');

        // 查找状态文本（优先使用 data-testid，降级到文本搜索）
        const statusText = page.locator('[data-testid="order-status"]');
        if (await statusText.isVisible()) {
            const text = await statusText.textContent();
            if (text && expectedStatus.test(text)) {
                console.log(`✅ 订单状态已变更为: ${text}`);
                return;
            }
        }

        // 降级：搜索页面中的状态文本
        const pageContent = await page.content();
        if (expectedStatus.test(pageContent)) {
            console.log(`✅ 页面中检测到期望状态`);
            return;
        }

        console.log(`⏳ 等待状态变更... (${i + 1}/${maxRetries})`);
        // 等待后重试
        await page.waitForTimeout(2000);
    }

    throw new Error(`订单状态未变更为期望值: ${expectedStatus}`);
}

/**
 * 安全点击按钮（带滚动和 force 选项）
 * 
 * @param page - Playwright Page 对象
 * @param buttonName - 按钮名称正则表达式
 * @param timeout - 等待超时时间，默认 15000ms
 */
export async function safeClickButton(
    page: Page,
    buttonName: RegExp,
    timeout = 15000
): Promise<boolean> {
    const btn = page.getByRole('button', { name: buttonName });

    try {
        await btn.waitFor({ state: 'visible', timeout });
        await btn.scrollIntoViewIfNeeded();
        await btn.click({ force: true });
        return true;
    } catch (error) {
        console.log(`⚠️ 按钮 ${buttonName} 点击失败:`, error);
        return false;
    }
}

/**
 * 等待表格加载完成
 * 
 * @param page - Playwright Page 对象
 * @param timeout - 等待超时时间，默认 10000ms
 */
export async function waitForTableLoad(
    page: Page,
    timeout = 10000
): Promise<void> {
    await expect(page.locator('table tbody')).toBeVisible({ timeout });
    // 确保至少有一行数据
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 5000 });
}
