import * as simulate from 'miniprogram-simulate';
import * as path from 'path';
import { authStore } from '../stores/auth-store';

describe('custom-tab-bar', () => {
    let container: any;
    let componentId: string;

    beforeAll(() => {
        try {
            // Load component
            const componentPath = path.resolve(__dirname, '../custom-tab-bar/index');
            console.log('Loading component from:', componentPath);
            componentId = simulate.load(componentPath, 'custom-tab-bar');
            console.log('Component loaded with ID:', componentId);
        } catch (err) {
            console.error('Failed to load component:', err);
            throw err;
        }
    });

    beforeEach(() => {
        (global as any).resetWX();
        authStore.logout();
        container = simulate.render(componentId);
        container.attach(document.createElement('parent-wrapper'));
    });

    test('访客 (Guest) 应看到基础 Tabs', () => {
        const list = container.data.list;
        expect(list).toHaveLength(2);
        expect(list[0].text).toBe('首页');
        expect(list[1].text).toBe('我的');
    });

    test('管理员 (Admin) 应看到管理 Tabs', () => {
        authStore.setLogin('token', { id: '1', name: 'Boss', role: 'admin' });
        // Trigger manual update because simulate doesn't automatically trigger lifetimes attached again after render
        container.instance.updateTabs();

        const list = container.data.list;
        expect(list).toHaveLength(4);
        expect(list[0].text).toBe('工作台');
        expect(list[1].text).toBe('线索');
    });

    test('安装工 (Installer) 应看到任务 Tabs', () => {
        authStore.setLogin('token', { id: '2', name: 'Worker', role: 'installer' });
        container.instance.updateTabs();

        const list = container.data.list;
        expect(list).toHaveLength(2);
        expect(list[0].text).toBe('任务');
    });

    test('点击 switchTab 应调用 wx.switchTab', () => {
        authStore.setLogin('token', { id: '1', name: 'Boss', role: 'admin' });
        container.instance.updateTabs();

        // 直接调用组件方法以验证逻辑，或者修正事件分发
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
