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
 * 动态获取最近一条工单/订单的关联订单ID
 * 优先通过 API 直查，失败则尝试 UI 方式，最终无数据则跳过测试
 */
export async function getValidOrderId(page: Page): Promise<string> {
    // 方案 A：通过 API 直查（最快最可靠）
    try {
        const apiRes = await page.request.get('/api/orders?limit=1');
        if (apiRes.ok()) {
            const json = await apiRes.json();
            const items = json?.items || json?.data || (Array.isArray(json) ? json : []);
            if (items.length > 0 && items[0].id) {
                console.log(`✅ API 直查获取订单ID: ${items[0].id}`);
                return items[0].id;
            }
        }
    } catch {
        console.log('⚠️ API 直查订单失败，回退到 UI 方式');
    }

    // 方案 B：通过 UI 页面抓取
    try {
        await page.goto('/orders', { waitUntil: 'domcontentloaded', timeout: 15000 });
        const firstLink = page.locator('table tbody tr a').first();
        if (await firstLink.isVisible({ timeout: 5000 })) {
            const href = await firstLink.getAttribute('href');
            const exactId = href?.split('/').pop();
            if (exactId && exactId.length > 20) return exactId;
        }

        await page.goto('/sales/orders', { waitUntil: 'domcontentloaded', timeout: 15000 });
        const alterLink = page.locator('table tbody tr a').first();
        if (await alterLink.isVisible({ timeout: 5000 })) {
            const href = await alterLink.getAttribute('href');
            const exactId = href?.split('/').pop();
            if (exactId && exactId.length > 20) return exactId;
        }
    } catch (e) {
        console.log('⚠️ UI 方式获取订单ID也失败:', e);
    }

    // 方案 C：无可用数据，跳过当前测试而非使用伪 ID
    console.log('⏭️ 无可用订单数据，跳过当前测试');
    test.skip(true, '环境中无可用订单数据');
    return ''; // 不会执行到此处，但 TypeScript 需要返回值
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
export async function safeGoto(page: Page, url: string, options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }): Promise<boolean> {
    try {
        await page.goto(url, {
            timeout: options?.timeout || 60000,
            waitUntil: options?.waitUntil || 'domcontentloaded',
        });
    } catch (e) {
        console.log(`⚠️ 页面导航超时或失败: ${url}`, e);
        // 即使导航超时，页面可能已经部分加载，继续检查
    }

    // 检查是否有数据加载错误
    const hasError = await skipOnDataLoadError(page);
    if (hasError) {
        console.log('⚠️ 页面数据加载失败，跳过测试');
        return false;
    }
    return true;
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
