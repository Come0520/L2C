import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';

test.describe('安装到对账流程', () => {
  let installationId: string;
  let orderId: string;
  let reconciliationId: string;
  const testEmail = 'test-accountant@example.com';
  const testPassword = 'Test1234!';

  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login');
    
    // 登录为财务人员
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
  });

  test('创建测试安装记录', async ({ page }) => {
    // 导航到安装列表页面
    await page.goto('/installations');
    
    // 点击创建安装按钮
    await page.click('button:has-text("创建安装")');
    
    // 填写安装表单
    const customerName = faker.person.fullName();
    
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', faker.phone.number());
    await page.fill('input[name="projectAddress"]', faker.location.streetAddress() + ', ' + faker.location.city());
    await page.fill('input[name="installationDate"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="installationTeamId"]', 'team-1');
    await page.selectOption('select[name="installationStatus"]', 'completed');
    await page.selectOption('select[name="acceptanceStatus"]', 'accepted');
    await page.fill('textarea[name="installationNotes"]', faker.lorem.paragraph());
    
    // 保存安装记录
    await page.click('button:has-text("保存安装")');
    
    // 验证安装记录创建成功
    await expect(page).toHaveURL(/\/installations\/[a-f0-9-]+/);
    
    // 获取安装ID
    installationId = page.url().split('/').pop() || '';
    expect(installationId).toBeTruthy();
  });

  test('从安装创建对账记录', async ({ page }) => {
    // 导航到安装详情页面
    await page.goto(`/installations/${installationId}`);
    
    // 点击创建对账按钮
    await page.click('button:has-text("创建对账")');
    
    // 填写对账表单
    const reconciliationNumber = faker.string.alphanumeric(10).toUpperCase();
    const totalAmount = faker.number.float({ min: 5000, max: 1000000, fractionDigits: 0 });
    
    await page.fill('input[name="reconciliationNumber"]', reconciliationNumber);
    await page.fill('input[name="reconciliationDate"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="totalAmount"]', totalAmount.toString());
    await page.fill('input[name="paidAmount"]', totalAmount.toString());
    await page.selectOption('select[name="paymentStatus"]', 'paid');
    await page.selectOption('select[name="paymentMethod"]', 'bank_transfer');
    await page.fill('input[name="transactionNumber"]', faker.string.alphanumeric(20).toUpperCase());
    await page.fill('textarea[name="reconciliationNotes"]', faker.lorem.paragraph());
    
    // 保存对账记录
    await page.click('button:has-text("创建对账")');
    
    // 验证对账记录创建成功
    await expect(page).toHaveURL(/\/reconciliations\/[a-f0-9-]+/);
    
    // 获取对账ID
    reconciliationId = page.url().split('/').pop() || '';
    expect(reconciliationId).toBeTruthy();
  });

  test('审核对账记录', async ({ page }) => {
    // 导航到对账详情页面
    await page.goto(`/reconciliations/${reconciliationId}`);
    
    // 点击审核按钮
    await page.click('button:has-text("审核对账")');
    
    // 填写审核表单
    await page.selectOption('select[name="approvalStatus"]', 'approved');
    await page.fill('textarea[name="approvalNotes"]', '对账记录审核通过，金额准确');
    
    // 提交审核
    await page.click('button:has-text("提交审核")');
    
    // 验证审核成功
    await expect(page.locator('.reconciliation-status')).toContainText('已审核');
    await expect(page.locator('.approval-status')).toContainText('已通过');
  });

  test('完成对账结算', async ({ page }) => {
    // 导航到对账详情页面
    await page.goto(`/reconciliations/${reconciliationId}`);
    
    // 点击完成结算按钮
    await page.click('button:has-text("完成结算")');
    
    // 填写结算表单
    await page.fill('input[name="settlementDate"]', new Date().toISOString().split('T')[0]);
    await page.fill('textarea[name="settlementNotes"]', '对账结算完成，财务流程已闭环');
    
    // 提交结算
    await page.click('button:has-text("确认结算")');
    
    // 验证结算成功
    await expect(page.locator('.reconciliation-status')).toContainText('已结算');
    await expect(page.locator('.settlement-status')).toContainText('已完成');
  });

  test('更新订单状态为已完成', async ({ page }) => {
    // 从对账记录获取订单ID
    await page.goto(`/reconciliations/${reconciliationId}`);
    const orderLink = await page.locator('.order-reference a').getAttribute('href');
    expect(orderLink).toBeTruthy();
    orderId = orderLink?.split('/').pop() || '';
    expect(orderId).toBeTruthy();
    
    // 导航到订单详情页面
    await page.goto(`/orders/${orderId}`);
    
    // 更新订单状态为已完成
    await page.selectOption('select[name="orderStatus"]', 'completed');
    await page.click('button:has-text("更新状态")');
    
    // 验证订单状态更新成功
    await expect(page.locator('.order-status')).toContainText('已完成');
    
    // 验证订单已关联对账
    await expect(page.locator('.reconciliation-link')).toHaveCount(1);
    await expect(page.locator('.reconciliation-link')).toHaveAttribute('href', `/reconciliations/${reconciliationId}`);
  });

  test('生成财务报表', async ({ page }) => {
    // 导航到财务报表页面
    await page.goto('/reports/finance');
    
    // 设置报表日期范围
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', endDate);
    await page.click('button:has-text("生成报表")');
    
    // 验证报表生成成功
    await expect(page.locator('.report-title')).toContainText('财务报表');
    await expect(page.locator('.report-data')).toBeVisible();
    
    // 验证报表包含测试数据
    await expect(page.locator('.report-row')).toHaveCount(expect.above(0));
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.goto('/dashboard');
    await page.click('button:has-text("登出")');
    await expect(page).toHaveURL('/login');
  });
});
