import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('测量到安装流程', () => {
  let measurementId: string;
  let orderId: string;
  let installationId: string;
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

  test('创建测试测量记录', async ({ page }) => {
    // 导航到测量列表页面
    await page.goto('/measurements');
    
    // 点击创建测量按钮
    await page.click('button:has-text("创建测量")');
    
    // 填写测量表单
    const customerName = faker.person.fullName();
    
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', faker.phone.number());
    await page.fill('input[name="projectAddress"]', faker.location.streetAddress() + ', ' + faker.location.city());
    await page.fill('input[name="measurementDate"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="technicianId"]', 'technician-1');
    await page.selectOption('select[name="measurementStatus"]', 'completed');
    
    // 填写测量结果
    await page.fill('input[name="length"]', faker.number.float({ min: 10, max: 50, precision: 0.1 }).toString());
    await page.fill('input[name="width"]', faker.number.float({ min: 5, max: 30, precision: 0.1 }).toString());
    await page.fill('input[name="height"]', faker.number.float({ min: 2, max: 10, precision: 0.1 }).toString());
    await page.fill('input[name="area"]', faker.number.float({ min: 50, max: 500, precision: 1 }).toString());
    await page.fill('textarea[name="measurementNotes"]', faker.lorem.paragraph());
    
    // 保存测量记录
    await page.click('button:has-text("保存测量")');
    
    // 验证测量记录创建成功
    await expect(page).toHaveURL(/\/measurements\/[a-f0-9-]+/);
    
    // 获取测量ID
    measurementId = page.url().split('/').pop() || '';
    expect(measurementId).toBeTruthy();
  });

  test('从测量创建生产订单', async ({ page }) => {
    // 导航到测量详情页面
    await page.goto(`/measurements/${measurementId}`);
    
    // 点击创建生产订单按钮
    await page.click('button:has-text("创建生产订单")');
    
    // 填写生产订单表单
    const orderNumber = faker.string.alphanumeric(12).toUpperCase();
    
    await page.fill('input[name="orderNumber"]', orderNumber);
    await page.fill('input[name="orderDate"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="orderStatus"]', 'production');
    await page.fill('textarea[name="orderNotes"]', '从测量结果创建的生产订单');
    
    // 保存生产订单
    await page.click('button:has-text("创建订单")');
    
    // 验证生产订单创建成功
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    
    // 获取订单ID
    orderId = page.url().split('/').pop() || '';
    expect(orderId).toBeTruthy();
  });

  test('更新订单状态为生产完成', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 更新订单状态为生产完成
    await page.selectOption('select[name="orderStatus"]', 'production_completed');
    await page.click('button:has-text("更新状态")');
    
    // 验证状态更新成功
    await expect(page.locator('.order-status')).toContainText('生产完成');
  });

  test('安排安装任务', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 点击安排安装按钮
    await page.click('button:has-text("安排安装")');
    
    // 填写安装安排表单
    const installationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14天后
    const installationTime = '09:00';
    
    await page.fill('input[name="installationDate"]', installationDate);
    await page.fill('input[name="installationTime"]', installationTime);
    await page.selectOption('select[name="installationTeamId"]', 'team-1');
    await page.fill('textarea[name="installationNotes"]', '请携带安装工具，客户要求提前15分钟到达');
    
    // 保存安装安排
    await page.click('button:has-text("保存安排")');
    
    // 验证安装安排成功
    await expect(page.locator('.installation-status')).toContainText('已安排');
    await expect(page.locator('.installation-date')).toContainText(installationDate);
    
    // 获取安装ID
    const installationLink = await page.locator('.installation-link').getAttribute('href');
    expect(installationLink).toBeTruthy();
    installationId = installationLink?.split('/').pop() || '';
    expect(installationId).toBeTruthy();
  });

  test('执行安装', async ({ page }) => {
    // 导航到安装详情页面
    await page.goto(`/installations/${installationId}`);
    
    // 点击开始安装按钮
    await page.click('button:has-text("开始安装")');
    
    // 验证安装状态更新
    await expect(page.locator('.installation-status')).toContainText('进行中');
    
    // 填写安装执行记录
    await page.fill('textarea[name="installationProgress"]', faker.lorem.paragraph());
    await page.selectOption('select[name="installationQuality"]', 'good');
    
    // 添加安装照片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'installation-1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test image content')
    });
    
    // 完成安装
    await page.click('button:has-text("完成安装")');
    
    // 验证安装完成
    await expect(page.locator('.installation-status')).toContainText('已完成');
  });

  test('验收安装结果', async ({ page }) => {
    // 导航到安装详情页面
    await page.goto(`/installations/${installationId}`);
    
    // 点击验收按钮
    await page.click('button:has-text("验收安装")');
    
    // 填写验收表单
    await page.selectOption('select[name="acceptanceStatus"]', 'accepted');
    await page.fill('textarea[name="acceptanceNotes"]', '安装质量符合要求，客户满意度高');
    await page.fill('input[name="acceptanceDate"]', new Date().toISOString().split('T')[0]);
    
    // 提交验收
    await page.click('button:has-text("提交验收")');
    
    // 验证验收成功
    await expect(page.locator('.installation-status')).toContainText('已验收');
    await expect(page.locator('.acceptance-status')).toContainText('已通过');
  });

  test('更新订单状态为安装完成', async ({ page }) => {
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 验证订单已关联安装
    await expect(page.locator('.installation-link')).toHaveCount(1);
    await expect(page.locator('.installation-link')).toHaveAttribute('href', `/installations/${installationId}`);
    
    // 更新订单状态为安装完成
    await page.selectOption('select[name="orderStatus"]', 'installed');
    await page.click('button:has-text("更新状态")');
    
    // 验证订单状态更新成功
    await expect(page.locator('.order-status')).toContainText('已安装');
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.goto('/dashboard');
    await page.click('button:has-text("登出")');
    await expect(page).toHaveURL('/login');
  });
});
