import { test, expect } from '@playwright/test';

test('capture react warnings on approvals page', async ({ page }) => {
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            const text = msg.text();
            if (text.includes('React does not recognize the') && text.includes('title')) {
                console.log('--- CAUGHT WARNING ---');
                console.log(text);
                console.log('Location:', msg.location());
                console.log('--- END WARNING ---');
            }
        }
    });

    // Since auth.setup.ts already logged us in and stored the state, 
    // we can navigate directly to the settings page!
    await page.goto('http://localhost:3004/settings/approvals', { timeout: 120000 });

    // Wait for the flow cards to load and click the first one to open the designer
    await page.waitForSelector('.cursor-pointer', { timeout: 30000 });
    await page.click('.cursor-pointer:first-child');

    // Wait a bit for React Flow to render and emit any console warnings
    await page.waitForTimeout(5000);
});
