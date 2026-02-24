import { test, expect } from '@playwright/test';

/**
 * 核心 RBAC (基于角色的访问控制) 安全测试
 * 
 * 场景：
 * 1. 模拟普通销售 (SALES) 角色，验证无法访问管理页面。
 * 2. 模拟普通销售角色，验证无法执行管理操作（如用户管理）。
 * 3. 验证权限拦截的 UI 表现（按钮隐藏或禁用）。
 */

test.describe('RBAC 安全权限测试', () => {

    test('销售人员 (SALES) 不应看到或访问系统管理功能', async ({ page }) => {
        // 1. 拦截 Session 请求，模拟 SALES 角色
        await page.route('**/api/auth/session', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-sales-id',
                        name: '测试销售',
                        email: 'sales@example.com',
                        image: null,
                        role: 'SALES',
                        roles: ['SALES'],
                        permissions: [
                            'lead.own.view',
                            'lead.own.edit',
                            'customer.own.view',
                            'quote.own.view'
                        ]
                    },
                    expires: new Date(Date.now() + 3600000).toISOString()
                })
            });
        });

        // 2. 访问首页，检查导航菜单
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 验证侧边栏是否隐藏了“系统设置”或“用户管理”
        // 注意：这里需要根据实际 UI 的文本或 selector 来调整
        const adminModules = page.locator('nav').getByText(/系统设置|用户管理|角色管理|租户管理/);
        for (let i = 0; i < await adminModules.count(); i++) {
            await expect(adminModules.nth(i)).not.toBeVisible();
        }

        // 3. 尝试强制跳转到管理路径
        const adminPaths = ['/admin/tenants', '/settings/users', '/settings/roles'];
        for (const path of adminPaths) {
            await page.goto(path);
            // 验证是否重定向或显示 403 错误提示
            await expect(page.locator('text=无权限|Access Denied|403|Forbidden|首页')).toBeVisible({ timeout: 5000 }).catch(() => {
                // 如果是重定向处理，URL 不应该包含管理路径
                expect(page.url()).not.toContain(path);
            });
        }
    });

    test('无权限用户非法调用管理类接口应被拦截', async ({ page }) => {
        // 模拟 SALES 角色
        await page.route('**/api/auth/session', async route => {
            await route.fulfill({
                json: {
                    user: {
                        role: 'SALES',
                        permissions: ['lead.view']
                    }
                }
            });
        });

        await page.goto('/');

        // 尝试通过浏览器原生 fetch 调用一个管理类接口（模拟绕过 UI 的攻击）
        const unauthorizedAction = await page.evaluate(async () => {
            try {
                const res = await fetch('/api/admin/users', { method: 'GET' });
                return res.status;
            } catch (e) {
                return 'error';
            }
        });

        // 验证后端拦截并返回 401 或 403
        expect([401, 403, 404]).toContain(unauthorizedAction);
    });

    test('UI 元素权限制控验证', async ({ page }) => {
        // 模拟只读权限：只能查看线索，不能创建
        await page.route('**/api/auth/session', async route => {
            await route.fulfill({
                json: {
                    user: {
                        role: 'GUEST',
                        permissions: ['lead.all.view'] // 只有查看权限，没有 lead.create
                    }
                }
            });
        });

        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        // 验证“创建线索”按钮是否不显示或被禁用
        const createBtn = page.getByRole('button', { name: /创建|新增/ });

        // 检查是否不可见或已禁用
        const isVisible = await createBtn.isVisible();
        if (isVisible) {
            await expect(createBtn).toBeDisabled();
        } else {
            expect(isVisible).toBeFalsy();
        }
    });
});
