import { authStore } from '../stores/auth-store';

// We need to mock the App constructor and its instance
let appInstance: any;
global.App = jest.fn((options) => {
    appInstance = options;
}) as any;

// Trigger the App registration
require('../app');

describe('app.ts request', () => {
    beforeEach(() => {
        (global as any).resetWX();
        authStore.logout();
        jest.clearAllMocks();
    });

    test('request 应在 Header 中包含 Authorization Token', async () => {
        const mockToken = 'test-token';
        authStore.setLogin(mockToken, { id: '1', name: 'test', role: 'sales' });

        (wx.request as jest.Mock).mockImplementation(({ success }) => {
            success({ statusCode: 200, data: { success: true, data: 'ok' } });
        });

        await appInstance.request('/test');

        expect(wx.request).toHaveBeenCalledWith(expect.objectContaining({
            header: expect.objectContaining({
                'Authorization': `Bearer ${mockToken}`
            })
        }));
    });

    test('request 遇到 401 应自动退出并重定向', async () => {
        authStore.setLogin('old-token', { id: '1', name: 'test', role: 'sales' });

        (wx.request as jest.Mock).mockImplementation(({ success }) => {
            success({ statusCode: 401, data: { error: 'Unauthorized' } });
        });

        // Mock getCurrentPages for reLaunch check
        (global.getCurrentPages as jest.Mock).mockReturnValue([{ route: 'pages/index/index' }]);

        try {
            await appInstance.request('/test');
        } catch (e) {
            // Expected rejection
        }

        expect(authStore.isLoggedIn).toBe(false);
        expect(wx.reLaunch).toHaveBeenCalledWith({ url: '/pages/landing/landing' });
    });

    test('request 成功时应返回 data', async () => {
        const mockResponse = { success: true, data: { result: 'hello' } };
        (wx.request as jest.Mock).mockImplementation(({ success }) => {
            success({ statusCode: 200, data: mockResponse });
        });

        const result = await appInstance.request('/test');
        expect(result).toEqual(mockResponse);
    });

    test('request 失败时应 reject', async () => {
        (wx.request as jest.Mock).mockImplementation(({ fail }) => {
            fail({ errMsg: 'network timeout' });
        });

        await expect(appInstance.request('/test')).rejects.toEqual(
            expect.objectContaining({ error: '网络请求失败' })
        );
    });
});
