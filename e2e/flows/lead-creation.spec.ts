import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Lead Management', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            try {
                const html = await page.content();
                if (!fs.existsSync('test-results')) {
                    fs.mkdirSync('test-results');
                }
                const filename = `test-results/failure-${testInfo.title.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
                fs.writeFileSync(filename, html);
                console.log(`Saved failure HTML to ${filename}`);
            } catch (e) {
                console.error('Failed to save failure HTML:', e);
            }
        }
    });

    test('should create a new lead successfully', async ({ page }) => {
        // 生成随机手机号
        const randomPhone = `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const randomName = `测试客户_${Math.random().toString(36).substring(7)}`;

        // 导航到线索列表页
        await page.goto('/leads');

        // 等待创建按钮可见 (使用 data-testid 更稳定)
        const createBtn = page.getByTestId('create-lead-btn');
        await expect(createBtn).toBeVisible({ timeout: 15000 });
        await createBtn.click();

        // 验证对话框是否打开
        await expect(page.getByRole('dialog')).toBeVisible();

        // 填写表单
        await page.getByLabel('客户姓名').fill(randomName);
        await page.getByLabel('手机号').fill(randomPhone);

        // 可选字段
        await page.getByLabel('来源备注').fill('自动化测试');
        await page.getByLabel('备注/需求').fill('这是一个自动生成的测试需求');

        // 提交表单 - 监听响应
        page.waitForResponse(resp =>
            resp.url().includes('/leads') && resp.status() === 200
        ).catch(() => null);

        // 使用 data-testid 点击提交 (避免 loading 状态下的文本变化问题)
        await page.getByTestId('submit-lead-btn').click();

        // 验证反馈 (增加等待时间)
        // Toast 可能包含 "成功" 或 "Success"
        await expect(page.getByText(/成功|Success/).first()).toBeVisible({ timeout: 10000 });

        // 等待对话框关闭
        await expect(page.getByRole('dialog')).toBeHidden();

        // 验证列表页是否包含新数据
        // 如果列表没有自动刷新，可能需要重载
        await page.reload();
        // 简单等待 reload 完成
        await expect(page.getByTestId('create-lead-btn')).toBeVisible();

        await expect(page.getByText(randomName)).toBeVisible();
    });
});
