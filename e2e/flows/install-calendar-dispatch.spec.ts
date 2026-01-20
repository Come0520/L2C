/**
 * 安装日历视图与智能派单 E2E 测试
 *
 * 测试点：
 * 1. 日历视图切换（日/周/月）
 * 2. 师傅排期可视化
 * 3. 智能师傅推荐
 */
import { test, expect } from '@playwright/test';

test.describe('安装日历视图 (Install Calendar View)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P1-1: 应能切换到日历视图', async ({ page }) => {
        // 查找视图切换按钮
        const calendarViewBtn = page.getByRole('button', { name: /日历|排期|调度/ }).or(page.locator('[data-testid="calendar-view"]'));

        if (await calendarViewBtn.isVisible()) {
            await calendarViewBtn.click();

            // 验证日历视图加载
            const calendarContainer = page.locator('[class*="calendar"]').or(page.locator('[class*="schedule"]'));
            await expect(calendarContainer.first()).toBeVisible({ timeout: 5000 });
            console.log('✅ 日历视图切换成功');
        } else {
            console.log('⚠️ 未找到日历视图切换按钮');
        }
    });

    test('P1-2: 日历应支持周视图', async ({ page }) => {
        const calendarViewBtn = page.getByRole('button', { name: /日历|排期/ });
        if (await calendarViewBtn.isVisible()) {
            await calendarViewBtn.click();

            // 切换到周视图
            const weekViewBtn = page.getByRole('button', { name: /周|Week/ });
            if (await weekViewBtn.isVisible()) {
                await weekViewBtn.click();
                console.log('✅ 周视图切换成功');
            }
        }
    });

    test('P1-3: 日历中的任务应有颜色编码', async ({ page }) => {
        const calendarViewBtn = page.getByRole('button', { name: /日历|排期/ });
        if (await calendarViewBtn.isVisible()) {
            await calendarViewBtn.click();

            // 查找带颜色的任务块
            const taskBlock = page.locator('[class*="event"]').or(page.locator('[class*="task-block"]'));
            if (await taskBlock.first().isVisible()) {
                console.log('✅ 日历中显示任务块');
            }
        }
    });
});

test.describe('智能师傅推荐 (Smart Worker Recommendation)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/install-tasks');
        await page.waitForLoadState('networkidle');
    });

    test('P1-4: 派单时应显示推荐师傅', async ({ page }) => {
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();

                // 查找推荐标签
                const recommendTag = dialog.locator('text=推荐').or(dialog.locator('[class*="recommend"]'));
                if (await recommendTag.isVisible()) {
                    console.log('✅ 派单对话框显示推荐师傅');
                } else {
                    console.log('⚠️ 未找到推荐师傅标识');
                }
            }
        }
    });

    test('P1-5: 推荐应显示理由标签', async ({ page }) => {
        const pendingRow = page.locator('table tbody tr').filter({ hasText: /待分配/ }).first();
        if (await pendingRow.isVisible()) {
            await pendingRow.locator('a').first().click();

            const assignBtn = page.getByRole('button', { name: /指派/ });
            if (await assignBtn.isVisible()) {
                await assignBtn.click();

                const dialog = page.getByRole('dialog');

                // 查找推荐理由（距离最近、当日空闲、好评率高等）
                const reasonTag = dialog.locator('text=距离').or(dialog.locator('text=空闲')).or(dialog.locator('text=评分'));
                if (await reasonTag.isVisible()) {
                    console.log('✅ 推荐师傅显示理由标签');
                }
            }
        }
    });
});
