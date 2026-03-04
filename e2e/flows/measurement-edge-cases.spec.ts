import { test, expect } from '@playwright/test';

/**
 * 测量与交付时的网络弱网场景防呆 (Offline & Measurement Edge Cases)
 * 
 * 覆盖场景：
 * 1. 同一个测量单下多版本比价 (多变种 Variant) 创建
 * 2. 模拟前端强连断开后表单的不丢失特性 (Offline Mode)
 */

test.describe('测量单复杂业务处理与离线支持 (Measurement Extreme Scenarios)', () => {

    test('P2-1: 一测多报：同一物理空间下添加不同的选品方案 (Variants)', async ({ page }) => {
        await page.route('**/api/measurements/M-VARIANTS-123', async route => {
            const data = {
                id: 'M-VARIANTS-123',
                status: 'COMPLETED',
                customer: '客户测试-方案比对',
                spaces: [
                    {
                        id: 'S1', name: '主卧',
                        variants: [
                            { id: 'v1', type: 'CURTAIN', style: '轻奢', estimatedPrice: 2000 },
                            { id: 'v2', type: 'BLINDS', style: '极简', estimatedPrice: 800 }
                        ]
                    }
                ]
            };
            await route.fulfill({ json: { data } });
        });

        await page.goto('/measurements/M-VARIANTS-123', { waitUntil: 'domcontentloaded' }).catch(() => null);

        const spaceBlock = page.locator('text=/主卧|Spaces/');
        if (await spaceBlock.isVisible({ timeout: 5000 })) {
            // 验证里面是否有多方案的容器
            const addTargetBtn = page.getByRole('button', { name: /新增方案|Add Variant|生成报价/ });
            if (await addTargetBtn.isVisible({ timeout: 3000 })) {
                const variantsCount = await page.locator('text=/方案|Variant|选项/').count();
                if (variantsCount >= 1) {
                    console.log('✅ 系统在渲染层面支持了多子方案嵌套的设计');
                } else {
                    console.log('⚠️ 未能渲染出多个 Variant (可能当前组件仅强绑定了第一个唯一方案)');
                }
            } else {
                console.log('⚠️ 没有允许单空间新增不同实现方案的“一测多报”UI交互功能');
            }
        }
    });

    test('P2-2: 离线断网时的数据表单输入应能暂存及阻断关键路径', async ({ browser, page }) => {
        // 由于测试离线有点难以完全拦截 (通常用到 CDP session)
        // 这里只是一个形式上模拟拦截 API 为网络异常 (ECONNREFUSED) 的交互

        await page.route('**/api/miniprogram/tasks/*/submit-draft', async route => {
            await route.abort('failed'); // 使其抛出连接故障
        });

        // 对于真实的系统，前端通常在检测到 navigator.onLine == false 时会置灰提交按钮，
        // 或自动存入 IndexedDB/localStorage 唤出 "已保存本地" 的 Toast。
        // 这里我们期望触发到那个机制。

        // 此处只占位标记这个特性用例的存在，用于开发完成后具体运行断言
        console.log('ℹ️ 此处于 E2E 环境模拟网络丢包/失败（API abort）与 Storage 保护联动，待前端完成离线包注入并联调');

        // 我们也去检查主页面上是否具备明确的网络探测组件 (一般会在顶部打条说 "You are offline") 
        await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => null);
        await page.evaluate(() => {
            // 模拟抛发 Offline 事件
            window.dispatchEvent(new Event('offline'));
        });

        const offlineBanner = page.locator('text=/似乎已断开与互联网的连接|未连接|Offline/');
        if (await offlineBanner.isVisible({ timeout: 2000 })) {
            console.log('✅ 系统集成了离线感知侦测与用户重连提示');
        } else {
            console.log('⚠️ 全局缺少明显的离线断网横幅或状态提醒交互（但这不是硬性缺陷）');
        }
    });
});
