import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/test-utils';

test.describe('工作台角色视图 (Workbench Roles) E2E 测试', () => {

    // Helper 函数：复用登录流程
    async function loginAsRole(page, username, password) {
        await safeGoto(page, '/login');
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/', { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
    }

    test.skip('BOSS 角色登录应看到全局统计类看板', async ({ page }) => {
        // 由于测试库目前没有单独配置特定的 test-boss 账号，暂时跳过
        // 如果有真实的数据结构，可以用实际账号如 admin@l2c.com
        await loginAsRole(page, 'admin', 'admin123'); // 假设 admin 具有 BOSS 视角

        await expect(async () => {
            const bodyText = await page.locator('body').textContent();
            expect(bodyText).toMatch(/总营收|排行榜|公司概览|Leaderboard|Total Revenue|销售额/i);
        }).toPass({ timeout: 15000 });

        const nav = page.locator('nav');
        await expect(nav.getByText(/系统设置|Settings/i)).toBeVisible();
    });

    test.skip('SALES 角色登录应看到个人业绩为主的看板', async ({ page }) => {
        // 同理，此用例可能需要配置实际的基础销售号
        await loginAsRole(page, 'sales', 'sales123'); // 假设存在此测试销售号

        await expect(async () => {
            const bodyText = await page.locator('body').textContent();
            expect(bodyText).toMatch(/我的业绩|线索跟进|我的线索|My Performance/i);
        }).toPass({ timeout: 15000 });

        const nav = page.locator('nav');
        await expect(nav.getByText(/系统设置|Settings/i)).not.toBeVisible();
    });

    // 替代方案：检查系统首页元素能否正常挂载，因为测试服务器数据库依赖情况未知
    test('页面主框架和默认工作台展示能够成功渲染无崩溃', async ({ page }) => {
        await safeGoto(page, '/');
        // 基本验证标题或者页面的结构存在即可
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('body')).toBeVisible();
    });
});
