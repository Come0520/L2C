import './setup';
// remove path
import { authStore } from '../stores/auth-store';

describe('custom-tab-bar', () => {
    let container: any;

    beforeEach(async () => {
        (global as any).resetWX();
        vi.clearAllMocks();
        authStore.logout();

        if (!container) {
            await import('../custom-tab-bar/index');
            container = (global as any).lastComponentContainer;
        }

        if (container) {
            container.setData({
                selected: 0,
                list: []
            });
            // 触发 attached 生命周期
            if (container.instance.lifetimes && container.instance.lifetimes.attached) {
                container.instance.lifetimes.attached.call(container.instance);
            }
        }

        if (!container) throw new Error('Component logic not loaded');
    });

    test('访客 (Guest) 应看到基础 Tabs', () => {
        container.instance.updateTabs();
        const list = container.data.list;
        expect(list).toHaveLength(2);
        expect(list[0].text).toBe('主页');
        expect(list[1].text).toBe('我的');
    });

    test('管理员 (Admin) 应看到管理 Tabs', () => {
        authStore.setLogin('token', { id: '1', name: 'Boss', role: 'admin' });
        container.instance.updateTabs();

        const list = container.data.list;
        expect(list).toHaveLength(2);
        expect(list[0].text).toBe('工作台');
        expect(list[1].text).toBe('我的');
    });

    test('安装工 (Installer) 应看到任务 Tabs', () => {
        authStore.setLogin('token', { id: '2', name: 'Worker', role: 'installer' });
        container.instance.updateTabs();

        const list = container.data.list;
        expect(list).toHaveLength(3);
        expect(list[0].text).toBe('任务');
        expect(list[1].text).toBe('工作台');
        expect(list[2].text).toBe('我的');
    });

    test('点击 switchTab 应调用 wx.switchTab', () => {
        authStore.setLogin('token', { id: '1', name: 'Boss', role: 'admin' });
        container.instance.updateTabs();

        container.instance.switchTab({
            currentTarget: {
                dataset: {
                    path: '/pages/workbench/index',
                    index: 0
                }
            }
        });

        expect(wx.switchTab).toHaveBeenCalledWith({
            url: '/pages/workbench/index'
        });
        expect(container.data.selected).toBe(0);
    });
});

export { };
