import { PlaywrightAgent } from '@midscene/web/playwright';
import { chromium } from 'playwright';

// =============================================
// 豆包 Seed 模型配置（官方文档标准格式）
// 来源: https://midscenejs.com/zh/model-common-config.html
// =============================================
process.env.MIDSCENE_MODEL_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
process.env.MIDSCENE_MODEL_API_KEY = "a53eea7f-fe75-420e-b5fb-3fe4536b392e";
process.env.MIDSCENE_MODEL_NAME = "doubao-seed-1-6-vision-250815";
process.env.MIDSCENE_MODEL_FAMILY = "doubao-seed"; // 关键！之前缺少的变量

async function main() {
    console.log("=== Midscene 豆包模型连通性测试 ===");
    console.log("Model:", process.env.MIDSCENE_MODEL_NAME);
    console.log("Family:", process.env.MIDSCENE_MODEL_FAMILY);
    console.log("Base URL:", process.env.MIDSCENE_MODEL_BASE_URL);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.baidu.com');
        console.log("\n✅ 页面导航成功! 正在初始化 Midscene Agent...");

        const agent = new PlaywrightAgent(page);

        console.log("🤖 正在向豆包模型发送图像请求...");
        await agent.aiAction('在搜索框中输入 "Midscene"');
        console.log("\n✅✅✅ 成功! 豆包模型已正确响应并完成了 UI 操作!");

    } catch (e) {
        console.error("\n❌ 失败:", e.message || e);
    } finally {
        await browser.close();
    }
}

main();
