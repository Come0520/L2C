import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';

test.describe('积分系统测试', () => {
  let userId: string;
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

  test('查看积分余额', async ({ page }) => {
    // 导航到积分页面
    await page.click('.user-profile-button');
    await page.click('text=我的积分');
    
    // 验证积分页面加载成功
    await expect(page).toHaveURL(/\/points/);
    await expect(page.locator('h1')).toContainText('我的积分');
    
    // 验证积分余额显示
    await expect(page.locator('.points-balance')).toBeVisible();
    const balanceText = await page.locator('.points-balance').textContent();
    expect(balanceText).toMatch(/\d+/);
  });

  test('获取积分历史记录', async ({ page }) => {
    // 导航到积分页面
    await page.goto('/points');
    
    // 验证积分历史记录显示
    await expect(page.locator('.points-history')).toBeVisible();
    await expect(page.locator('.points-history-item')).toHaveCount(expect.above(0));
    
    // 验证积分历史包含必要信息
    const firstHistoryItem = page.locator('.points-history-item').first();
    await expect(firstHistoryItem).toHaveText(/(获得|使用|兑换)/);
    await expect(firstHistoryItem).toHaveText(/\d+积分/);
    await expect(firstHistoryItem).toHaveText(/\d{4}-\d{2}-\d{2}/);
  });

  test('通过创建线索获取积分', async ({ page }) => {
    // 导航到积分页面获取初始积分
    await page.goto('/points');
    const initialBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
    
    // 导航到线索页面创建线索
    await page.goto('/leads');
    await page.click('button:has-text("创建线索")');
    
    // 填写线索表单
    const customerName = faker.person.fullName();
    await page.fill('input[name="customerName"]', customerName);
    await page.fill('input[name="customerPhone"]', faker.phone.number());
    await page.fill('input[name="customerEmail"]', faker.internet.email());
    await page.fill('input[name="projectName"]', faker.company.name() + ' 项目');
    await page.fill('input[name="projectAddress"]', faker.location.streetAddress() + ', ' + faker.location.city());
    await page.click('button:has-text("保存")');
    
    // 验证线索创建成功
    await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/);
    
    // 返回积分页面验证积分增加
    await page.goto('/points');
    const newBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
    
    // 验证积分增加（假设创建线索获得10积分）
    expect(newBalance).toBeGreaterThan(initialBalance);
    expect(newBalance - initialBalance).toBe(10);
    
    // 验证积分历史记录更新
    await expect(page.locator('.points-history-item').first()).toContainText('创建线索获得10积分');
  });

  test('通过完成订单获取积分', async ({ page }) => {
    // 导航到积分页面获取初始积分
    await page.goto('/points');
    const initialBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
    
    // 导航到订单页面创建测试订单
    await page.goto('/orders');
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
    await page.selectOption('select[name="orderStatus"]', 'completed');
    await page.click('button:has-text("创建订单")');
    
    // 验证订单创建成功
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
    
    // 返回积分页面验证积分增加
    await page.goto('/points');
    const newBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
    
    // 验证积分增加（假设完成订单获得50积分）
    expect(newBalance).toBeGreaterThan(initialBalance);
    expect(newBalance - initialBalance).toBe(50);
  });

  test('积分兑换测试', async ({ page }) => {
    // 导航到积分页面
    await page.goto('/points');
    
    // 验证积分兑换区域显示
    await expect(page.locator('.points-redemption')).toBeVisible();
    
    // 查看积分兑换选项
    await expect(page.locator('.redemption-item')).toHaveCount(expect.above(0));
    
    // 选择一个兑换选项（假设存在一个100积分兑换的礼品）
    const redemptionItems = page.locator('.redemption-item');
    const itemCount = await redemptionItems.count();
    
    for (let i = 0; i < itemCount; i++) {
      const item = redemptionItems.nth(i);
      const pointsText = await item.locator('.redemption-points').textContent();
      const points = parseInt(pointsText || '0');
      
      if (points > 0) {
        // 点击兑换按钮
        await item.locator('.redeem-button').click();
        
        // 确认兑换
        await page.click('button:has-text("确认兑换")');
        
        // 验证兑换成功
        await expect(page.locator('.success-message')).toContainText('兑换成功');
        
        // 验证积分减少
        const newBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
        const initialBalance = parseInt(await page.locator('.points-balance').textContent() || '0');
        expect(newBalance).toBeLessThanOrEqual(initialBalance - points);
        
        break;
      }
    }
  });

  test('积分使用记录查询', async ({ page }) => {
    // 导航到积分页面
    await page.goto('/points');
    
    // 点击使用记录标签
    await page.click('button:has-text("使用记录")');
    
    // 验证使用记录显示
    await expect(page.locator('.usage-history')).toBeVisible();
    
    // 点击获得记录标签
    await page.click('button:has-text("获得记录")');
    
    // 验证获得记录显示
    await expect(page.locator('.earn-history')).toBeVisible();
    
    // 点击兑换记录标签
    await page.click('button:has-text("兑换记录")');
    
    // 验证兑换记录显示
    await expect(page.locator('.redemption-history')).toBeVisible();
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.click('.user-profile-button');
    await page.click('text=登出');
    await expect(page).toHaveURL('/login');
  });
});
