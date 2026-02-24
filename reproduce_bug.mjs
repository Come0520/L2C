import { chromium } from 'playwright';

(async () => {
    console.log('启动浏览器...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 捕获页面错误
    page.on('pageerror', (err) => {
        console.error('【页面错误捕获】', err);
    });
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.error('【console.error】', msg.text());
        }
    });

    try {
        console.log('登录...');
        await page.goto('http://localhost:3000/login');
        // 如果还没登录，手动登录。这取决于本地的数据库是否存在 test_tenant 用户
        await page.fill('input[name="phone"]', '13800138000');
        await page.fill('input[name="password"]', '123456');
        await page.click('button[type="submit"]');

        await page.waitForTimeout(2000);

        console.log('跳转至 /settings/general ...');
        await page.goto('http://localhost:3000/settings/general');

        await page.waitForTimeout(3000);
        console.log('页面内容: ', await page.title());

        const rootError = await page.locator('.nextjs-container').innerText().catch(() => null);
        if (rootError) {
            console.error('【检测到 Next.js 错误覆层】', rootError);
        }
    } catch (error) {
        console.error('【发生未知错误】', error);
    } finally {
        await browser.close();
    }
})();
