import { Page, expect } from '@playwright/test';

export async function loginAsSalesManager(page: Page) {
    await page.goto('/login');
    await page.getByLabel('手机号').fill('13800138000'); // Assuming sales manager phone
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /欢迎/ })).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel('手机号').fill('13800138000'); // Assuming admin phone (same for now or change if known)
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL('/');
}

export async function logout(page: Page) {
    // Implementation depends on UI. Assuming a user menu -> logout
    // If not known, we can clear cookies or use a direct URL if available
    // For now, let's try to find logout button via UI
    const userMenu = page.locator('button[aria-label="User menu"]'); // Hypothesis
    if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByText('退出登录').click();
    } else {
        // Fallback: clear storage
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await page.goto('/login');
    }
}
