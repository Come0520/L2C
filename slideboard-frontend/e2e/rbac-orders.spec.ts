import { test, expect } from '@playwright/test';

// 定义 Mock 订单数据
const mockOrder = {
    id: 'mock-order-id',
    sales_no: 'SO-MOCK-2025',
    status: 'measuring',
    customer_name: '测试客户',
    customer_phone: '13900000000',
    project_address: '测试地址 1-1',
    total_amount: 5000,
    package_amount: 3900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    items: [
        {
            id: 'item-1',
            space: '客厅',
            product: '布帘',
            quantity: 2,
            unit_price: 100,
            amount: 200,
            width: 3,
            height: 2.7
        }
    ]
};

test.describe('订单详情页角色权限控制 (RBAC)', () => {

    test.beforeEach(async ({ page }) => {
        // 拦截 Supabase 订单详情请求
        await page.route('**/rest/v1/orders*', async route => {
            const url = route.request().url();
            // 简单匹配 id 查询
            if (url.includes('id=eq.mock-order-id')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockOrder)
                });
            } else {
                await route.continue();
            }
        });
    });

    test('管理员 (Admin) 应能看到所有敏感信息和操作按钮', async ({ page }) => {
        // 1. 登录为管理员 (根据 AuthContext 逻辑)
        await page.goto('/login');
        await page.getByLabel('手机号').fill('13800138000'); // Admin
        await page.getByLabel('密码').fill('123456');
        await page.getByRole('button', { name: '登录' }).click();
        await expect(page).toHaveURL('/');

        // 2. 访问订单详情页
        await page.goto('/orders/mock-order-id');

        // 3. 验证权限
        // 编辑按钮应该是可见的
        await expect(page.getByRole('button', { name: '编辑订单' })).toBeVisible();

        // 费用汇总应该是可见的
        await expect(page.getByRole('heading', { name: '费用汇总' })).toBeVisible();
        await expect(page.getByText('¥5,000')).toBeVisible(); // 总金额

        // 商品单价和金额应该是可见的
        await expect(page.getByText('¥100')).toBeVisible(); // 单价
        await expect(page.getByText('¥200')).first().toBeVisible(); // 金额
    });

    test('安装师 (Installer) 应无法看到敏感费用和操作按钮', async ({ page }) => {
        // 1. 登录为安装师
        await page.goto('/login');
        await page.getByLabel('手机号').fill('13800138001'); // Installer
        await page.getByLabel('密码').fill('123456');
        await page.getByRole('button', { name: '登录' }).click();
        await expect(page).toHaveURL('/');

        // 2. 访问订单详情页
        await page.goto('/orders/mock-order-id');

        // 3. 验证权限
        // 编辑按钮应该是隐藏的
        await expect(page.getByRole('button', { name: '编辑订单' })).toBeHidden();

        // 费用汇总应该是隐藏的
        await expect(page.getByRole('heading', { name: '费用汇总' })).toBeHidden();
        await expect(page.getByText('¥5,000')).toBeHidden();

        // 商品单价和金额应该是隐藏的
        await expect(page.getByText('¥100')).toBeHidden();
    });

    test('安装师尝试访问编辑页应被拒绝', async ({ page }) => {
        // 1. 登录为安装师
        await page.goto('/login');
        await page.getByLabel('手机号').fill('13800138001');
        await page.getByLabel('密码').fill('123456');
        await page.getByRole('button', { name: '登录' }).click();

        // 2. 直接访问编辑页
        await page.goto('/orders/mock-order-id/edit');

        // 3. 验证拒绝提示
        await expect(page.getByText('访问被拒绝')).toBeVisible();
        await expect(page.getByText('没有权限编辑此订单')).toBeVisible();
        await expect(page.getByRole('link', { name: '返回订单详情' })).toBeVisible();
    });
});
