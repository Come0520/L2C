import { test, expect } from '@playwright/test';

test('Reproduce undefined error on /settings/general', async ({ page }) => {
    let uncaughtErrors = 0;
    page.on('pageerror', err => {
        console.error('【PAGEERROR】', err.message);
        uncaughtErrors++;
    });
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('【CONSOLE ERROR】', msg.text());
        }
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.fill('input[name="phone"]', '13800138000');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    console.log('转到 /settings/general');
    await page.goto('/settings/general', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    const errorOverlay = await page.locator('nextjs-portal').count();
    if (errorOverlay > 0) {
        console.error('Found Next.js Error Overlay!');
        const overlayText = await page.locator('nextjs-portal').innerText();
        console.error('Overlay Text:', overlayText);
    } else {
        console.log('没有检测到 Next.js Error Overlay。');
    }
});
