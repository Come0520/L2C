/**
 * Midscene L2C 业务功能测试脚本
 *
 * 使用方法：
 * 1. 先启动开发服务器：pnpm dev（在另一个终端）
 * 2. 然后运行此脚本：npx tsx test-midscene-l2c.js
 *
 * 或者修改 BASE_URL 直接指向 ECS 生产环境。
 */

import { PlaywrightAgent } from '@midscene/web/playwright';
import { chromium } from 'playwright';

// =============================================
// 豆包 Seed 视觉模型配置（官方标准格式）
// =============================================
process.env.MIDSCENE_MODEL_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
process.env.MIDSCENE_MODEL_API_KEY = "a53eea7f-fe75-420e-b5fb-3fe4536b392e";
process.env.MIDSCENE_MODEL_NAME = "doubao-seed-1-6-vision-250815";
process.env.MIDSCENE_MODEL_FAMILY = "doubao-seed";

// 如果 ECS 上有生产服务器，可以改为生产 URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 测试 1：AI 读取登录页面内容
 */
async function test1_loginPage() {
    console.log('\n====== 测试 1：AI 识别登录页 ======');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const agent = new PlaywrightAgent(page);

    try {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForTimeout(2000);
        console.log('页面标题:', await page.title());

        // AI 查询：读取页面上的表单字段
        const fields = await agent.aiQuery('列出页面上所有输入框的占位文本（placeholder）');
        console.log('✅ AI 识别到的输入框:', fields);

        // AI 断言：登录按钮存在
        await agent.aiAssert('页面上有一个"登录"相关的按钮');
        console.log('✅ 登录按钮存在且被正确识别');

    } catch (e) {
        console.error('❌ 失败:', e.message);
    } finally {
        await browser.close();
    }
}

/**
 * 测试 2：AI 执行登录操作
 */
async function test2_loginAction() {
    console.log('\n====== 测试 2：AI 执行登录 ======');
    const browser = await chromium.launch({ headless: false }); // 可视化模式，看 AI 操作
    const page = await browser.newPage();
    const agent = new PlaywrightAgent(page);

    try {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForTimeout(2000);

        // AI 填写手机号和密码
        await agent.aiAction('在手机号或邮箱输入框中输入 "13800000001"');
        await agent.aiAction('在密码输入框中输入 "123456"');
        await agent.aiAction('点击登录按钮');
        console.log('✅ AI 已完成登录操作');

        // 等待页面跳转
        await page.waitForTimeout(3000);

        // 检查是否登录成功（跳转到了 dashboard）
        const currentUrl = page.url();
        console.log('当前 URL:', currentUrl);

        if (currentUrl.includes('dashboard') || currentUrl.includes('leads') || !currentUrl.includes('login')) {
            console.log('✅✅ 登录成功！AI 能正确操作 L2C 登录页面');
        } else {
            const errorInfo = await agent.aiQuery('页面是否显示了错误信息，如果是，描述错误内容');
            console.log('⚠️ 还在登录页，AI 查询到的信息:', errorInfo);
        }
    } catch (e) {
        console.error('❌ 失败:', e.message);
    } finally {
        await browser.close();
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('=== L2C Midscene 业务功能测试 ===');
    console.log('目标 URL:', BASE_URL);
    console.log('AI 模型:', process.env.MIDSCENE_MODEL_NAME);

    // 顺序运行测试
    await test1_loginPage();
    await test2_loginAction();

    console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
