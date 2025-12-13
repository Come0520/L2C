import { test, expect } from '@playwright/test';

test.describe('用户权限测试', () => {
  // 测试不同角色的用户权限
  const users = [
    {
      role: 'admin',
      email: 'test-admin@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'users', 'teams', 'leads', 'quotes', 'orders', 'measurements', 'installations', 'products', 'reconciliations', 'reports', 'settings']
    },
    {
      role: 'manager',
      email: 'test-manager@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'users', 'teams', 'leads', 'quotes', 'orders', 'measurements', 'installations', 'reports']
    },
    {
      role: 'salesperson',
      email: 'test-sales@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'leads', 'quotes', 'orders']
    },
    {
      role: 'technician',
      email: 'test-technician@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'measurements', 'orders']
    },
    {
      role: 'installer',
      email: 'test-installer@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'installations', 'orders']
    },
    {
      role: 'accountant',
      email: 'test-accountant@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'orders', 'reconciliations', 'reports']
    },
    {
      role: 'customer',
      email: 'test-customer@example.com',
      password: 'Test1234!',
      canAccess: ['dashboard', 'orders']
    }
  ];

  const pagesToTest = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'users', path: '/users' },
    { name: 'teams', path: '/teams' },
    { name: 'leads', path: '/leads' },
    { name: 'quotes', path: '/quotes' },
    { name: 'orders', path: '/orders' },
    { name: 'measurements', path: '/measurements' },
    { name: 'installations', path: '/installations' },
    { name: 'products', path: '/products' },
    { name: 'reconciliations', path: '/reconciliations' },
    { name: 'reports', path: '/reports' },
    { name: 'settings', path: '/settings' }
  ];

  users.forEach(user => {
    test.describe(`${user.role} 用户权限测试`, () => {
      test.beforeEach(async ({ page }) => {
        // 导航到登录页面
        await page.goto('/login');
        
        // 登录
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);
        await page.click('button[type="submit"]');
        
        // 验证登录成功
        await expect(page).toHaveURL('/dashboard');
      });

      pagesToTest.forEach(pageToTest => {
        if (user.canAccess.includes(pageToTest.name)) {
          test(`应该可以访问 ${pageToTest.name} 页面`, async ({ page }) => {
            // 导航到页面
            await page.goto(pageToTest.path);
            
            // 验证页面加载成功，没有重定向到登录或403页面
            await expect(page).not.toHaveURL('/login');
            await expect(page).not.toHaveURL(/\/403/);
            await expect(page).not.toHaveURL(/\/404/);
            
            // 验证页面标题或主要元素存在
            await expect(page.locator('h1')).toBeVisible();
          });
        } else {
          test(`不应该可以访问 ${pageToTest.name} 页面`, async ({ page }) => {
            // 导航到页面
            await page.goto(pageToTest.path);
            
            // 验证页面被重定向或显示403
            await expect(page).toHaveURL(/(\/login|\/403|\/dashboard)/);
          });
        }
      });

      test('应该可以访问自己的个人资料页面', async ({ page }) => {
        // 点击用户头像或个人资料链接
        await page.click('.user-profile-button');
        await page.click('text=个人资料');
        
        // 验证个人资料页面加载成功
        await expect(page).toHaveURL(/\/profile/);
        await expect(page.locator('h1')).toContainText('个人资料');
      });

      test.afterAll(async ({ page }) => {
        // 登出
        await page.click('.user-profile-button');
        await page.click('text=登出');
        await expect(page).toHaveURL('/login');
      });
    });
  });

  test.describe('权限边界测试', () => {
    test('未登录用户应该被重定向到登录页面', async ({ page }) => {
      // 尝试直接访问受保护页面
      await page.goto('/dashboard');
      
      // 验证被重定向到登录页面
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toContainText('登录');
    });

    test('登录用户应该无法访问不存在的页面', async ({ page }) => {
      // 登录为管理员
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test-admin@example.com');
      await page.fill('input[name="password"]', 'Test1234!');
      await page.click('button[type="submit"]');
      
      // 尝试访问不存在的页面
      await page.goto('/non-existent-page');
      
      // 验证显示404页面
      await expect(page.locator('h1')).toContainText('404');
      await expect(page.locator('p')).toContainText('页面不存在');
    });
  });
});
