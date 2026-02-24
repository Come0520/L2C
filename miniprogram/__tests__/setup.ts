import { vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

// 增强逻辑容器：模拟 setData 和基础数据流
class MockPageContainer {
    public data: any = {};
    public instance: any = {};
    public options: any = {};

    constructor(options: any) {
        this.options = options;
        this.data = { ...(options.data || {}) };

        // 绑定所有方法到 instance 上，并模拟 setData
        Object.keys(options).forEach(key => {
            if (typeof options[key] === 'function') {
                this.instance[key] = options[key].bind(this.instance);
            }
        });

        // 绑定 Component特有的 methods
        if (options.methods) {
            Object.keys(options.methods).forEach(key => {
                if (typeof options.methods[key] === 'function') {
                    this.instance[key] = options.methods[key].bind(this.instance);
                }
            });
        }

        this.instance.data = this.data;
        const setData = (newData: any) => {
            this.data = { ...this.data, ...newData };
            this.instance.data = this.data;
        };
        this.instance.setData = setData;
        (this as any).setData = setData; // 允许容器直接调用
    }
}

// 基础占位符：解决 ReferenceError 并捕获配置对象
(global as any).Page = (opt: any) => {
    (global as any).lastPageOptions = opt;
    (global as any).lastPageContainer = new MockPageContainer(opt);
};
(global as any).Component = (opt: any) => {
    (global as any).lastComponentOptions = opt;
    (global as any).lastComponentContainer = new MockPageContainer(opt);
};
(global as any).App = (opt: any) => { (global as any).lastAppOptions = opt; };

// 增强模拟微信 API：实现真实的存储逻辑映射
const mockStorage: Record<string, any> = {};

(global as any).wx = {
    login: vi.fn(),
    showToast: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    getStorageSync: vi.fn((key: string) => mockStorage[key]),
    setStorageSync: vi.fn((key: string, value: any) => {
        mockStorage[key] = value;
    }),
    removeStorageSync: vi.fn((key: string) => {
        delete mockStorage[key];
    }),
    clearStorageSync: vi.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    }),
    request: vi.fn(),
    switchTab: vi.fn(),
    navigateTo: vi.fn(),
    reLaunch: vi.fn(),
    getSystemInfoSync: vi.fn(() => ({})),
};

// 暴露清理存储的方法
(global as any).clearMockStorage = () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
};

const appInstance: any = {
    globalData: {},
    _request: null,
    get request() { return this._request || (global as any).wx.request; },
    set request(val) { this._request = val; },
    requireRefresh: false
};
(global as any).getApp = () => appInstance;

(global as any).getCurrentPages = vi.fn(() => []) as any;

(global as any).resetWX = () => {
    Object.keys((global as any).wx).forEach(key => {
        if (typeof (global as any).wx[key] === 'function' && (global as any).wx[key].mockClear) {
            (global as any).wx[key].mockClear();
        }
    });
};

export { };
