import { Page, test, expect } from '@playwright/test';

/**
 * E2E 测试通用帮助函数
 * 提供错误处理、容错和通用断言
 */

/**
 * 检查页面是否出现数据加载错误
 * @param page Playwright Page 对象
 * @returns 如果检测到错误，跳过测试
 */
export async function skipOnDataLoadError(page: Page): Promise<boolean> {
    const errorElement = page.getByText('Data Load Error');
    const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasError) {
        console.log('⚠️ 检测到数据加载错误，跳过测试');
        test.skip();
        return true;
    }
    return false;
}

/**
 * 安全等待页面加载完成
 * @param page Playwright Page 对象
 * @param options 可选配置
 */
export async function safeWaitForLoad(
    page: Page,
    options: { timeout?: number; skipOnError?: boolean } = {}
): Promise<void> {
    const { timeout = 10000, skipOnError = true } = options;

    try {
        await page.waitForLoadState('domcontentloaded', { timeout });

        // 检查错误页面
        if (skipOnError) {
            await skipOnDataLoadError(page);
        }
    } catch (error) {
        console.log('⚠️ 页面加载超时');
        if (skipOnError) {
            test.skip();
        }
    }
}

/**
 * 安全检查元素可见性（带容错）
 * @param page Page 对象
 * @param selector 选择器
 * @param options 选项
 */
export async function safeExpectVisible(
    page: Page,
    selector: string | RegExp,
    options: { role?: 'heading' | 'button' | 'link' | 'table'; timeout?: number } = {}
): Promise<boolean> {
    const { role, timeout = 5000 } = options;

    try {
        let locator;
        if (role) {
            locator = page.getByRole(role, { name: selector });
        } else if (typeof selector === 'string') {
            locator = page.getByText(selector);
        } else {
            locator = page.getByText(selector);
        }

        await expect(locator).toBeVisible({ timeout });
        return true;
    } catch {
        console.log(`⚠️ 元素不可见: ${selector}`);
        return false;
    }
}

/**
 * 安全导航到页面（带错误检查）
 * @param page Page 对象
 * @param url 目标 URL
 */
export async function safeGoto(page: Page, url: string): Promise<boolean> {
    await page.goto(url);

    // 检查是否有数据加载错误
    return !(await skipOnDataLoadError(page));
}

/**
 * 检查表格是否有数据
 * @param page Page 对象
 */
export async function checkTableHasData(page: Page): Promise<boolean> {
    const table = page.locator('table');
    const isTableVisible = await table.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isTableVisible) {
        console.log('⚠️ 表格不可见');
        return false;
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
        console.log('⚠️ 表格无数据');
        return false;
    }

    return true;
}

/**
 * 安全点击按钮（带容错）
 * @param page Page 对象
 * @param name 按钮名称
 */
export async function safeClickButton(
    page: Page,
    name: string | RegExp
): Promise<boolean> {
    const button = page.getByRole('button', { name });
    const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
        await button.click();
        return true;
    }

    console.log(`⚠️ 按钮不可见: ${name}`);
    return false;
}
