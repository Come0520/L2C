import '../setup';
import { authStore } from '../../stores/auth-store';

describe('Workbench Page', () => {
    let container: any;

    beforeEach(async () => {
        (global as any).resetWX();
        vi.clearAllMocks();
        authStore.logout();

        if (!container) {
            await import('../../pages/workbench/index');
            container = (global as any).lastPageContainer;
        }

        if (container) {
            container.setData({
                loading: true,
                dashboard: {
                    targetCompletion: 0,
                    stats: { leads: 0, quotes: 0, orders: 0, cash: 0 },
                    todos: []
                }
            });
        }

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
        (global as any).getApp().request = vi.fn().mockResolvedValue(mockData);

        await container.instance.onShow();

        expect(container.data.dashboard.targetCompletion).toBe(85);
        expect(container.data.loading).toBe(false);
    });

    test('加载状态控制', async () => {
        (global as any).wx.request = vi.fn().mockReturnValue(new Promise(() => { })); // Stuck

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

export { };
