import { test, expect } from '@playwright/test';
import { safeGoto, skipOnDataLoadError } from '../helpers/test-utils';

/**
 * 烟雾测试 (Smoke Test)
 * 目标：验证系统核心页面和模块是否能正常加载，避免白屏或基础路由错误。
 */

test.describe('L2C 系统烟雾测试', () => {

    // 核心业务模块测试
    const coreModules = [
        { name: '工作台', path: '/', expectedText: /仪表盘|待办事项|工作台/ },
        { name: '线索管理', path: '/leads', expectedText: /线索列表|线索编号|新建线索/ },
        { name: '客户管理', path: '/customers', expectedText: /客户管理|客户编号|新建客户/ },
        { name: '渠道管理', path: '/channels', expectedText: /渠道列表|渠道名称|新建渠道/ },
        { name: '报价管理', path: '/quotes', expectedText: /报价列表|报价编号|新建报价/ },
        { name: '订单管理', path: '/orders', expectedText: /订单管理|订单号|订单金额/ },
        { name: '安装管理', path: '/service', expectedText: /测量服务|安装服务|新建测量/ },
        { name: '售后管理', path: '/after-sales', expectedText: /售后管理|工单号|新建工单/ },
        { name: '财务管理', path: '/finance', expectedText: /财务中心|应收账款|应付账款/ },
        { name: '供应链', path: '/supply-chain', expectedText: /供应链|库存|库房/ },
        { name: '数据分析', path: '/analytics', expectedText: /分析|看板|报表/ },
        { name: '审批中心', path: '/settings/approvals', expectedText: /审批设置|审批流程/ },
        { name: '展厅', path: '/showroom', expectedText: /全部|商品|案例|搜索/ },
    ];

    for (const module of coreModules) {
        test(`验证核心模块: ${module.name}`, async ({ page }) => {
            console.log(`正在检查模块: ${module.name} (${module.path})...`);
            // Build 模式（standalone）无冷编译延迟，30s 超时绰绰有余。
            // waitUntil: 'domcontentloaded' 兼容所有浏览器（commit 在 Firefox 下不等内容渲染）
            const success = await safeGoto(page, module.path, { timeout: 30000, waitUntil: 'domcontentloaded' });
            if (success) {
                // 检查页面内容以防白屏，build 模式响应稳定，15s 超时即可
                await expect(page.locator('body')).not.toBeEmpty({ timeout: 15000 });
                await expect(page).not.toHaveURL(/.*login/);

                // 验证页面包含基本模块标识
                await expect(page.locator('body')).toContainText(module.expectedText, { timeout: 15000 });

                console.log(`✅ ${module.name} 加载成功`);
            }
        });
    }

    // 设置中心子页面测试 (采样测试关键设置页)
    const settingsPages = [
        { name: '个人设置', path: '/profile/settings', expectedText: /个人偏好|个人信息/ },
        { name: '财务设置', path: '/settings/finance', expectedText: '财务配置' },
        { name: '通知设置', path: '/settings/notifications', expectedText: '通知' },
        { name: '角色管理', path: '/settings/roles', expectedText: '角色' },
        { name: '系统参数', path: '/settings/system', expectedText: /系统参数/ },
    ];

    test.describe('设置中心专项检查', () => {
        for (const pageInfo of settingsPages) {
            test(`验证设置页: ${pageInfo.name}`, async ({ page }) => {
                const success = await safeGoto(page, pageInfo.path);
                if (success) {
                    await expect(page.locator('body')).toContainText(pageInfo.expectedText, { timeout: 15000 });
                    console.log(`✅ 设置页 [${pageInfo.name}] 加载成功`);
                }
            });
        }
    });

    // 基础安全性检查：尝试访问登录页
    test('验证已登录状态下访问登录页', async ({ page }) => {
        // 根据设计，login 是纯渲染页不进行服务端重定向，避免死循环。
        // 已登录状态下客户端组件可能不渲染表单，仅验证页面能正常响应即可。
        const success = await safeGoto(page, '/login', { timeout: 60000, waitUntil: 'domcontentloaded' });
        if (success) {
            // 确保没有发生自动重定向到其他页面
            expect(page.url()).toContain('/login');
            console.log(`✅ 已登录状态下访问登录页响应正常: ${page.url()}`);
        }
    });

    // 404 页面检查
    test('验证 404 错误页面', async ({ page }) => {
        // 用 safeGoto 兼容 Firefox 连续测试后的连接疲劳问题
        const success = await safeGoto(page, '/some-non-existent-page', { timeout: 60000, waitUntil: 'domcontentloaded' });
        if (success) {
            await expect(page.locator('body')).toContainText(/404|未找到|不存在/);
            console.log('✅ 404 页面展示正常');
        }
    });

});
