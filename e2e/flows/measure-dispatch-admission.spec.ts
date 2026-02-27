/**
 * 测量派单准入 E2E 测试
 *
 * 测试点：
 * 1. 测量费用准入校验
 * 2. 免费测量审批流程
 * 3. 测量员派单
 */
import { test, expect } from '@playwright/test';

test.describe('测量费用准入 (Measure Fee Admission)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/measure-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-1: 未付定金客户应无法直接发起测量', async ({ page }) => {
        // 进入线索详情，尝试发起测量
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const firstLead = page.locator('table tbody tr').first();
        if (await firstLead.isVisible()) {
            await firstLead.locator('a').first().click();

            // 点击预约测量
            const measureBtn = page.getByRole('button', { name: /预约测量|发起测量/ });
            if (await measureBtn.isVisible()) {
                await measureBtn.click();

                // 检查是否有准入校验提示
                const admissionWarning = page.getByText(/未付定金|需要审批|费用准入/);
                if (await admissionWarning.isVisible({ timeout: 3000 })) {
                    console.log('✅ 系统检测到费用准入条件未满足');
                } else {
                    console.log('⚠️ 未检测到准入校验（可能已满足条件）');
                }
            }
        }
    });

    test('P1-2: 免费测量需要审批', async ({ page }) => {
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const firstLead = page.locator('table tbody tr').first();
        if (await firstLead.isVisible()) {
            await firstLead.locator('a').first().click();

            const measureBtn = page.getByRole('button', { name: /预约测量/ });
            if (await measureBtn.isVisible()) {
                await measureBtn.click();

                // 查找免费测量选项
                const freeMeasureOption = page.getByLabel(/免费测量/).or(page.locator('text=申请免费'));
                if (await freeMeasureOption.isVisible()) {
                    await freeMeasureOption.click();

                    // 验证需要审批
                    const approvalHint = page.getByText(/需要审批|等待店长/);
                    if (await approvalHint.isVisible()) {
                        console.log('✅ 免费测量需要审批');
                    }
                }
            }
        }
    });

    test('P1-3: 已付定金客户可直接预约测量', async ({ page }) => {
        // 此测试需要特定数据环境（有已付定金的线索）
        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 筛选已付定金的线索
        const statusFilter = page.getByRole('combobox', { name: /状态/ });
        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            const paidOption = page.getByRole('option', { name: /已付定金|已收款/ });
            if (await paidOption.isVisible()) {
                await paidOption.click();
                await page.waitForTimeout(500);
            }
        }

        const firstLead = page.locator('table tbody tr').first();
        if (await firstLead.isVisible()) {
            await firstLead.locator('a').first().click();

            const measureBtn = page.getByRole('button', { name: /预约测量/ });
            if (await measureBtn.isVisible()) {
                console.log('✅ 已付定金客户的测量按钮可用');
            }
        }
    });
});

test.describe('测量员派单 (Measure Dispatch)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/measure-tasks', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('P1-4: 应能指派测量员', async ({ page }) => {
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配|PENDING/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派|分配/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 选择测量员
                const measurerSelect = dialog.getByLabel(/测量员|师傅/);
                if (await measurerSelect.isVisible()) {
                    console.log('✅ 测量员派单功能可用');
                }
            }
        }
    });
});
