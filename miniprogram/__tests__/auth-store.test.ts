import { authStore, UserInfo } from '../stores/auth-store';

describe('AuthStore', () => {
    const mockUser: UserInfo = {
        id: '123',
        name: '张三',
        role: 'sales',
        tenantId: 'tenant-1'
    };
    const mockToken = 'test-token';

    beforeEach(() => {
        (global as any).resetWX();
        authStore.logout();
        jest.clearAllMocks();
    });

    test('初始化时应从存储中加载数据', () => {
        // 重新实例化以测试构造函数
        (wx.getStorageSync as jest.Mock).mockReturnValueOnce(mockUser);
        (wx.getStorageSync as jest.Mock).mockReturnValueOnce(mockToken);

        // 我们需要重新 require 因为 authStore 是单例
        jest.isolateModules(() => {
            const { authStore: newStore } = require('../stores/auth-store');
            expect(newStore.isLoggedIn).toBe(true);
            expect(newStore.token).toBe(mockToken);
            expect(newStore.userInfo).toEqual(mockUser);
        });
    });

    test('setLogin 应更新状态并持久化', () => {
        authStore.setLogin(mockToken, mockUser);

        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.token).toBe(mockToken);
        expect(authStore.userInfo).toEqual(mockUser);

        expect(wx.setStorageSync).toHaveBeenCalledWith('token', mockToken);
        expect(wx.setStorageSync).toHaveBeenCalledWith('userInfo', mockUser);
    });

    test('logout 应清除状态和持久化', () => {
        authStore.setLogin(mockToken, mockUser);
        authStore.logout();

        expect(authStore.isLoggedIn).toBe(false);
        expect(authStore.token).toBe('');
        expect(authStore.userInfo).toBeNull();

        expect(wx.removeStorageSync).toHaveBeenCalledWith('token');
        expect(wx.removeStorageSync).toHaveBeenCalledWith('userInfo');
    });

    test('updateRole 应更新角色并同步存储', () => {
        authStore.setLogin(mockToken, mockUser);
        authStore.updateRole('admin');

        expect(authStore.currentRole).toBe('admin');
        expect(wx.setStorageSync).toHaveBeenCalledWith('userInfo', expect.objectContaining({ role: 'admin' }));
    });

    test('subscribe 应在状态变更时通知', () => {
        const listener = jest.fn();
        const unsubscribe = authStore.subscribe(listener);

        authStore.setLogin(mockToken, mockUser);
        expect(listener).toHaveBeenCalledWith(authStore);

        unsubscribe();
        listener.mockClear();

        authStore.logout();
        expect(listener).not.toHaveBeenCalled();
    });
});
