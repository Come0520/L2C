/**
 * 供应商数据模拟 (Seed)
 * 为 E2E 测试提供不同类型的供应商数据
 */
import { Page } from '@playwright/test';

/**
 * 供应商类型
 */
export type SupplierType = 'FABRIC' | 'HARDWARE' | 'SERVICE' | 'LOGISTICS';

/**
 * 创建供应商
 * 通过页面交互创建，确保数据真实可用
 */
export async function createSupplier(
    page: Page,
    options: {
        name?: string;
        type?: SupplierType;
        contact?: string;
        phone?: string;
    } = {}
): Promise<string> {
    const timestamp = Date.now();
    const {
        name = `测试供应商_${timestamp}`,
        type = 'FABRIC',
        contact = '联系人',
        phone = `138${timestamp.toString().slice(-8)}`
    } = options;

    // 导航到供应商管理页面
    await page.goto('/supply-chain/suppliers');
    await page.waitForLoadState('networkidle');

    // 点击新建按钮
    const createBtn = page.locator('button:has-text("新建"), button:has-text("添加供应商")').first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
        await createBtn.click();
        await page.waitForSelector('[role="dialog"], dialog', { timeout: 5000 });

        // 填写供应商名称
        const nameInput = page.locator('input[placeholder*="名称"], input[name="name"]').first();
        if (await nameInput.isVisible({ timeout: 2000 })) {
            await nameInput.fill(name);
        }

        // 选择类型
        const typeSelect = page.locator('select, [role="combobox"]').first();
        if (await typeSelect.isVisible({ timeout: 2000 })) {
            await typeSelect.click();
            const typeOption = page.locator(`[role="option"]:has-text("${getTypeLabel(type)}")`);
            if (await typeOption.isVisible({ timeout: 2000 })) {
                await typeOption.click();
            }
        }

        // 填写联系人
        const contactInput = page.locator('input[placeholder*="联系人"], input[name="contact"]').first();
        if (await contactInput.isVisible({ timeout: 2000 })) {
            await contactInput.fill(contact);
        }

        // 填写电话
        const phoneInput = page.locator('input[placeholder*="电话"], input[name="phone"]').first();
        if (await phoneInput.isVisible({ timeout: 2000 })) {
            await phoneInput.fill(phone);
        }

        // 提交
        const submitBtn = page.locator('button:has-text("提交"), button:has-text("创建"), button:has-text("确认")').first();
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
        }

        // 返回供应商 ID
        const url = page.url();
        const supplierId = url.match(/suppliers\/([^/?]+)/)?.[1] || '';
        return supplierId;
    }

    console.log('⚠️ 未找到创建供应商按钮');
    return '';
}

/**
 * 获取供应商类型标签
 */
function getTypeLabel(type: SupplierType): string {
    const labels: Record<SupplierType, string> = {
        FABRIC: '面料供应商',
        HARDWARE: '五金供应商',
        SERVICE: '安装服务商',
        LOGISTICS: '物流服务商'
    };
    return labels[type] || '面料供应商';
}

/**
 * 模拟多个不同类型的供应商
 * 用于供应商评价测试
 */
export async function seedSuppliers(page: Page): Promise<string[]> {
    const supplierIds: string[] = [];

    // 创建不同类型的供应商
    const supplierConfigs = [
        { name: '优质面料厂_E2E', type: 'FABRIC' as SupplierType, contact: '张经理' },
        { name: '精密五金厂_E2E', type: 'HARDWARE' as SupplierType, contact: '李经理' },
        { name: '专业安装队_E2E', type: 'SERVICE' as SupplierType, contact: '王师傅' },
    ];

    for (const config of supplierConfigs) {
        try {
            const id = await createSupplier(page, config);
            if (id) {
                supplierIds.push(id);
                console.log(`✅ 创建供应商成功: ${config.name}`);
            }
        } catch (error) {
            console.log(`⚠️ 创建供应商失败: ${config.name}`, error);
        }
    }

    return supplierIds;
}

/**
 * 检查供应商列表是否有数据
 */
export async function hasSuppliersData(page: Page): Promise<boolean> {
    await page.goto('/supply-chain/suppliers');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    return await firstRow.isVisible({ timeout: 5000 });
}

/**
 * 获取第一个供应商的 ID
 */
export async function getFirstSupplierId(page: Page): Promise<string> {
    await page.goto('/supply-chain/suppliers');
    await page.waitForLoadState('networkidle');

    const firstLink = page.locator('table tbody tr a').first();
    if (await firstLink.isVisible({ timeout: 5000 })) {
        const href = await firstLink.getAttribute('href');
        return href?.match(/suppliers\/([^/?]+)/)?.[1] || '';
    }
    return '';
}
