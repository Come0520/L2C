import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('线索到报价流程', () => {
  let leadId: string;
  let quoteId: string;
  const testEmail = 'test-sales@example.com';
  const testPassword = 'Test1234!';

  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login');
    
    // 登录为销售代表
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
  });

  test('创建新线索', async ({ page }) => {
    // 导航到线索列表页面
    await page.goto('/leads');
    
    // 点击创建线索按钮
    await page.click('button:has-text("创建线索")');
    
    // 填写线索表单
    const customerName = faker.person.fullName();
    const customerPhone = faker.phone.number();
    const customerEmail = faker.internet.email();
    const projectName = faker.company.name() + ' 项目';
    const projectAddress = faker.location.streetAddress() + ', ' + faker.location.city();
    
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', customerPhone);
    await page.fill('input[name="customerEmail"]', customerEmail);
    await page.fill('input[name="projectName"]', projectName);
    await page.fill('input[name="projectAddress"]', projectAddress);
    await page.fill('input[name="projectArea"]', faker.number.float({ min: 50, max: 500, precision: 0.1 }).toString());
    await page.selectOption('select[name="leadSource"]', faker.helpers.arrayElement(['online', 'referral', 'call']));
    await page.selectOption('select[name="priority"]', faker.helpers.arrayElement(['low', 'medium', 'high']));
    await page.fill('textarea[name="notes"]', faker.lorem.paragraph());
    
    // 提交表单
    await page.click('button:has-text("保存")');
    
    // 验证线索创建成功
    await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText(customerName);
    
    // 获取线索ID
    leadId = page.url().split('/').pop() || '';
    expect(leadId).toBeTruthy();
  });

  test('分配线索给销售代表', async ({ page }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 点击分配按钮
    await page.click('button:has-text("分配")');
    
    // 选择销售代表
    await page.selectOption('select[name="assignedTo"]', 'salesperson-1');
    await page.click('button:has-text("确认分配")');
    
    // 验证分配成功
    await expect(page.locator('.lead-status')).toContainText('已分配');
    await expect(page.locator('.assigned-to')).toContainText('销售代表1');
  });

  test('创建报价', async ({ page }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 点击创建报价按钮
    await page.click('button:has-text("创建报价")');
    
    // 填写报价表单
    await page.fill('input[name="quoteNumber"]', faker.string.alphanumeric(10).toUpperCase());
    await page.fill('input[name="quoteDate"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="quoteStatus"]', 'draft');
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
    await expect(page.locator('h1')).toContainText('报价详情');
    
    // 获取报价ID
    quoteId = page.url().split('/').pop() || '';
    expect(quoteId).toBeTruthy();
  });

  test('发送报价给客户', async ({ page }) => {
    // 导航到报价详情页面
    await page.goto(`/quotes/${quoteId}`);
    
    // 更新报价状态为已发送
    await page.selectOption('select[name="quoteStatus"]', 'sent');
    await page.click('button:has-text("更新状态")');
    
    // 验证报价状态更新成功
    await expect(page.locator('.quote-status')).toContainText('已发送');
    
    // 发送报价邮件
    await page.click('button:has-text("发送给客户")');
    await page.fill('input[name="emailSubject"]', '您的报价已准备好');
    await page.fill('textarea[name="emailBody"]', '尊敬的客户，您的报价已准备好，请查收。');
    await page.click('button:has-text("发送邮件")');
    
    // 验证邮件发送成功
    await expect(page.locator('.success-message')).toContainText('报价已成功发送给客户');
  });

  test('查看线索和报价关联', async ({ page }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 验证线索关联了报价
    await expect(page.locator('.quote-link')).toHaveCount(1);
    await expect(page.locator('.quote-link')).toHaveAttribute('href', `/quotes/${quoteId}`);
    
    // 导航到报价详情页面
    await page.goto(`/quotes/${quoteId}`);
    
    // 验证报价关联了线索
    await expect(page.locator('.lead-link')).toHaveCount(1);
    await expect(page.locator('.lead-link')).toHaveAttribute('href', `/leads/${leadId}`);
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.goto('/dashboard');
    await page.click('button:has-text("登出")');
    await expect(page).toHaveURL('/login');
  });
});
