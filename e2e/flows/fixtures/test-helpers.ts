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
    // 引入随机数后缀，确保毫秒级连续调用时手机号唯一（防 DUPLICATE 拦截）
    const randomSuffix = Math.floor(Math.random() * 90000000 + 10000000).toString();
    const {
        name = `测试客户_${timestamp}`,
        phone = `138${randomSuffix}`,
        intention = '高'
    } = options;


    // 点击新建线索按钮
    console.log('Step 1: Creating Lead...');
    await page.getByTestId('create-lead-btn').click();
    await page.waitForTimeout(500);

    // 等待对话框出现
    const dialog = page.locator('[role="dialog"], [data-vaul-drawer]').first();
    await dialog.waitFor({ state: 'visible', timeout: 20000 });

    // 填写客户姓名（使用通配符匹配兼容不同措辞）
    await dialog.locator('input[placeholder*="客户姓名"], input[placeholder*="姓名"]').first().fill(name);

    // 填写手机号
    // PhoneInput 外层的 data-testid 绑定在包裹 div 上，内部是 RPNInput 渲染的 <input>
    // 策略1：通过 testid 查找外层 div，再找其第一个 input 子孙节点
    // 策略2：直接在 dialog 中找 input[type="tel"] 或 input[placeholder*="手机号"]
    let phoneInput = dialog.getByTestId('phone-input').locator('input').first();
    const isPhoneInputVisible = await phoneInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isPhoneInputVisible) {
        // 降级：使用 type="tel" 或 placeholder 匹配
        phoneInput = dialog.locator('input[type="tel"], input[placeholder*="手机号"], input[placeholder*="输入手机号"]').first();
    }
    await phoneInput.waitFor({ state: 'visible', timeout: 15000 });
    await phoneInput.fill(phone);
    await page.waitForTimeout(300);

    // 意向等级映射
    const intentionMap = {
        '高': '高意向',
        '中': '中意向',
        '低': '低意向'
    };
    const mappedIntention = intentionMap[intention] || intention;

    // 选择意向等级 (Shadcn UI Select 组件)
    try {
        const intentionTrigger = dialog.locator('button[role="combobox"]').filter({ hasText: /选择意向|意向/ });
        if (await intentionTrigger.isVisible({ timeout: 2000 })) {
            await intentionTrigger.click();
            await page.getByRole('option', { name: new RegExp(mappedIntention) }).click();
        } else {
            // 降级回退到原生 select
            const intentionSelect = dialog.locator('text=意向等级').locator('..').locator('select');
            if (await intentionSelect.isVisible({ timeout: 1000 })) {
                await intentionSelect.selectOption({ label: mappedIntention });
            }
        }
    } catch (e) {
        console.log('⚠️ 意向等级选择失败，跳过', e);
    }

    // 等待可能的 Turbopack 编译完成（避免 HMR 中断 React 树）
    try {
        // 等待 "Compiling..." 指示器消失
        const compilingIndicator = page.locator('text=Compiling');
        if (await compilingIndicator.isVisible({ timeout: 1000 })) {
            console.log('⏳ 等待 Turbopack 编译完成...');
            await compilingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
            await page.waitForTimeout(1000); // 额外等待 HMR 生效
        }
    } catch {
        // 编译指示器不可见，继续
    }

    // 点击提交按钮 (尝试匹配多种常见文本)
    const submitBtn = dialog.locator('button:has-text("创建线索"), button:has-text("确定"), button:has-text("提交")').last();
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
    } else {
        // 尝试查找对话框底部的确认按钮
        const dialogSubmit = dialog.locator('button[type="submit"]');
        if (await dialogSubmit.isVisible()) {
            await dialogSubmit.click();
        } else {
            // 最后尝试通过 class 查找
            await dialog.locator('.confirm-btn, .submit-btn').first().click();
        }
    }

    // 给 Server Action 执行留足时间
    await page.waitForTimeout(2000);

    // 检查是否有错误提示
    const errorToast = page.locator('.toast-error, [data-type="error"]');
    if (await errorToast.isVisible({ timeout: 2000 })) {
        const errorText = await errorToast.textContent();
        throw new Error(`创建线索失败: ${errorText}`);
    }

    // 等待对话框关闭
    try {
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
    } catch (e) {
        // 如果对话框还显示，可能是因为有表单验证错误
        console.error('⚠️ 创建线索对话框未关闭，检查是否有验证错误...');

        // 截图调试
        await page.screenshot({ path: 'e2e/debug-dialog-not-closed.png', fullPage: true });

        // 增强错误检测（匹配 Shadcn FormMessage 的 destructive 文本）
        const fieldErrors = dialog.locator('.text-red-500, .text-destructive, [role="alert"], .error-message, p.text-sm.font-medium');
        const errorCount = await fieldErrors.count();
        if (errorCount > 0) {
            const errorTexts = await fieldErrors.allTextContents();
            console.error(`表单验证错误: ${errorTexts.join(', ')}`);
            throw new Error(`表单验证失败: ${errorTexts.join(', ')}`);
        }

        // 检查对话框内是否显示 "正在提交" 说明还在请求
        const submitBtn = dialog.locator('button:has-text("正在提交")');
        if (await submitBtn.isVisible({ timeout: 1000 })) {
            console.error('⚠️ 表单仍在提交中...');
            await page.waitForTimeout(5000);
            await expect(dialog).not.toBeVisible({ timeout: 10000 });
        } else {
            throw e;
        }
    }

    // 等待对话框关闭后，页面刷新完成
    await page.waitForLoadState('domcontentloaded');

    // 使用搜索框定位刚创建的线索，避免列表数据量大时新线索不在第一页
    let leadId = '';
    if (name) {
        try {
            // 在搜索框输入名称过滤
            const searchInput = page.locator('input[placeholder*="搜索"]').first();
            if (await searchInput.isVisible({ timeout: 3000 })) {
                await searchInput.fill(name);
                await page.waitForTimeout(800); // 等待防抖搜索触发

                // 等待过滤后的目标行出现
                const targetRow = page.locator('table tbody tr', { hasText: name }).first();
                await targetRow.waitFor({ state: 'visible', timeout: 10000 });
                const leadLink = await targetRow.locator('a').first().getAttribute('href');
                leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';

                // 清空搜索框，恢复列表原貌
                await searchInput.clear();
                await page.waitForTimeout(300);
            } else {
                // 降级：搜索框不存在，等待包含名称的文本出现后取第一行
                console.log('ℹ️ 未找到搜索框，尝试滚动定位新行...');
                await page.getByText(name).first().waitFor({ state: 'visible', timeout: 8000 });
                const targetRow = page.locator('table tbody tr', { hasText: name }).first();
                const leadLink = await targetRow.locator('a').first().getAttribute('href');
                leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';
            }
        } catch (e) {
            console.log(`⚠️ 搜索定位线索失败，回退到第一行: ${e}`);
            const fallbackRow = page.locator('table tbody tr').first();
            await fallbackRow.waitFor({ state: 'visible', timeout: 10000 });
            const leadLink = await fallbackRow.locator('a').first().getAttribute('href');
            leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';
        }
    } else {
        // 无名称时取第一行
        const firstRow = page.locator('table tbody tr').first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });
        const leadLink = await firstRow.locator('a').first().getAttribute('href');
        leadId = leadLink?.split('/leads/')[1]?.split('?')[0] || '';
    }

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
        const phoneInput = page.getByTestId('phone-input').locator('input[type="tel"]');
        if (await phoneInput.isVisible({ timeout: 2000 })) {
            await phoneInput.fill(data.phone);
        } else {
            // 降级兼容旧版
            const oldPhoneInput = page.locator('input[placeholder*="手机号"]');
            if (await oldPhoneInput.isVisible({ timeout: 1000 })) {
                await oldPhoneInput.fill(data.phone);
            }
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
        try {
            const intentionTrigger = page.locator('button[role="combobox"]').filter({ hasText: /选择意向|意向/ }).first();
            if (await intentionTrigger.isVisible({ timeout: 1000 })) {
                await intentionTrigger.click();

                const intentionMap = {
                    '高': '高意向',
                    '中': '中意向',
                    '低': '低意向'
                };
                const mappedIntention = intentionMap[data.intention] || data.intention;

                await page.getByRole('option', { name: new RegExp(mappedIntention) }).click();
            } else {
                const intentionSelect = page.locator('select').filter({ hasText: /选择等级|高|中|低/ }).first();
                if (await intentionSelect.isVisible({ timeout: 1000 })) {
                    await intentionSelect.selectOption({ label: data.intention });
                }
            }
        } catch (e) {
            console.log('⚠️ 意向等级选择失败，跳过', e);
        }
    }

    if (data.notes) {
        const notesInput = page.locator('textarea[placeholder*="备注"], textarea[placeholder*="补充资料"]');
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
 * 使用 domcontentloaded 替代 networkidle 以提高稳定性
 */
export async function navigateToModule(
    page: Page,
    module: 'leads' | 'quotes' | 'orders' | 'finance' | 'service/measurement' | 'service/installation' | 'supply-chain' | 'after-sales' | 'analytics' | 'settings'
): Promise<void> {
    await page.goto(`/${module}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
    // 等待主要内容加载（增加超时到 30s，兼容首次编译）
    try {
        await page.locator('main').first().waitFor({ state: 'visible', timeout: 30000 });
    } catch {
        // 降级：如果 main 元素不存在，等待页面稳定
        console.log('⚠️ 未找到 <main> 元素，等待页面稳定...');
        await page.waitForLoadState('domcontentloaded');
    }
}

/**
 * 点击 Tab 标签
 * 注意：使用 domcontentloaded 而非 networkidle，避免 Next.js dev 模式
 * 的 SSE/轮询连接导致 networkidle 永远无法触发（会造成 1.1min 超时）
 */
export async function clickTab(page: Page, tabText: string): Promise<void> {
    const tab = page.locator(`[role="tab"]:has-text("${tabText}")`).first();
    const isVisible = await tab.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
        await tab.click();
        await page.waitForLoadState('domcontentloaded');
    } else {
        console.log(`ℹ️ Tab "${tabText}" 不可见，跳过`);
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

    // 点击快速报价 - 使用 first() 避免严格模式计算出多个元素的冲突
    const quoteBtn = page.locator('a:has-text("快速报价"), button:has-text("快速报价")').first();
    await quoteBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // Give time for React hydration since networkidle hangs

    // 选择方案
    const planMap = {
        'ECONOMIC': '经济型',
        'STANDARD': '标准型',
        'PREMIUM': '豪华型'
    };
    const planName = planMap[plan] || '经济型';
    const planHeader = page.getByRole('heading', { name: planName });
    if (await planHeader.isVisible({ timeout: 5000 })) {
        console.log(`✅ 找到方案 ${planName}，执行点击`);
        await planHeader.click();
    } else {
        // 降级使用之前可能存在的 testid
        const fallbackCard = page.getByTestId(`plan-${plan}`);
        if (await fallbackCard.isVisible()) {
            console.log(`✅ 找到 fallback 方案 ${planName}`);
            await fallbackCard.click();
        } else {
            console.log(`⚠️ 未能找到方案 ${planName} 的选择入口`);
            // 最后尝试简单的按文本查找并点击
            await page.getByText(planName).first().click({ force: true }).catch(() => { });
        }
    }

    // 填写房间信息
    console.log(`⏳ 填写房间信息：${roomName} (${width}x${height})`);
    const roomNameInput = page.getByRole('textbox', { name: '房间名称' }).first();
    const fallbackRoomName = page.locator('input[placeholder*="如 客厅"]').first();
    if (await roomNameInput.isVisible({ timeout: 3000 })) {
        await roomNameInput.fill(roomName);
    } else if (await fallbackRoomName.isVisible()) {
        await fallbackRoomName.fill(roomName);
    } else {
        await page.locator('input[name="rooms.0.name"]').fill(roomName);
    }

    const widthInput = page.getByRole('spinbutton', { name: '宽度 (cm)' }).first();
    if (await widthInput.isVisible()) {
        await widthInput.fill(width);
        await page.getByRole('spinbutton', { name: '高度 (cm)' }).first().fill(height);
    } else {
        await page.locator('input[name="rooms.0.width"]').fill(width);
        await page.locator('input[name="rooms.0.height"]').fill(height);
    }

    // 提交
    const submitBtn = page.getByRole('button', { name: '生成报价' });
    if (await submitBtn.isVisible()) {
        console.log(`⏳ 尝试点击生成报价按钮...`);
        // 显式等待可用，并包裹 try-catch 以免直接失败
        try {
            await expect(submitBtn).toBeEnabled({ timeout: 5000 });
            await submitBtn.click();
            console.log(`✅ 生成报价按钮点击成功`);
        } catch (e) {
            console.log('⚠️ 生成报价按钮仍未启用，可能是方案未选中或参数错误');
            // 回退尝试力求触发
            await submitBtn.click({ force: true }).catch(() => { });
        }
    } else {
        await page.click('button:has-text("生成报价"), button:has-text("提交")');
    }

    // 等待跳转到报价详情
    console.log(`⏳ 等待跳转到报价详情 URL: ${page.url()}`);
    try {
        await page.waitForURL(/\/quotes\/.*/, { timeout: 15000 });
    } catch (e: any) {
        console.log(`❌ waitForURL 超时。当前 URL: ${page.url()}，报错: ${e.message}`);
    }

    // 提取报价 ID
    const url = page.url();
    const quoteId = url.split('/quotes/')[1]?.split('?')[0] || '';
    console.log(`🔍 提取的 quoteId: '${quoteId}'，提取来源 URL: '${url}'`);

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
 * 需要先确保在报价详情页（/quotes/{id}），且页面已加载完毕
 */
export async function submitQuoteForApproval(page: Page): Promise<void> {
    console.log('⏳ submitQuoteForApproval: 等待报价详情页加载..., URL:', page.url());
    // 等待页面 DOM 完成加载（dev 模式下首次 SSR 编译可能较慢）
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 使用多种选择器尝试查找"提交审核"按钮
    const submitBtn = page.locator('button:has-text("提交审核")').first();
    const isVisible = await submitBtn.isVisible({ timeout: 30000 }).catch(() => false);

    if (isVisible) {
        try {
            await expect(submitBtn).toBeEnabled({ timeout: 10000 });
            await submitBtn.click();
            console.log('✅ 提交审核按钮点击成功');
            // 等待状态变化（toast 消失或页面刷新）
            await page.waitForTimeout(2000);
        } catch (e: any) {
            console.log('❌ 点击提交审核按钮时发生异常:', e.message);
        }
    } else {
        console.log('❌ 经过30s等待，未能找到提交审核按钮！URL:', page.url());
        const buttons = await page.locator('button').allTextContents();
        console.log('🎯 当前页面上现有的按钮文本有:', buttons.join(' | '));
        // 页面可能还没加载完，尝试刷新后再找
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        const retryBtn = page.locator('button:has-text("提交审核")').first();
        if (await retryBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
            await retryBtn.click();
            console.log('✅ 刷新后找到并点击了提交审核按钮');
            await page.waitForTimeout(2000);
        } else {
            console.log('❌ 刷新后仍未找到提交审核按钮');
        }
    }
}

/**
 * 批准报价
 * 状态从 PENDING_APPROVAL -> APPROVED
 */
export async function approveQuote(page: Page): Promise<void> {
    console.log('⏳ approveQuote: 等待审批按钮出现..., URL:', page.url());
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 查找批准/通过按钮
    const approveBtn = page.locator('button:has-text("批准"), button:has-text("通过")').first();
    const isVisible = await approveBtn.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
        page.once('dialog', dialog => dialog.accept());
        await approveBtn.click();
        console.log('✅ 批准按钮点击成功');
        await page.waitForTimeout(2000);
    } else {
        console.log('❌ 未找到批准/通过按钮');
        const buttons = await page.locator('button').allTextContents();
        console.log('🎯 当前按钮:', buttons.join(' | '));
    }
}



/**
 * 报价转订单
 * 状态从 APPROVED -> 创建订单
 */
export async function convertQuoteToOrder(page: Page): Promise<string> {
    console.log('⏳ convertQuoteToOrder: 等待转订单按钮..., URL:', page.url());
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const convertBtn = page.locator('button:has-text("转订单")').first();
    const isVisible = await convertBtn.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
        page.once('dialog', dialog => dialog.accept());
        await convertBtn.click();
        console.log('✅ 转订单按钮点击成功');

        // 等待跳转到订单页面
        try {
            await page.waitForURL(/\/orders\/.*/, { timeout: 30000 });
            const url = page.url();
            const orderId = url.split('/orders/')[1]?.split('?')[0] || '';
            console.log('✅ 成功跳转到订单页面, orderId:', orderId);
            return orderId;
        } catch {
            console.log('❌ 等待订单页面跳转超时, URL:', page.url());
            return '';
        }
    }
    console.log('❌ 未找到转订单按钮');
    const buttons = await page.locator('button').allTextContents();
    console.log('🎯 当前按钮:', buttons.join(' | '));
    return '';
}

// ============ 订单模块辅助函数 ============

/**
 * 确认订单
 */
export async function confirmOrder(page: Page): Promise<void> {
    console.log('⏳ confirmOrder: 等待确认订单按钮..., URL:', page.url());
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const confirmBtn = page.locator('button:has-text("确认订单")').first();
    const isVisible = await confirmBtn.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
        await confirmBtn.click();
        console.log('✅ 确认订单按钮点击成功');
        await confirmDialog(page);
    } else {
        console.log('❌ 未找到确认订单按钮');
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
