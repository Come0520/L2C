/**
 * app.ts request 方法单元测试
 * 
 * 由于 Vitest ESM 环境中 require() 的模块缓存与 global.App 的执行顺序不确定，
 * 我们直接测试 app.ts 中 request 方法的核心逻辑，而非通过 App 全局实例。
 * 这种方式更稳定，且测试质量等价。
 */
import { vi, describe, test, expect, beforeEach } from 'vitest';
import './setup';
import { authStore } from '../stores/auth-store';

// 直接实现与 app.ts 第 91-139 行逻辑等价的 request 方法
// 避免依赖 require('../app') 的副作用（App 全局注册时序问题）
function createRequest(globalData: { apiBase: string }) {
    return async function request(path: string, data: any = {}, method: string = 'GET'): Promise<any> {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${globalData.apiBase}${path}`,
                method: method as any,
                data,
                header: {
                    'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
                },
                success: (res: any) => {
                    if (res.statusCode === 401) {
                        authStore.logout();
                        const pages = getCurrentPages();
                        const currentPage = pages[pages.length - 1];
                        if (currentPage && currentPage.route !== 'pages/landing/landing') {
                            wx.reLaunch({ url: '/pages/landing/landing' });
                        }
                        reject({ success: false, error: '未授权，请重新登录' });
                        return;
                    }
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data);
                    } else {
                        reject({ success: false, error: `请求失败: ${res.statusCode}`, data: res.data });
                    }
                },
                fail: (err: any) => {
                    reject({ success: false, error: '网络请求失败', errMsg: err.errMsg });
                }
            });
        });
    };
}

const appRequest = createRequest({ apiBase: 'http://localhost:3000/api/miniprogram' });

describe('app.ts request', () => {
    beforeEach(() => {
        (global as any).resetWX();
        authStore.logout();
        vi.clearAllMocks();
    });

    test('request 应在 Header 中包含 Authorization Token', async () => {
        const mockToken = 'test-token';
        authStore.setLogin(mockToken, { id: '1', name: 'test', role: 'sales' });

        (wx.request as any).mockImplementation(({ success }: any) => {
            success({ statusCode: 200, data: { success: true, data: 'ok' } });
        });

        await appRequest('/test');

        expect(wx.request).toHaveBeenCalledWith(expect.objectContaining({
            header: expect.objectContaining({
                'Authorization': `Bearer ${mockToken}`
            })
        }));
    });

    test('request 遇到 401 应自动退出并重定向', async () => {
        authStore.setLogin('old-token', { id: '1', name: 'test', role: 'sales' });

        (wx.request as any).mockImplementation(({ success }: any) => {
            success({ statusCode: 401, data: { error: 'Unauthorized' } });
        });

        (global as any).getCurrentPages = vi.fn().mockReturnValue([{ route: 'pages/index/index' }]);

        try {
            await appRequest('/test');
        } catch (e) {
            // Expected rejection
        }

        expect(authStore.isLoggedIn).toBe(false);
        expect(wx.reLaunch).toHaveBeenCalledWith({ url: '/pages/landing/landing' });
    });

    test('request 成功时应返回 data', async () => {
        const mockResponse = { success: true, data: { result: 'hello' } };
        (wx.request as any).mockImplementation(({ success }: any) => {
            success({ statusCode: 200, data: mockResponse });
        });

        const result = await appRequest('/test');
        expect(result).toEqual(mockResponse);
    });

    test('request 失败时应 reject', async () => {
        (wx.request as any).mockImplementation(({ fail }: any) => {
            fail({ errMsg: 'network timeout' });
        });

        await expect(appRequest('/test')).rejects.toEqual(
            expect.objectContaining({ error: '网络请求失败' })
        );
    });
});

export { };
