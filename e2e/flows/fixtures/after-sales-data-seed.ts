/**
 * 售后工单数据模拟 (Seed)
 * 为 E2E 测试提供不同状态的售后工单数据
 */
import { Page } from '@playwright/test';

/**
 * 售后工单状态类型
 */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * 售后工单类型
 */
export type TicketType = 'QUALITY' | 'INSTALLATION' | 'LOGISTICS' | 'SERVICE';

/**
 * 创建售后工单
 * 通过页面交互创建，确保数据真实可用
 */
export async function createAfterSalesTicket(
    page: Page,
    options: {
        type?: TicketType;
        description?: string;
        customerName?: string;
        priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    } = {}
): Promise<string> {
    const {
        type = 'QUALITY',
        description = '测试售后工单_' + Date.now(),
        customerName: _customerName = '测试客户',
        priority: _priority = 'MEDIUM'
    } = options;

    // 导航到售后管理页面
    await page.goto('/after-sales');
    await page.waitForLoadState('networkidle');

    // 点击新建工单按钮
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建工单")').first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
        await createBtn.click();
        await page.waitForSelector('[role="dialog"], dialog', { timeout: 5000 });

        // 填写工单信息
        const typeSelect = page.locator('select, [role="combobox"]').first();
        if (await typeSelect.isVisible({ timeout: 2000 })) {
            await typeSelect.click();
            const typeOption = page.locator(`[role="option"]:has-text("${getTypeLabel(type)}")`);
            if (await typeOption.isVisible({ timeout: 2000 })) {
                await typeOption.click();
            }
        }

        // 填写描述
        const descInput = page.locator('textarea').first();
        if (await descInput.isVisible()) {
            await descInput.fill(description);
        }

        // 提交
        const submitBtn = page.locator('button:has-text("提交"), button:has-text("创建")').first();
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
        }

        // 返回工单 ID
        const url = page.url();
        const ticketId = url.match(/after-sales\/([^/?]+)/)?.[1] || '';
        return ticketId;
    }

    console.log('⚠️ 未找到创建工单按钮');
    return '';
}

/**
 * 获取工单类型标签
 */
function getTypeLabel(type: TicketType): string {
    const labels: Record<TicketType, string> = {
        QUALITY: '质量问题',
        INSTALLATION: '安装问题',
        LOGISTICS: '物流问题',
        SERVICE: '服务问题'
    };
    return labels[type] || '质量问题';
}

/**
 * 模拟多个不同状态的售后工单
 * 用于溯源看板测试
 */
export async function seedAfterSalesTickets(page: Page): Promise<string[]> {
    const ticketIds: string[] = [];

    // 创建不同类型的工单
    const ticketConfigs = [
        { type: 'QUALITY' as TicketType, description: '窗帘布料有色差问题' },
        { type: 'INSTALLATION' as TicketType, description: '安装位置偏移需要调整' },
        { type: 'LOGISTICS' as TicketType, description: '物流运输中货物损坏' },
    ];

    for (const config of ticketConfigs) {
        try {
            const id = await createAfterSalesTicket(page, config);
            if (id) {
                ticketIds.push(id);
                console.log(`✅ 创建售后工单成功: ${config.type}`);
            }
        } catch (error) {
            console.log(`⚠️ 创建售后工单失败: ${config.type}`, error);
        }
    }

    return ticketIds;
}

/**
 * 检查售后工单列表是否有数据
 */
export async function hasAfterSalesData(page: Page): Promise<boolean> {
    await page.goto('/after-sales');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    return await firstRow.isVisible({ timeout: 5000 });
}

/**
 * 获取第一个售后工单的 ID
 */
export async function getFirstTicketId(page: Page): Promise<string> {
    await page.goto('/after-sales');
    await page.waitForLoadState('networkidle');

    const firstLink = page.locator('table tbody tr a').first();
    if (await firstLink.isVisible({ timeout: 5000 })) {
        const href = await firstLink.getAttribute('href');
        return href?.match(/after-sales\/([^/?]+)/)?.[1] || '';
    }
    return '';
}
