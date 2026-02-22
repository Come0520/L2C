import * as simulate from 'miniprogram-simulate';
import * as path from 'path';
import { authStore } from '../../stores/auth-store';

describe('Workbench Page', () => {
    let container: any;

    beforeEach(() => {
        (global as any).resetWX();
        authStore.logout();

        // 直接 require 触发 Page() 调用
        // 注意：jest 有模块缓存，这里需要 clear 或使用 jest.isolateModules
        jest.isolateModules(() => {
            require('../../pages/workbench/index');
        });

        container = (global as any).lastPageContainer;
        if (!container) throw new Error('Page logic not loaded');
    });

    test('进入页面应触发数据加载', async () => {
        const mockData = {
            success: true,
            data: {
                target: { percentage: 85 },
                stats: { leads: 10, quotes: 5, orders: 2, cash: 100 },
                todos: [{ title: 'Test Task', status: 'pending' }]
            }
        };
        // 修正：在 require 之前注入 wx mock 是安全的，
        // 或者直接通过 getApp().request 注入
        (global as any).getApp().request = jest.fn().mockResolvedValue(mockData);

        await container.instance.onShow();

        expect(container.data.dashboard.targetCompletion).toBe(85);
        expect(container.data.loading).toBe(false);
    });

    test('加载状态控制', async () => {
        (global as any).wx.request = jest.fn().mockReturnValue(new Promise(() => { })); // Stuck

        container.instance.fetchDashboard();
        expect(container.data.loading).toBe(true);
    });

    test('快捷操作跳转 - 创建报价', () => {
        container.instance.navigateToCreateQuote();
        expect(wx.navigateTo).toHaveBeenCalledWith(expect.objectContaining({
            url: '/pages/quotes/create/index'
        }));
    });
});
