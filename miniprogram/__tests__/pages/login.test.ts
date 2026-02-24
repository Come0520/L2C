import '../setup';
import { authStore } from '../../stores/auth-store';

describe('Login Page', () => {
    let container: any;

    beforeEach(async () => {
        (global as any).resetWX();
        vi.clearAllMocks();
        authStore.logout();

        if (!container) {
            await import('../../pages/login/login');
            container = (global as any).lastPageContainer;
        }

        if (container) {
            container.setData({
                account: '',
                password: '',
                loggingIn: false,
                errorMsg: ''
            });
        }

        if (!container) throw new Error('Login logic not loaded');
    });

    test('初始化状态正确', () => {
        expect(container.data.account).toBe('');
        expect(container.data.password).toBe('');
        expect(container.data.loggingIn).toBe(false);
        expect(container.data.errorMsg).toBe('');
    });

    test('输入校验 - 账号为空', async () => {
        await container.instance.onLogin();
        expect(container.data.errorMsg).toBe('请输入账号');
    });

    test('输入校验 - 密码为空', async () => {
        container.setData({ account: 'admin' });
        await container.instance.onLogin();
        expect(container.data.errorMsg).toBe('请输入密码');
    });

    test('登录成功后的处理', async () => {
        const mockData = {
            success: true,
            data: {
                token: 'test-token',
                user: { id: '1', name: 'Tester', role: 'admin' },
                tenantStatus: 'active'
            }
        };
        (global as any).getApp().request = vi.fn().mockResolvedValue(mockData);

        container.setData({
            account: 'admin',
            password: 'password123'
        });

        await container.instance.onLogin();

        expect(authStore.token).toBe('test-token');
        expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '登录成功' }));
        // reLaunch is in setTimeout(..., 1000)
    });

    test('登录失败后的错误显示', async () => {
        (global as any).getApp().request = vi.fn().mockResolvedValue({
            success: false,
            error: '账号或密码错误'
        });

        container.setData({
            account: 'wrong',
            password: 'wrong'
        });

        await container.instance.onLogin();

        expect(container.data.errorMsg).toBe('账号或密码错误');
        expect(container.data.loggingIn).toBe(false);
    });
});

export {};
