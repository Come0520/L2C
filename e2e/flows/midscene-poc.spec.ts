import { test as base, expect } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';

// 定制包含 agent 的 test fixture
const test = base.extend<{ agent: PlaywrightAgent }>({
    agent: async ({ page }, use) => {
        const agent = new PlaywrightAgent(page);
        await use(agent);
    },
});

test.describe('Midscene PoC Test - Baidu Search', () => {
    test('应该能够使用自然语言进行百度搜索', async ({ page, agent }) => {
        await page.goto('https://www.baidu.com');

        // 使用 AI 执行操作：输入并点击搜索
        await agent.aiAction('在搜索框中输入 "Midscene.js"，然后点击"百度一下"按钮');

        // 简单等待和断言
        await page.waitForLoadState('networkidle');
        await expect(async () => {
            const asserts = await agent.aiAssert('页面中包含与 "Midscene" 相关的搜索结果');
            expect(asserts).toBeTruthy();
        }).toPass();
    });
});
