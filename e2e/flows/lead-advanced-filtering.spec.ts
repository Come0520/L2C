import { test, expect } from '@playwright/test';

test.describe('Lead Advanced Filtering', () => {
    test('should filter leads by status', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.click('text=待分配');
        await page.click('text=应用筛选');

        await expect(page.locator('.inline-flex')).toContainText('待分配');
    });

    test('should filter leads by sales', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="销售人员"]');
        await page.click('text=销售1');

        await expect(page.locator('text=销售1')).toBeVisible();
    });

    test('should filter leads by channel category', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="渠道来源"]');
        await page.click('text=线上');

        await expect(page.locator('text=线上')).toBeVisible();
    });

    test('should filter leads by intention level', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.click('button[placeholder="全部"]');
        await page.click('text=高');
        await page.click('text=应用筛选');

        await expect(page.locator('text=高意向')).toBeVisible();
    });

    test('should filter leads by tags', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[placeholder="输入标签..."]', 'VIP');
        await page.click('text=应用筛选');

        await expect(page.locator('text=VIP')).toBeVisible();
    });

    test('should filter leads by date range', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[type="date"] >> nth=0', '2026-01-01');
        await page.fill('input[type="date"] >> nth=1', '2026-01-31');
        await page.click('text=应用筛选');

        await expect(page.locator('text=2026-01')).toBeVisible();
    });

    test('should filter leads by keyword search', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[placeholder="输入姓名或电话..."]', '测试客户');
        await page.click('text=应用筛选');

        await expect(page.locator('text=测试客户')).toBeVisible();
    });

    test('should combine multiple filters', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="销售人员"]');
        await page.click('text=销售1');

        await page.click('button:has-text("更多筛选")');
        await page.click('button[placeholder="全部"]');
        await page.click('text=高');
        await page.fill('input[placeholder="输入标签..."]', 'VIP');
        await page.click('text=应用筛选');

        await expect(page.locator('text=销售1')).toBeVisible();
        await expect(page.locator('text=高意向')).toBeVisible();
        await expect(page.locator('text=VIP')).toBeVisible();
    });

    test('should reset all filters', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="销售人员"]');
        await page.click('text=销售1');

        await page.click('button:has-text("更多筛选")');
        await page.click('button[placeholder="全部"]');
        await page.click('text=高');
        await page.fill('input[placeholder="输入标签..."]', 'VIP');
        await page.click('text=重置');

        await expect(page.locator('text=全部销售')).toBeVisible();
        await expect(page.locator('text=全部')).toBeVisible();
    });

    test('should sync filters with URL', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="销售人员"]');
        await page.click('text=销售1');

        await expect(page.url()).toContain('assignedSalesId=');
    });

    test('should handle empty filter results', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[placeholder="输入姓名或电话..."]', '不存在的客户');
        await page.click('text=应用筛选');

        await expect(page.locator('text=暂无线索')).toBeVisible();
    });

    test('should handle large date range', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[type="date"] >> nth=0', '2025-01-01');
        await page.fill('input[type="date"] >> nth=1', '2026-12-31');
        await page.click('text=应用筛选');

        await expect(page.locator('text=2025-01')).toBeVisible();
    });

    test('should handle invalid date range', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[type="date"] >> nth=0', '2026-12-31');
        await page.fill('input[type="date"] >> nth=1', '2026-01-01');
        await page.click('text=应用筛选');

        await expect(page.locator('text=暂无线索')).toBeVisible();
    });

    test('should handle special characters in keyword search', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[placeholder="输入姓名或电话..."]', '客户@#$%^&*()_+-={}[]|\\:;"\'<>?,./~`');
        await page.click('text=应用筛选');

        await expect(page.locator('text=暂无线索')).toBeVisible();
    });

    test('should handle long keyword search', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        const longKeyword = 'A'.repeat(100);
        await page.fill('input[placeholder="输入姓名或电话..."]', longKeyword);
        await page.click('text=应用筛选');

        await expect(page.locator('text=暂无线索')).toBeVisible();
    });

    test('should handle multiple tags search', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button:has-text("更多筛选")');
        await page.fill('input[placeholder="输入标签..."]', 'VIP,高意向,重点客户');
        await page.click('text=应用筛选');

        await expect(page.locator('text=暂无线索')).toBeVisible();
    });

    test('should handle filter persistence across navigation', async ({ page }) => {
        await page.goto('/leads');

        await page.click('button[placeholder="销售人员"]');
        await page.click('text=销售1');

        await page.goto('/leads');

        await expect(page.locator('text=销售1')).toBeVisible();
    });
});
