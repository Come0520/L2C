import { test as base, expect } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';

/**
 * Midscene AI 视觉测试 - L2C 业务功能验证
 *
 * 测试目标：验证豆包 Seed 视觉模型能否理解 L2C 的 UI 并执行操作/断言
 * 测试范围：仪表板、线索列表、AI 查询三大核心能力
 *
 * 文档: https://midscenejs.com/zh/api
 */

/**
 * 扩展 Playwright test fixture，注入 Midscene Agent
 */
const test = base.extend<{ agent: PlaywrightAgent }>({
    agent: async ({ page }, use) => {
        const agent = new PlaywrightAgent(page);
        await use(agent);
    },
});

test.describe('Midscene AI 业务功能验证', () => {

    /**
     * 测试 1：仪表板页面视觉断言
     * 验证 AI 能否"看懂"仪表板上的关键数据卡片
     */
    test('【aiAssert】仪表板页面 - AI 能看懂统计卡片', async ({ page, agent }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // AI 视觉断言：验证页面上是否存在统计数字
        await agent.aiAssert('页面上有数字类型的统计数据展示，例如线索数量、成交金额等');
    });

    /**
     * 测试 2：线索列表页 - AI 读取数据
     * 验证 aiQuery 能否从页面中提取结构化数据
     */
    test('【aiQuery】线索列表页 - AI 读取第一条数据', async ({ page, agent }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // AI 查询：提取第一条线索的信息
        const result = await agent.aiQuery(
            '获取列表中第一条记录的客户名称，如果列表为空返回 "空列表"',
        );

        console.log('AI 查询到的第一条线索名称:', result);
        // 只验证返回了内容（不为 null/undefined）
        expect(result).toBeTruthy();
    });

    /**
     * 测试 3：线索页面 - AI 操作导航按钮
     * 验证 aiAction 能否执行视觉导航操作
     */
    test('【aiAction】线索列表页 - AI 点击创建按钮打开弹窗', async ({ page, agent }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // AI 操作：找到并点击创建线索的按钮
        await agent.aiAction('找到页面上"创建线索"或"新建"相关的按钮并点击');

        // 验证弹窗已打开（这里用自然语言断言）
        await agent.aiAssert('页面出现了一个弹窗或对话框，里面有用于填写线索信息的表单');
    });

    /**
     * 测试 4：组合测试 - AI 填写表单字段
     * 验证 aiAction 在模态框内的操作精度
     */
    test('【aiAction+aiAssert】创建线索弹窗 - AI 填写并验证表单', async ({ page, agent }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // 先用 Playwright 原生方式打开弹窗（更稳定）
        await page.getByTestId('create-lead-btn').click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(1000);

        // 然后用 AI 填写字段（体现 Midscene 辅助能力）
        await agent.aiAction('在弹窗中的客户名称输入框填入"AI测试客户_豆包"');
        await agent.aiAction('在联系电话输入框填入"13900001234"');

        // AI 视觉验证：确认字段已填入
        await agent.aiAssert('客户名称字段中已经填入了内容');
    });
});
