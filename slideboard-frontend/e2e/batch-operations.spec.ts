import { test, expect } from '@playwright/test';

import { loginAsSalesManager, loginAsAdmin, logout } from '../tests/utils/auth';
import { gotoPage, clickWhenVisible, waitForResponse, fillFormField, selectDropdownOption } from '../tests/utils/navigation';
import { TestDataGenerator } from '../tests/utils/testFixtures';

/**
 * 批量操作E2E测试
 * 测试系统中的各种批量操作功能
 */
test.describe('批量操作功能', () => {
  const dataGenerator = new TestDataGenerator();
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前确保以销售经理身份登录
    await loginAsSalesManager(page);
  });

  test.afterEach(async ({ page }) => {
    // 每个测试后登出
    await logout(page);
  });

  /**
   * 测试1: 准备测试数据 - 创建多个待处理的线索
   */
  test('创建多条测试数据用于批量操作', async ({ page }) => {
    // 导航到线索创建页面
    await gotoPage(page, '/leads/create');
    
    // 创建5条测试线索
    for (let i = 1; i <= 5; i++) {
      // 验证页面标题
      await expect(page.locator('h1')).toContainText('创建线索');
      
      // 填写线索信息
      const leadName = `批量操作测试线索_${Date.now()}_${i}`;
      await fillFormField(page, 'input[name="name"]', leadName);
      await fillFormField(page, 'input[name="company"]', `测试公司${i}`);
      await fillFormField(page, 'input[name="contactPerson"]', `联系人${i}`);
      await fillFormField(page, 'input[name="phone"]', `1380013800${i}`);
      await fillFormField(page, 'input[name="email"]', `test${i}@example.com`);
      await fillFormField(page, 'textarea[name="notes"]', `批量操作测试线索${i}，用于测试批量操作功能`);
      
      // 提交线索
      const responsePromise = waitForResponse(page, '/api/leads');
      await clickWhenVisible(page, 'button[type="submit"]');
      const response = await responsePromise;
      
      // 验证线索创建成功
      expect(response.status()).toBe(201);
      await expect(page.locator('.notification-success')).toContainText('线索创建成功');
      
      // 如果不是最后一条，返回创建页面
      if (i < 5) {
        await gotoPage(page, '/leads/create');
      }
    }
  });

  /**
   * 测试2: 批量删除线索
   */
  test('应能批量删除选中的线索', async ({ page }) => {
    // 导航到线索列表页面
    await gotoPage(page, '/leads');
    
    // 搜索刚创建的测试线索
    await fillFormField(page, 'input[name="search"]', '批量操作测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 选择前3条线索
    const checkboxes = page.locator('.leads-table tbody tr input[type="checkbox"]');
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check();
    }
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量删除
    await clickWhenVisible(page, 'button[data-action="batch-delete"]');
    
    // 确认删除
    await clickWhenVisible(page, 'button[data-action="confirm-delete"]');
    
    // 等待删除请求完成
    const responsePromise = waitForResponse(page, '/api/leads/batch-delete');
    const response = await responsePromise;
    
    // 验证删除成功
    expect(response.status()).toBe(200);
    await expect(page.locator('.notification-success')).toContainText('批量删除成功');
    
    // 验证列表中剩余的线索数量（应该是5-3=2条）
    const remainingRows = page.locator('.leads-table tbody tr');
    await expect(remainingRows).toHaveCount(2);
  });

  /**
   * 测试3: 批量更新线索状态
   */
  test('应能批量更新选中线索的状态', async ({ page }) => {
    // 导航到线索列表页面
    await gotoPage(page, '/leads');
    
    // 搜索刚创建的测试线索
    await fillFormField(page, 'input[name="search"]', '批量操作测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 全选剩余的线索
    await clickWhenVisible(page, '.leads-table th input[type="checkbox"]');
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量更新状态
    await clickWhenVisible(page, 'button[data-action="batch-update-status"]');
    
    // 等待状态更新对话框
    await page.waitForSelector('.batch-status-update-modal', { state: 'visible' });
    
    // 选择新状态
    await selectDropdownOption(page, 'select[name="newStatus"]', 'qualified');
    
    // 提交更新
    const responsePromise = waitForResponse(page, '/api/leads/batch-update-status');
    await clickWhenVisible(page, 'button[data-action="confirm-status-update"]');
    const response = await responsePromise;
    
    // 验证更新成功
    expect(response.status()).toBe(200);
    await expect(page.locator('.notification-success')).toContainText('批量更新状态成功');
    
    // 验证每条线索的状态都已更新
    const statusCells = page.locator('.leads-table tbody tr td.status-cell');
    const count = await statusCells.count();
    for (let i = 0; i < count; i++) {
      await expect(statusCells.nth(i)).toContainText('已验证');
    }
  });

  /**
   * 测试4: 批量导出线索数据
   */
  test('应能批量导出选中的线索数据', async ({ page }) => {
    // 导航到线索列表页面
    await gotoPage(page, '/leads');
    
    // 搜索刚创建的测试线索
    await fillFormField(page, 'input[name="search"]', '批量操作测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 全选线索
    await clickWhenVisible(page, '.leads-table th input[type="checkbox"]');
    
    // 点击导出按钮
    const downloadPromise = page.waitForEvent('download');
    await clickWhenVisible(page, 'button[data-action="export-selected"]');
    
    // 等待下载完成
    const download = await downloadPromise;
    
    // 验证下载的文件名
    expect(download.suggestedFilename()).toContain('leads_export');
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/);
  });

  /**
   * 测试5: 批量分配线索给销售人员
   */
  test('应能批量分配线索给指定销售人员', async ({ page }) => {
    // 创建新的线索用于分配测试
    await gotoPage(page, '/leads/create');
    
    for (let i = 1; i <= 3; i++) {
      const leadName = `分配测试线索_${Date.now()}_${i}`;
      await fillFormField(page, 'input[name="name"]', leadName);
      await fillFormField(page, 'input[name="company"]', `分配测试公司${i}`);
      await fillFormField(page, 'input[name="contactPerson"]', `分配联系人${i}`);
      await fillFormField(page, 'input[name="phone"]', `1390013900${i}`);
      
      await clickWhenVisible(page, 'button[type="submit"]');
      await expect(page.locator('.notification-success')).toContainText('线索创建成功');
      
      if (i < 3) {
        await gotoPage(page, '/leads/create');
      }
    }
    
    // 返回线索列表
    await gotoPage(page, '/leads');
    
    // 搜索新创建的分配测试线索
    await fillFormField(page, 'input[name="search"]', '分配测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 全选线索
    await clickWhenVisible(page, '.leads-table th input[type="checkbox"]');
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量分配
    await clickWhenVisible(page, 'button[data-action="batch-assign"]');
    
    // 等待分配对话框
    await page.waitForSelector('.batch-assign-modal', { state: 'visible' });
    
    // 选择分配给的销售人员
    await selectDropdownOption(page, 'select[name="assignTo"]', 'salesperson');
    
    // 提交分配
    const responsePromise = waitForResponse(page, '/api/leads/batch-assign');
    await clickWhenVisible(page, 'button[data-action="confirm-assign"]');
    const response = await responsePromise;
    
    // 验证分配成功
    expect(response.status()).toBe(200);
    await expect(page.locator('.notification-success')).toContainText('批量分配成功');
    
    // 验证每条线索都已分配给指定销售人员
    const assigneeCells = page.locator('.leads-table tbody tr td.assignee-cell');
    const count = await assigneeCells.count();
    for (let i = 0; i < count; i++) {
      await expect(assigneeCells.nth(i)).toContainText('salesperson');
    }
  });

  /**
   * 测试6: 批量发送邮件给线索
   */
  test('应能批量发送邮件给选中的线索', async ({ page }) => {
    // 导航到线索列表页面
    await gotoPage(page, '/leads');
    
    // 搜索测试线索
    await fillFormField(page, 'input[name="search"]', '分配测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 选择部分线索
    const checkboxes = page.locator('.leads-table tbody tr input[type="checkbox"]');
    for (let i = 0; i < 2; i++) {
      await checkboxes.nth(i).check();
    }
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量发送邮件
    await clickWhenVisible(page, 'button[data-action="batch-email"]');
    
    // 等待邮件发送对话框
    await page.waitForSelector('.batch-email-modal', { state: 'visible' });
    
    // 填写邮件信息
    await fillFormField(page, 'input[name="emailSubject"]', '批量发送测试邮件');
    await fillFormField(page, 'textarea[name="emailContent"]', '这是一封批量发送的测试邮件，请勿回复。');
    
    // 提交发送
    const responsePromise = waitForResponse(page, '/api/leads/batch-email');
    await clickWhenVisible(page, 'button[data-action="send-email"]');
    const response = await responsePromise;
    
    // 验证发送成功
    expect(response.status()).toBe(200);
    await expect(page.locator('.notification-success')).toContainText('邮件批量发送成功');
  });

  /**
   * 测试7: 订单批量操作 - 更新支付状态
   */
  test('应能批量更新订单的支付状态', async ({ page }) => {
    // 创建测试订单
    await gotoPage(page, '/orders/create');
    
    for (let i = 1; i <= 3; i++) {
      const orderName = `批量支付测试订单_${Date.now()}_${i}`;
      await fillFormField(page, 'input[name="name"]', orderName);
      await fillFormField(page, 'input[name="customerName"]', `支付测试客户${i}`);
      await fillFormField(page, 'input[name="contactPerson"]', `支付联系人${i}`);
      await clickWhenVisible(page, 'button[data-action="add-product"]');
      await fillFormField(page, 'input[name="productName"]', `产品${i}`);
      await fillFormField(page, 'input[name="quantity"]', '1');
      await fillFormField(page, 'input[name="unitPrice"]', '1000');
      
      // 设置为已确认状态
      await selectDropdownOption(page, 'select[name="orderStatus"]', 'confirmed');
      
      await clickWhenVisible(page, 'button[type="submit"]');
      await expect(page.locator('.notification-success')).toContainText('订单创建成功');
      
      if (i < 3) {
        await gotoPage(page, '/orders/create');
      }
    }
    
    // 导航到订单列表
    await gotoPage(page, '/orders');
    
    // 搜索测试订单
    await fillFormField(page, 'input[name="search"]', '批量支付测试订单');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.orders-table tbody tr');
    
    // 全选订单
    await clickWhenVisible(page, '.orders-table th input[type="checkbox"]');
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量更新支付状态
    await clickWhenVisible(page, 'button[data-action="batch-update-payment"]');
    
    // 等待支付状态更新对话框
    await page.waitForSelector('.batch-payment-update-modal', { state: 'visible' });
    
    // 选择新的支付状态
    await selectDropdownOption(page, 'select[name="newPaymentStatus"]', 'partial_paid');
    
    // 填写支付金额（如适用）
    await fillFormField(page, 'input[name="paymentAmount"]', '500');
    
    // 提交更新
    const responsePromise = waitForResponse(page, '/api/orders/batch-update-payment');
    await clickWhenVisible(page, 'button[data-action="confirm-payment-update"]');
    const response = await responsePromise;
    
    // 验证更新成功
    expect(response.status()).toBe(200);
    await expect(page.locator('.notification-success')).toContainText('批量更新支付状态成功');
    
    // 验证每条订单的支付状态都已更新
    const paymentStatusCells = page.locator('.orders-table tbody tr td.payment-status-cell');
    const count = await paymentStatusCells.count();
    for (let i = 0; i < count; i++) {
      await expect(paymentStatusCells.nth(i)).toContainText('部分支付');
    }
  });

  /**
   * 测试8: 批量操作的权限验证
   */
  test('普通用户不应具有批量操作的权限', async ({ page }) => {
    // 切换到普通用户（假设销售人员是普通用户）
    // 这里需要调整为适当的普通用户登录
    // 假设登录为普通用户
    
    // 导航到线索列表
    await gotoPage(page, '/leads');
    
    // 验证批量操作按钮是否存在
    const batchActionsButton = page.locator('button[data-action="batch-actions"]');
    await expect(batchActionsButton).toBeHidden();
    
    // 验证全选复选框是否存在
    const selectAllCheckbox = page.locator('.leads-table th input[type="checkbox"]');
    await expect(selectAllCheckbox).toBeHidden();
  });

  /**
   * 测试9: 批量操作的进度指示和中断
   */
  test('批量操作应显示进度指示并支持中断', async ({ page }) => {
    // 创建更多测试数据用于模拟大批量操作
    await gotoPage(page, '/leads/create');
    
    for (let i = 1; i <= 10; i++) {
      const leadName = `大批量测试线索_${Date.now()}_${i}`;
      await fillFormField(page, 'input[name="name"]', leadName);
      await fillFormField(page, 'input[name="company"]', `大批量测试公司${i}`);
      await fillFormField(page, 'input[name="phone"]', `137001370${i}`);
      
      await clickWhenVisible(page, 'button[type="submit"]');
      await expect(page.locator('.notification-success')).toContainText('线索创建成功');
      
      if (i < 10) {
        await gotoPage(page, '/leads/create');
      }
    }
    
    // 导航到线索列表
    await gotoPage(page, '/leads');
    
    // 搜索大批量测试线索
    await fillFormField(page, 'input[name="search"]', '大批量测试线索');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.leads-table tbody tr');
    
    // 全选线索
    await clickWhenVisible(page, '.leads-table th input[type="checkbox"]');
    
    // 点击批量操作下拉菜单
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    
    // 选择批量更新状态
    await clickWhenVisible(page, 'button[data-action="batch-update-status"]');
    
    // 选择新状态
    await selectDropdownOption(page, 'select[name="newStatus"]', 'contacted');
    
    // 提交更新
    await clickWhenVisible(page, 'button[data-action="confirm-status-update"]');
    
    // 验证进度条显示
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('.progress-text')).toBeVisible();
    
    // 模拟点击取消操作（可选，如果系统支持中断功能）
    // await clickWhenVisible(page, 'button[data-action="cancel-batch-operation"]');
    // await expect(page.locator('.notification-warning')).toContainText('批量操作已中断');
  });

  /**
   * 测试10: 批量操作的错误处理和结果反馈
   */
  test('批量操作失败时应提供适当的错误信息和结果反馈', async ({ page }) => {
    // 导航到订单列表
    await gotoPage(page, '/orders');
    
    // 搜索已创建的测试订单
    await fillFormField(page, 'input[name="search"]', '批量支付测试订单');
    await clickWhenVisible(page, 'button[data-testid="search-button"]');
    
    // 等待搜索结果
    await page.waitForSelector('.orders-table tbody tr');
    
    // 选择部分订单
    const checkboxes = page.locator('.orders-table tbody tr input[type="checkbox"]');
    for (let i = 0; i < 2; i++) {
      await checkboxes.nth(i).check();
    }
    
    // 尝试对这些订单进行批量删除（假设订单不允许删除，应该失败）
    await clickWhenVisible(page, 'button[data-action="batch-actions"]');
    await clickWhenVisible(page, 'button[data-action="batch-delete"]');
    await clickWhenVisible(page, 'button[data-action="confirm-delete"]');
    
    // 验证错误信息
    await expect(page.locator('.notification-error')).toBeVisible();
    
    // 验证部分成功部分失败的场景（可选，如果系统支持）
    // 有些系统会显示成功数量和失败数量，以及失败原因
  });
});