import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';

test.describe('订单到测量流程', () => {
  let orderId: string;
  let measurementId: string;
  const testEmail = 'test-operations@example.com';
  const testPassword = 'Test1234!';

  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login');
    
    // 登录为运营人员
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
  });

  test('创建测试订单', async ({ page }) => {
    // 导航到订单列表页面
    await page.goto('/orders');
    
    // 点击创建订单按钮
    await page.click('button:has-text("创建订单")');
    
    // 填写订单表单
    const orderNumber = faker.string.alphanumeric(12).toUpperCase();
    const customerName = faker.person.fullName();
    
    await page.fill('input[name="orderNumber"]', orderNumber);
    await page.fill('input[name="orderDate"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', faker.phone.number());
    await page.fill('input[name="customerEmail"]', faker.internet.email());
    await page.fill('input[name="shippingAddress"]', faker.location.streetAddress() + ', ' + faker.location.city());
    await page.fill('input[name="billingAddress"]', faker.location.streetAddress() + ', ' + faker.location.city());
    await page.selectOption('select[name="orderStatus"]', 'processing');
    await page.selectOption('select[name="paymentMethod"]', 'bank_transfer');
    await page.fill('textarea[name="orderNotes"]', '测试订单，用于测量流程测试');
    
    // 添加订单项目
    await page.click('button:has-text("添加项目")');
    await page.fill('input[name="productName"]', '铝合金门窗');
    await page.fill('input[name="quantity"]', '5');
    await page.fill('input[name="unitPrice"]', '2000');
    
    // 保存订单
    await page.click('button:has-text("创建订单")');
    
    // 验证订单创建成功
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    
    // 获取订单ID
    orderId = page.url().split('/').pop() || '';
    expect(orderId).toBeTruthy();
  });

  test('安排测量任务', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 点击安排测量按钮
    await page.click('button:has-text("安排测量")');
    
    // 填写测量安排表单
    const measurementDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7天后
    const measurementTime = '10:00';
    
    await page.fill('input[name="measurementDate"]', measurementDate);
    await page.fill('input[name="measurementTime"]', measurementTime);
    await page.selectOption('select[name="technicianId"]', 'technician-1');
    await page.fill('textarea[name="measurementNotes"]', '请携带测量工具，客户要求准时到达');
    
    // 保存测量安排
    await page.click('button:has-text("保存安排")');
    
    // 验证测量安排成功
    await expect(page.locator('.measurement-status')).toContainText('已安排');
    await expect(page.locator('.measurement-date')).toContainText(measurementDate);
    
    // 获取测量ID
    const measurementLink = await page.locator('.measurement-link').getAttribute('href');
    expect(measurementLink).toBeTruthy();
    measurementId = measurementLink?.split('/').pop() || '';
    expect(measurementId).toBeTruthy();
  });

  test('查看测量详情', async ({ page }) => {
    // 导航到测量详情页面
    await page.goto(`/measurements/${measurementId}`);
    
    // 验证测量详情显示正确
    await expect(page.locator('h1')).toContainText('测量详情');
    await expect(page.locator('.order-reference')).toContainText(orderId);
    await expect(page.locator('.measurement-status')).toContainText('已安排');
  });

  test('执行测量并提交结果', async ({ page }) => {
    // 导航到测量详情页面
    await page.goto(`/measurements/${measurementId}`);
    
    // 点击开始测量按钮
    await page.click('button:has-text("开始测量")');
    
    // 验证测量状态更新
    await expect(page.locator('.measurement-status')).toContainText('进行中');
    
    // 填写测量结果
    await page.fill('input[name="length"]', faker.number.float({ min: 10, max: 50, fractionDigits: 1 }).toString());
    await page.fill('input[name="width"]', faker.number.float({ min: 5, max: 30, fractionDigits: 1 }).toString());
    await page.fill('input[name="height"]', faker.number.float({ min: 2, max: 10, fractionDigits: 1 }).toString());
    await page.fill('input[name="area"]', faker.number.float({ min: 50, max: 500, fractionDigits: 0 }).toString());
    await page.fill('textarea[name="measurementResults"]', faker.lorem.paragraph());
    
    // 添加测量照片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'measurement-1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test image content')
    });
    
    // 提交测量结果
    await page.click('button:has-text("完成测量")');
    
    // 验证测量完成
    await expect(page.locator('.measurement-status')).toContainText('已完成');
    await expect(page.locator('.measurement-results')).toContainText('测量结果');
  });

  test('审核测量结果', async ({ page }) => {
    // 导航到测量详情页面
    await page.goto(`/measurements/${measurementId}`);
    
    // 点击审核按钮
    await page.click('button:has-text("审核测量")');
    
    // 填写审核表单
    await page.selectOption('select[name="approvalStatus"]', 'approved');
    await page.fill('textarea[name="approvalNotes"]', '测量结果符合要求，同意通过');
    
    // 提交审核
    await page.click('button:has-text("提交审核")');
    
    // 验证审核通过
    await expect(page.locator('.measurement-status')).toContainText('已审核');
    await expect(page.locator('.approval-status')).toContainText('已通过');
  });

  test('更新订单状态为测量完成', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 验证订单已关联测量
    await expect(page.locator('.measurement-link')).toHaveCount(1);
    await expect(page.locator('.measurement-link')).toHaveAttribute('href', `/measurements/${measurementId}`);
    
    // 更新订单状态为测量完成
    await page.selectOption('select[name="orderStatus"]', 'measurement_completed');
    await page.click('button:has-text("更新状态")');
    
    // 验证订单状态更新成功
    await expect(page.locator('.order-status')).toContainText('测量完成');
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.goto('/dashboard');
    await page.click('button:has-text("登出")');
    await expect(page).toHaveURL('/login');
  });
});
