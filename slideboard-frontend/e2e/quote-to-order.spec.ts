import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';

test.describe('报价到订单流程', () => {
  let quoteId: string;
  let orderId: string;
  const testEmail = 'test-manager@example.com';
  const testPassword = 'Test1234!';

  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login');
    
    // 登录为销售经理
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
  });

  test('创建测试报价', async ({ page }) => {
    // 导航到报价列表页面
    await page.goto('/quotes');
    
    // 点击创建报价按钮
    await page.click('button:has-text("创建报价")');
    
    // 填写报价表单
    const quoteNumber = faker.string.alphanumeric(10).toUpperCase();
    const customerName = faker.person.fullName();
    
    await page.fill('input[name="quoteNumber"]', quoteNumber);
    await page.fill('input[name="quoteDate"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', faker.phone.number());
    await page.fill('input[name="customerEmail"]', faker.internet.email());
    await page.selectOption('select[name="quoteStatus"]', 'sent');
    await page.fill('textarea[name="quoteNotes"]', faker.lorem.paragraph());
    
    // 添加报价项目
    await page.click('button:has-text("添加项目")');
    await page.fill('input[name="productName"]', faker.commerce.productName());
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="unitPrice"]', '1000');
    
    // 保存报价
    await page.click('button:has-text("保存报价")');
    
    // 验证报价创建成功
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+/);
    
    // 获取报价ID
    quoteId = page.url().split('/').pop() || '';
    expect(quoteId).toBeTruthy();
  });

  test('接受报价', async ({ page }) => {
    // 导航到报价详情页面
    await page.goto(`/quotes/${quoteId}`);
    
    // 更新报价状态为已接受
    await page.selectOption('select[name="quoteStatus"]', 'accepted');
    await page.click('button:has-text("更新状态")');
    
    // 验证报价状态更新成功
    await expect(page.locator('.quote-status')).toContainText('已接受');
    
    // 添加接受备注
    await page.fill('textarea[name="acceptanceNotes"]', '客户已确认接受报价');
    await page.click('button:has-text("保存备注")');
    
    // 验证备注保存成功
    await expect(page.locator('.acceptance-notes')).toContainText('客户已确认接受报价');
  });

  test('从报价创建订单', async ({ page }) => {
    // 导航到报价详情页面
    await page.goto(`/quotes/${quoteId}`);
    
    // 点击从报价创建订单按钮
    await page.click('button:has-text("创建订单")');
    
    // 填写订单表单
    await page.fill('input[name="orderNumber"]', faker.string.alphanumeric(12).toUpperCase());
    await page.fill('input[name="orderDate"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="orderStatus"]', 'pending');
    await page.selectOption('select[name="paymentMethod"]', 'bank_transfer');
    await page.fill('textarea[name="orderNotes"]', '从报价自动创建的订单');
    
    // 验证订单项目已从报价导入
    await expect(page.locator('.order-items-list li')).toHaveCount(1);
    
    // 保存订单
    await page.click('button:has-text("创建订单")');
    
    // 验证订单创建成功
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText('订单详情');
    
    // 获取订单ID
    orderId = page.url().split('/').pop() || '';
    expect(orderId).toBeTruthy();
  });

  test('审核订单', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 点击审核按钮
    await page.click('button:has-text("审核订单")');
    
    // 填写审核表单
    await page.selectOption('select[name="approvalStatus"]', 'approved');
    await page.fill('textarea[name="approvalNotes"]', '订单审核通过');
    
    // 提交审核
    await page.click('button:has-text("提交审核")');
    
    // 验证订单状态更新成功
    await expect(page.locator('.order-status')).toContainText('已审核');
    await expect(page.locator('.approval-status')).toContainText('已通过');
  });

  test('更新订单状态为处理中', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 更新订单状态为处理中
    await page.selectOption('select[name="orderStatus"]', 'processing');
    await page.click('button:has-text("更新状态")');
    
    // 验证订单状态更新成功
    await expect(page.locator('.order-status')).toContainText('处理中');
  });

  test('查看报价和订单关联', async ({ page }) => {
    // 导航到报价详情页面
    await page.goto(`/quotes/${quoteId}`);
    
    // 验证报价关联了订单
    await expect(page.locator('.order-link')).toHaveCount(1);
    await expect(page.locator('.order-link')).toHaveAttribute('href', `/orders/${orderId}`);
    
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 验证订单关联了报价
    await expect(page.locator('.quote-link')).toHaveCount(1);
    await expect(page.locator('.quote-link')).toHaveAttribute('href', `/quotes/${quoteId}`);
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.goto('/dashboard');
    await page.click('button:has-text("登出")');
    await expect(page).toHaveURL('/login');
  });
});
