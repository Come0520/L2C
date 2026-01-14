import { test, expect } from '@playwright/test';

test.describe('Lead Measurement Service', () => {
    let leadId: string;
    let measureTaskId: string;

    test.beforeEach(async ({ page }) => {
        // 导航到线索列表页面
        await page.goto('/leads');
        
        // 创建一个新的线索用于测试测量服务
        await page.click('text=录入线索');
        
        // 填写线索表单
        const phoneNumber = `13800138${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        await page.fill('[data-testid="lead-name-input"]', '测量测试客户');
        await page.fill('[data-testid="lead-phone-input"]', phoneNumber);
        
        // 选择来源大类
        await page.click('.flex > .relative > .peer');
        await page.click('text=线上');
        
        // 选择具体渠道
        await page.click('.grid > .relative > .peer');
        await page.click('text=微信');
        
        // 选择意向等级
        await page.click('.grid > .grid-cols-2 > .relative > .peer');
        await page.click('text=高意向');
        
        // 点击「立即创建」按钮
        await page.click('[data-testid="submit-lead-btn"]');
        
        // 验证线索创建成功
        await expect(page.locator('.toast-success')).toContainText('线索创建成功');
        
        // 获取线索ID
        const leadLink = await page.locator('a').first().getAttribute('href');
        leadId = leadLink?.split('/').pop() || '';
        
        expect(leadId).not.toBe('');
    });

    test('should create a measure task for a lead', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「发起测量任务」按钮
        await page.click('text=发起测量任务');
        
        // 设置预约时间（明天）
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 16);
        await page.fill('input[type="datetime-local"]', tomorrowStr);
        
        // 填写备注
        await page.fill('textarea[placeholder="填写客户对测量的特殊要求或注意事项..."]', '测试测量任务备注');
        
        // 点击「确认创建」按钮
        await page.click('text=确认创建');
        
        // 验证测量任务创建成功
        await expect(page.locator('.toast-success')).toContainText('测量任务创建成功');
        
        // 获取测量任务ID
        const measureTaskRow = page.locator('text=测量服务').locator('..').locator('..').locator('..');
        const measureTaskLink = await measureTaskRow.locator('a').getAttribute('href');
        measureTaskId = measureTaskLink?.split('/').pop() || '';
        
        expect(measureTaskId).not.toBe('');
    });

    test('should assign a worker to a measure task', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击「指派师傅」按钮
        await page.click('text=指派师傅');
        
        // 选择测量师傅
        await page.click('.absolute > .peer');
        await page.click('text=测量师傅1');
        
        // 设置预约时间
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 16);
        await page.fill('input[type="datetime-local"]', tomorrowStr);
        
        // 点击「确认指派」按钮
        await page.click('text=确认指派');
        
        // 验证测量师傅指派成功
        await expect(page.locator('.toast-success')).toContainText('指派成功');
        
        // 验证测量师傅显示在任务列表中
        await expect(page.locator('.text-sm > div')).toContainText('测量师傅1');
    });

    test('should view measure task list', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 验证测量服务区域存在
        await expect(page.locator('text=测量服务')).toBeVisible();
        
        // 验证测量任务列表存在
        await expect(page.locator('.space-y-4')).toBeVisible();
        
        // 验证任务状态显示
        await expect(page.locator('.inline-flex')).toContainText('PENDING');
    });

    test('should view measure task details', async ({ page }) => {
        // 导航到线索详情页面
        await page.goto(`/leads/${leadId}`);
        
        // 点击测量任务链接
        await page.click('.font-medium');
        
        // 验证测量任务详情页面加载成功
        await expect(page.locator('h1')).toContainText('测量任务详情');
        
        // 验证任务基本信息
        await expect(page.locator('.grid > div > .text-sm')).toContainText('测量测试客户');
    });
});
