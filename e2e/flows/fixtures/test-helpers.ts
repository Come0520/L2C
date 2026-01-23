/**
 * E2E 测试辅助函数
 * 提供健壮的、可复用的测试操作
 */
import { Page, expect } from '@playwright/test';

/**
 * 创建线索并返回 ID
 * 使用健壮的选择器，适配新版 UI
 */
export async function createLead(
    page: Page,
    options: {
        name?: string;
        phone?: string;
        intention?: '高' | '中' | '低';
    } = {}
): Promise<string> {
    const timestamp = Date.now();
    const {
        name = `测试客户_${timestamp}`,
        phone = `138${timestamp.toString().slice(-8)}`,
        intention = '高'
    } = options;

    // 点击「新建线索」按钮
    await page.click('button:has-text("新建线索")');

    // 等待对话框出现
    await page.waitForSelector('[role="dialog"], dialog', { timeout: 10000 });

    // 填写客户姓名
    await page.fill('input[placeholder*="姓名"]', name);

    // 填写手机号
    await page.fill('input[placeholder*="手机号"]', phone);

    // 选择意向等级 (select 组件)
    const intentionSelect = page.locator('text=意向等级').locator('..').locator('select');
    if (await intentionSelect.isVisible({ timeout: 2000 })) {
        await intentionSelect.selectOption({ label: intention });
    }

    // 点击提交按钮 (尝试匹配多种常见文本)
    const submitBtn = page.locator('button:has-text("创建线索"), button:has-text("确定"), button:has-text("提交")').last();
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
    } else {
        // 尝试查找对话框底部的确认按钮
        const dialogSubmit = page.locator('[role="dialog"] button[type="submit"], dialog button[type="submit"]');
        if (await dialogSubmit.isVisible()) {
            await dialogSubmit.click();
        } else {
            // 最后尝试通过 class 查找
            await page.click('.confirm-btn, .submit-btn');
        }
    }

    // 检查是否有错误提示
    const errorToast = page.locator('.toast-error, [data-type="error"]');
    if (await errorToast.isVisible({ timeout: 2000 })) {
        const errorText = await errorToast.textContent();
        throw new Error(`创建线索失败: ${errorText}`);
    }

    // 等待对话框关闭
    const dialog = page.locator('[role="dialog"], dialog');
    try {
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
    } catch (e) {
        // 如果对话框还显示，可能是因为有表单验证错误
        console.error('⚠️ 创建线索对话框未关闭，检查是否有验证错误...');
        const fieldErrors = page.locator('.text-red-500, .error-message');
        if (await fieldErrors.count() > 0) {
            const errorTexts = await fieldErrors.allTextContents();
            throw new Error(`表单验证失败: ${errorTexts.join(', ')}`);
        }
        throw e;
    }

    // 等待列表刷新
    await page.waitForLoadState('networkidle');

    // 从表格获取第一个线索的ID
    const firstRow = page.locator('table tbody tr').first();
    const leadLink = await firstRow.locator('a').first().getAttribute('href');
    const leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';

    return leadId;
}

/**
 * 填写线索表单（在对话框或页面中）
 * 提供了跳过不存在字段的容错能力
 */
export async function fillLeadForm(
    page: Page,
    data: {
        name?: string;
        phone?: string;
        wechat?: string;
        community?: string;
        intention?: '高' | '中' | '低';
        notes?: string;
    }
): Promise<void> {
    if (data.name) {
        const nameInput = page.locator('input[placeholder*="姓名"]');
        if (await nameInput.isVisible({ timeout: 2000 })) {
            await nameInput.fill(data.name);
        }
    }

    if (data.phone) {
        const phoneInput = page.locator('input[placeholder*="手机号"]');
        if (await phoneInput.isVisible({ timeout: 2000 })) {
            await phoneInput.fill(data.phone);
        }
    }

    if (data.wechat) {
        const wechatInput = page.locator('input[placeholder*="微信"]');
        if (await wechatInput.isVisible({ timeout: 1000 })) {
            await wechatInput.fill(data.wechat);
        }
    }

    if (data.community) {
        const communityInput = page.locator('input[placeholder*="小区"], input[placeholder*="楼盘"]');
        if (await communityInput.isVisible({ timeout: 1000 })) {
            await communityInput.fill(data.community);
        }
    }

    if (data.intention) {
        const intentionSelect = page.locator('select').filter({ hasText: /选择等级|高|中|低/ }).first();
        if (await intentionSelect.isVisible({ timeout: 1000 })) {
            await intentionSelect.selectOption({ label: data.intention });
        }
    }

    if (data.notes) {
        const notesInput = page.locator('textarea[placeholder*="备注"]');
        if (await notesInput.isVisible({ timeout: 1000 })) {
            await notesInput.fill(data.notes);
        }
    }
}

/**
 * 点击表格中的操作按钮
 */
export async function clickTableRowAction(
    page: Page,
    rowSelector: string,
    actionText: string
): Promise<void> {
    const row = page.locator(rowSelector);
    const actionBtn = row.locator(`text=${actionText}, button:has-text("${actionText}")`).first();

    if (await actionBtn.isVisible({ timeout: 3000 })) {
        await actionBtn.click();
    } else {
        // 尝试点击行内的更多操作按钮
        const moreBtn = row.locator('button:has-text("更多"), button:has(svg)').last();
        if (await moreBtn.isVisible({ timeout: 1000 })) {
            await moreBtn.click();
            await page.waitForTimeout(300);
            await page.click(`text=${actionText}`);
        }
    }
}

/**
 * 确认对话框操作
 */
export async function confirmDialog(
    page: Page,
    options: {
        reasonInput?: string;
        confirmText?: string;
    } = {}
): Promise<void> {
    const { reasonInput, confirmText = '确认' } = options;

    // 如果有原因输入框，填写原因
    if (reasonInput) {
        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible({ timeout: 2000 })) {
            await textarea.fill(reasonInput);
        }
    }

    // 点击确认按钮
    const confirmBtn = page.locator(`button:has-text("${confirmText}"), button:has-text("确定")`).first();
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
    }
}

/**
 * 等待 Toast 消息
 */
export async function waitForToast(
    page: Page,
    textPattern: string | RegExp,
    type: 'success' | 'error' | 'any' = 'success'
): Promise<boolean> {
    const toastSelector = type === 'any'
        ? '[data-sonner-toast], .toast-success, .toast-error'
        : `.toast-${type}, [data-sonner-toast][data-type="${type}"]`;

    try {
        const toast = page.locator(toastSelector);
        await expect(toast).toContainText(textPattern, { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * 导航到模块并等待加载完成
 */
export async function navigateToModule(
    page: Page,
    module: 'leads' | 'quotes' | 'orders' | 'finance' | 'service/measurement' | 'service/installation' | 'supply-chain' | 'after-sales' | 'analytics' | 'settings'
): Promise<void> {
    await page.goto(`/${module}`);
    await page.waitForLoadState('networkidle');
    // 等待主要内容加载
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });
}

/**
 * 点击 Tab 标签
 */
export async function clickTab(page: Page, tabText: string): Promise<void> {
    const tab = page.locator(`[role="tab"]:has-text("${tabText}")`);
    if (await tab.isVisible({ timeout: 3000 })) {
        await tab.click();
        await page.waitForLoadState('networkidle');
    }
}

/**
 * 生成随机手机号
 */
export function generatePhone(): string {
    const prefixes = ['138', '139', '158', '159', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + suffix;
}

/**
 * 生成带时间戳的测试数据名
 */
export function generateTestName(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
}

// ============ 报价模块辅助函数 ============

/**
 * 创建快速报价（从线索详情页）
 * 需要先导航到线索详情页
 */
export async function createQuickQuote(
    page: Page,
    options: {
        plan?: 'ECONOMIC' | 'STANDARD' | 'PREMIUM';
        roomName?: string;
        width?: string;
        height?: string;
    } = {}
): Promise<string> {
    const {
        plan = 'ECONOMIC',
        roomName = '客厅',
        width = '350',
        height = '270'
    } = options;

    // 点击快速报价
    const quoteBtn = page.locator('a:has-text("快速报价"), button:has-text("快速报价")');
    await quoteBtn.click();
    await page.waitForLoadState('networkidle');

    // 选择方案
    const planCard = page.getByTestId(`plan-${plan}`);
    if (await planCard.isVisible({ timeout: 5000 })) {
        await planCard.click();
    }

    // 填写房间信息
    const roomNameInput = page.locator('input[name="rooms.0.name"]');
    if (await roomNameInput.isVisible({ timeout: 3000 })) {
        await roomNameInput.fill(roomName);
        await page.locator('input[name="rooms.0.width"]').fill(width);
        await page.locator('input[name="rooms.0.height"]').fill(height);
    }

    // 提交
    const submitBtn = page.getByTestId('submit-quote-btn');
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
    } else {
        await page.click('button:has-text("生成报价"), button:has-text("提交")');
    }

    // 等待跳转到报价详情
    await page.waitForURL(/\/quotes\/.*/, { timeout: 15000 });

    // 提取报价 ID
    const url = page.url();
    const quoteId = url.split('/quotes/')[1]?.split('?')[0] || '';

    return quoteId;
}

/**
 * 在表格中查找指定文本的行
 */
export async function findTableRow(
    page: Page,
    text: string | RegExp
): Promise<import('@playwright/test').Locator> {
    const row = page.locator('table tbody tr').filter({ hasText: text });
    return row;
}

/**
 * 等待页面关键元素加载
 */
export async function waitForPageLoad(
    page: Page,
    indicators: string[]
): Promise<boolean> {
    for (const indicator of indicators) {
        try {
            await expect(page.locator(indicator)).toBeVisible({ timeout: 5000 });
            return true;
        } catch {
            // 继续尝试下一个
        }
    }
    return false;
}

/**
 * 提交报价审核
 */
export async function submitQuoteForApproval(page: Page): Promise<void> {
    const submitBtn = page.getByRole('button', { name: /提交审核/ });
    if (await submitBtn.isVisible({ timeout: 3000 })) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
    }
}

/**
 * 批准报价
 */
export async function approveQuote(page: Page): Promise<void> {
    const approveBtn = page.getByRole('button', { name: /批准|通过/ });
    if (await approveBtn.isVisible({ timeout: 3000 })) {
        page.once('dialog', dialog => dialog.accept());
        await approveBtn.click();
        await page.waitForTimeout(1000);
    }
}

/**
 * 报价转订单
 */
export async function convertQuoteToOrder(page: Page): Promise<string> {
    const convertBtn = page.getByRole('button', { name: /转订单/ });
    if (await convertBtn.isVisible({ timeout: 3000 })) {
        page.once('dialog', dialog => dialog.accept());
        await convertBtn.click();

        // 等待跳转到订单页面
        try {
            await page.waitForURL(/\/orders\/.*/, { timeout: 15000 });
            const url = page.url();
            return url.split('/orders/')[1]?.split('?')[0] || '';
        } catch {
            return '';
        }
    }
    return '';
}

// ============ 订单模块辅助函数 ============

/**
 * 确认订单
 */
export async function confirmOrder(page: Page): Promise<void> {
    const confirmBtn = page.getByRole('button', { name: /确认订单/ });
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
        await confirmDialog(page);
    }
}

/**
 * 取消订单
 */
export async function cancelOrder(page: Page, reason?: string): Promise<void> {
    const cancelBtn = page.getByRole('button', { name: /取消订单/ });
    if (await cancelBtn.isVisible({ timeout: 3000 })) {
        await cancelBtn.click();
        await confirmDialog(page, { reasonInput: reason || '测试取消' });
    }
}

/**
 * 保存失败截图
 */
export async function saveFailureArtifacts(
    page: Page,
    testTitle: string
): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const dir = 'test-results';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const baseName = testTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').toLowerCase();

    // 保存截图
    await page.screenshot({
        path: path.join(dir, `${baseName}.png`),
        fullPage: true
    });

    // 保存 HTML
    const html = await page.content();
    fs.writeFileSync(path.join(dir, `${baseName}.html`), html);
}
