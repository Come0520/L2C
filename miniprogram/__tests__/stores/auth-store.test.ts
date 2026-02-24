import { authStore, UserRole } from '../../stores/auth-store';

describe('AuthStore', () => {
    beforeEach(() => {
        // 每个测试前重置实例状态和模拟存储
        authStore.logout();
        // 清理所有订阅
        (authStore as any)._listeners = [];
    });

    test('should be a singleton (exported instance)', () => {
        expect(authStore).toBeDefined();
    });

    test('should initialize with empty values by default', () => {
        expect(authStore.token).toBe('');
        expect(authStore.userInfo).toBeNull();
        expect(authStore.isLoggedIn).toBe(false);
    });

    test('should save login data and notify listeners', () => {
        const token = 'test-token';
        const userInfo = { id: '1', name: 'Test User', role: 'admin' as UserRole };
        const listener = vi.fn();

        authStore.subscribe(listener);
        authStore.setLogin(token, userInfo);

        expect(authStore.token).toBe(token);
        expect(authStore.userInfo).toEqual(userInfo);
        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.currentRole).toBe('admin');

        // 验证持久化
        expect(wx.getStorageSync('token')).toBe(token);
        expect(wx.getStorageSync('userInfo')).toEqual(userInfo);

        // 验证通知
        expect(listener).toHaveBeenCalledWith(authStore);
    });

    test('should handle logout correctly', () => {
        authStore.setLogin('token', { id: '1', name: 'User', role: 'sales' as UserRole });
        authStore.logout();

        expect(authStore.token).toBe('');
        expect(authStore.userInfo).toBeNull();
        expect(authStore.isLoggedIn).toBe(false);
        expect(authStore.currentRole).toBe('guest');

        expect(wx.getStorageSync('token')).toBeUndefined();
        expect(wx.getStorageSync('userInfo')).toBeUndefined();
    });

    test('should update role correctly', () => {
        authStore.setLogin('token', { id: '1', name: 'User', role: 'sales' as UserRole });
        authStore.updateRole('admin' as UserRole);

        expect(authStore.currentRole).toBe('admin');
        expect(wx.getStorageSync('userInfo').role).toBe('admin');
    });

    test('should allow unsubscribing from updates', () => {
        const listener = vi.fn();
        const unsubscribe = authStore.subscribe(listener);

        unsubscribe();
        authStore.setLogin('t', { id: '1', name: 'U', role: 'customer' as UserRole });

        expect(listener).not.toHaveBeenCalled();
    });
});

export { };
