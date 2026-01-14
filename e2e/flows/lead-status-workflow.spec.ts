import { test, expect } from '@playwright/test';

test.describe('Lead Status Workflow', () => {
    let leadId: string;
    let leadNo: string;

    test.beforeEach(async ({ page }) => {
        // 导航到线索列表页面
        await page.goto('/leads');
    });

    test('should create a new lead', async ({ page }) => {
        // 点击「录入线索」按钮
        await page.click('text=录入线索');
        
        // 填写线索表单
        await page.fill('[data-testid="lead-name-input"]', '测试客户');
        await page.fill('[data-testid="lead-phone-input"]', `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
        
        // 选择来源大类
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        
        // 选择具体渠道
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        
        // 填写来源备注
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '微信公众号');
        
        // 选择意向等级
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        
        // 点击「立即创建」按钮
        await page.click('[data-testid="submit-lead-btn"]');
        
        // 验证线索创建成功
        await expect(page.locator('.toast-success')).toContainText('线索创建成功');
        
        // 获取线索编号和ID
        leadNo = await page.locator('.font-medium').first().innerText();
        const leadRow = page.locator(`text=${leadNo}`).locator('..').locator('..');
        const leadLink = await leadRow.locator('a').getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';
        
        expect(leadId).not.toBe('');
    });

    test('should assign a lead to a sales person', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「分配」按钮
        await page.click('button[title="分配"]');
        
        // 选择销售
        await page.click('.absolute > .peer');
        await page.click('text=销售1');
        
        // 点击「确认分配」按钮
        await page.click('text=确认分配');
        
        // 验证线索分配成功
        await expect(page.locator('.toast-success')).toContainText('线索已分配');
        
        // 验证线索状态变为「待跟进」
        await expect(page.locator('.inline-flex')).toContainText('待跟进');
    });

    test('should start following a lead', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「开始跟进」按钮
        await page.click('button[title="开始跟进"]');
        
        // 验证线索跟进开始
        await expect(page.locator('.toast-success')).toContainText('已开始跟进');
        
        // 验证线索状态变为「跟进中」
        await expect(page.locator('.inline-flex')).toContainText('跟进中');
    });

    test('should add a followup record', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「添加跟进」按钮
        await page.click('text=添加跟进');
        
        // 填写跟进内容
        await page.fill('textarea[placeholder="请输入跟进内容..."]', '测试跟进内容');
        
        // 选择跟进结果
        await page.click('.relative > .peer');
        await page.click('text=意向明确');
        
        // 点击「保存」按钮
        await page.click('text=保存');
        
        // 验证跟进记录添加成功
        await expect(page.locator('.toast-success')).toContainText('跟进记录已添加');
        
        // 验证跟进记录显示在列表中
        await expect(page.locator('.space-y-4')).toContainText('测试跟进内容');
    });

    test('should mark a lead as won', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「快速报价」按钮
        await page.click('text=快速报价');
        
        // 填写报价信息
        await page.fill('input[placeholder="请输入报价名称"]', '测试报价');
        
        // 选择产品类型
        await page.click('.relative > .peer');
        await page.click('text=窗帘');
        
        // 点击「下一步」按钮
        await page.click('text=下一步');
        
        // 填写产品详情（简化版）
        await page.fill('input[placeholder="产品名称"]', '测试窗帘');
        await page.fill('input[placeholder="宽度 (mm)"]', '2000');
        await page.fill('input[placeholder="高度 (mm)"]', '2500');
        
        // 点击「保存」按钮
        await page.click('text=保存');
        
        // 验证报价创建成功
        await expect(page.locator('.toast-success')).toContainText('报价创建成功');
        
        // 返回到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 验证线索状态变为「已成交」
        await expect(page.locator('.inline-flex')).toContainText('已成交');
    });

    test('should void a lead', async ({ page }) => {
        // 导航到线索列表页面
        await page.goto('/leads');
        
        // 创建一个新的测试线索用于作废
        await page.click('text=录入线索');
        await page.fill('[data-testid="lead-name-input"]', '作废测试客户');
        await page.fill('[data-testid="lead-phone-input"]', `13800139${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        await page.fill('input[placeholder="例如：具体活动名称/推荐人"]', '微信公众号');
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        await page.click('[data-testid="submit-lead-btn"]');
        
        await expect(page.locator('.toast-success')).toContainText('线索创建成功');
        
        // 获取新创建的线索ID
        const newLeadNo = await page.locator('.font-medium').first().innerText();
        const newLeadRow = page.locator(`text=${newLeadNo}`).locator('..').locator('..');
        const newLeadLink = await newLeadRow.locator('a').getAttribute('href');
        const newLeadId = newLeadLink?.split('/').pop() || '';
        
        // 导航到新线索的详情页面
        await page.goto(`/leads/${newLeadId}`);
        
        // 点击「标记作废」按钮
        await page.click('text=标记作废');
        
        // 填写作废原因
        await page.fill('textarea[placeholder="请填写作废原因"]', '测试作废原因');
        
        // 点击「确认作废」按钮
        await page.click('text=确认');
        
        // 验证线索作废成功
        await expect(page.locator('.toast-success')).toContainText('线索已标记为无效');
        
        // 验证线索状态变为「已作废」
        await expect(page.locator('.inline-flex')).toContainText('已作废');
    });

    test('should filter leads by status', async ({ page }) => {
        // 验证状态筛选功能
        await page.click('text=待分配');
        await expect(page.url()).toContain('status=PENDING_DISPATCH');
        
        await page.click('text=待跟进');
        await expect(page.url()).toContain('status=PENDING_FOLLOWUP');
        
        await page.click('text=跟进中');
        await expect(page.url()).toContain('status=FOLLOWING');
        
        await page.click('text=已成交');
        await expect(page.url()).toContain('status=WON');
        
        await page.click('text=已作废');
        await expect(page.url()).toContain('status=VOID');
        
        await page.click('text=全部');
        await expect(page.url()).toContain('status=ALL');
    });
});
