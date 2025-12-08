import { test, expect } from '@playwright/test';

/**
 * 登录流程测试用例
 * 包含：
 * 1. 正常登录
 * 2. 错误密码登录
 * 3. 权限拦截测试
 */

test.describe('Login Flow Tests', () => {
  // 测试账号配置（需要替换为真实的测试账号）
  const TEST_PHONE = process.env.TEST_PHONE || '13800138000';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';
  const WRONG_PASSWORD = 'wrongpassword';

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // 验证页面标题
    await expect(page).toHaveTitle(/Slideboard/);
    
    // 验证登录表单元素存在
    await expect(page.getByLabel('手机号')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '密码' })).toBeVisible();
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible();
  });

  test('should show error message with invalid phone format', async ({ page }) => {
    await page.goto('/login');
    
    // 输入无效手机号
    await page.getByLabel('手机号').fill('123456');
    await page.getByRole('textbox', { name: '密码' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    
    // 验证错误信息显示
    await expect(page.getByText('请输入正确的手机号')).toBeVisible();
  });

  test('should show error message with wrong password', async ({ page }) => {
    await page.goto('/login');
    
    // 输入正确手机号和错误密码
    await page.getByLabel('手机号').fill(TEST_PHONE);
    await page.getByRole('textbox', { name: '密码' }).fill(WRONG_PASSWORD);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    
    // 验证登录失败错误信息
    await expect(page.getByText(/登录失败/)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // 输入正确的手机号和密码
    await page.getByLabel('手机号').fill(TEST_PHONE);
    await page.getByRole('textbox', { name: '密码' }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    
    // 验证成功跳转到仪表盘
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect to login page when accessing protected route without authentication', async ({ page }) => {
    // 直接访问受保护的仪表盘页面
    await page.goto('/dashboard');
    
    // 验证被重定向到登录页面
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error message when missing required fields', async ({ page }) => {
    await page.goto('/login');
    
    // 直接点击登录按钮，不填写任何字段
    await page.getByRole('button', { name: '登录', exact: true }).click();
    
    // 验证错误信息显示
    await expect(page.getByText(/请填写手机号和密码|请填写手机号或密码/)).toBeVisible();
  });
});
