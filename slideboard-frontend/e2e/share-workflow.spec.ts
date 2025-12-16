import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';

test.describe('分享工作流测试', () => {
  let shareLink: string;
  let leadId: string;
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

  test('创建测试线索用于分享', async ({ page }) => {
    // 导航到线索列表页面
    await page.goto('/leads');
    
    // 点击创建线索按钮
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
    
    // 获取线索ID
    leadId = page.url().split('/').pop() || '';
    expect(leadId).toBeTruthy();
  });

  test('生成线索分享链接', async ({ page }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 点击分享按钮
    await page.click('button:has-text("分享")');
    
    // 验证分享模态框显示
    await expect(page.locator('.share-modal')).toBeVisible();
    
    // 选择分享类型（公开分享）
    await page.click('input[name="shareType"][value="public"]');
    
    // 设置分享有效期
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7天后
    await page.fill('input[name="expirationDate"]', expirationDate);
    
    // 生成分享链接
    await page.click('button:has-text("生成分享链接")');
    
    // 验证分享链接生成成功
    await expect(page.locator('.share-link')).toBeVisible();
    shareLink = await page.locator('.share-link input').inputValue();
    expect(shareLink).toMatch(/^https?:\/\//);
    expect(shareLink).toContain('/share/');
    
    // 复制分享链接
    await page.click('button:has-text("复制链接")');
    await expect(page.locator('.success-message')).toContainText('链接已复制到剪贴板');
  });

  test('通过分享链接访问线索详情', async ({ page, browser }) => {
    // 使用新的浏览器上下文访问分享链接（模拟外部用户）
    const context = await browser.newContext();
    const externalPage = await context.newPage();
    
    try {
      // 访问分享链接
      await externalPage.goto(shareLink);
      
      // 验证分享页面加载成功
      await expect(externalPage).toHaveURL(/\/share\/[a-f0-9-]+/);
      await expect(externalPage.locator('h1')).toContainText('分享详情');
      
      // 验证分享内容显示正确
      await expect(externalPage.locator('.share-content')).toBeVisible();
      await expect(externalPage.locator('.share-entity-type')).toContainText('线索');
      
      // 验证外部用户无法编辑内容
      await expect(externalPage.locator('button:has-text("编辑")')).not.toBeVisible();
      await expect(externalPage.locator('input, textarea, select')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('验证分享链接有效期', async ({ page, browser }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 重新生成一个有效期为1天的分享链接
    await page.click('button:has-text("分享")');
    await page.click('input[name="shareType"][value="public"]');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.fill('input[name="expirationDate"]', tomorrow);
    await page.click('button:has-text("生成分享链接")');
    const newShareLink = await page.locator('.share-link input').inputValue();
    
    // 验证新分享链接生成
    expect(newShareLink).toMatch(/^https?:\/\//);
    
    // 使用新浏览器上下文访问
    const context = await browser.newContext();
    const externalPage = await context.newPage();
    
    try {
      await externalPage.goto(newShareLink);
      await expect(externalPage.locator('h1')).toContainText('分享详情');
    } finally {
      await context.close();
    }
  });

  test('测试带密码保护的分享链接', async ({ page, browser }) => {
    // 导航到线索详情页面
    await page.goto(`/leads/${leadId}`);
    
    // 生成带密码保护的分享链接
    await page.click('button:has-text("分享")');
    await page.click('input[name="shareType"][value="password_protected"]');
    const sharePassword = 'TestShare123!';
    await page.fill('input[name="sharePassword"]', sharePassword);
    await page.click('button:has-text("生成分享链接")');
    const passwordProtectedLink = await page.locator('.share-link input').inputValue();
    
    // 使用新浏览器上下文访问
    const context = await browser.newContext();
    const externalPage = await context.newPage();
    
    try {
      await externalPage.goto(passwordProtectedLink);
      
      // 验证需要输入密码
      await expect(externalPage.locator('.password-protected-share')).toBeVisible();
      await expect(externalPage.locator('input[name="password"]')).toBeVisible();
      
      // 输入错误密码
      await externalPage.fill('input[name="password"]', 'WrongPassword!');
      await externalPage.click('button:has-text("访问")');
      await expect(externalPage.locator('.error-message')).toContainText('密码错误');
      
      // 输入正确密码
      await externalPage.fill('input[name="password"]', sharePassword);
      await externalPage.click('button:has-text("访问")');
      
      // 验证成功访问
      await expect(externalPage.locator('h1')).toContainText('分享详情');
    } finally {
      await context.close();
    }
  });

  test('管理分享链接列表', async ({ page }) => {
    // 导航到分享管理页面
    await page.goto('/share/manage');
    
    // 验证分享链接列表显示
    await expect(page).toHaveURL(/\/share\/manage/);
    await expect(page.locator('.share-links-list')).toBeVisible();
    
    // 验证分享链接包含必要信息
    const firstShareLinkItem = page.locator('.share-link-item').first();
    await expect(firstShareLinkItem).toHaveText(/线索/);
    await expect(firstShareLinkItem).toHaveText(/\d{4}-\d{2}-\d{2}/);
    await expect(firstShareLinkItem).toHaveText(/(公开|密码保护)/);
    
    // 测试禁用分享链接
    await firstShareLinkItem.locator('button:has-text("禁用")').click();
    await expect(page.locator('.success-message')).toContainText('分享链接已禁用');
  });

  test.afterAll(async ({ page }) => {
    // 登出
    await page.click('.user-profile-button');
    await page.click('text=登出');
    await expect(page).toHaveURL('/login');
  });
});
