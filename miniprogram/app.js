/**
 * L2C 微信小程序入口
 */
import { authStore } from './stores/auth-store';
import { errorReporter } from './utils/error-reporter';
import { getCache, setCache, isCacheable } from './utils/cache-manager';
import { tracker } from './utils/tracker';
import { isAppEnv } from './utils/env';
// 后端 API 基础地址
const API_BASE = 'http://localhost:3000/api/miniprogram'; // Local Development
App({
    globalData: {
        apiBase: API_BASE,
        baseUrl: API_BASE.replace('/api/miniprogram', ''),
    },
    onLaunch() {
        var _a, _b;
        console.log('L2C 小程序启动');
        // 初始化错误上报
        errorReporter.init();
        // 监听页面不存在 (404 监控)
        (_a = wx.onPageNotFound) === null || _a === void 0 ? void 0 : _a.call(wx, (res) => {
            errorReporter.report({
                message: `页面不存在: ${res.path}`,
                type: 'JS_ERROR',
                timestamp: Date.now(),
                metadata: Object.assign({}, res)
            });
            wx.switchTab({ url: '/pages/index/index' }); // 回退机制
        });
        // 监听内存告警
        (_b = wx.onMemoryWarning) === null || _b === void 0 ? void 0 : _b.call(wx, (res) => {
            errorReporter.report({
                message: `内存不足告警: 级别 ${res.level}`,
                type: 'WX_ERROR',
                timestamp: Date.now(),
                metadata: Object.assign({}, res)
            });
        });
    },
    onHide() {
        // 小程序切入后台时，强制上报积压的埋点
        tracker.flush();
    },
    async wxLogin() {
        // [兼容性] 如果是多端应用 (App) 模式，原生 wx.login 将失效（抛错）。
        // 这里提供一个显式的失败回调，引导业务层进入“验证码登录/账号登录”降级逻辑
        if (isAppEnv()) {
            console.warn('[App Entry] 多端应用模式暂不支持静默微信授权登录，强行走本地降级逻辑。');
            return Promise.resolve({ success: false, error: '当前环境不支持快捷登录，请选择手机号登录' });
        }
        return new Promise((resolve) => {
            wx.login({
                success: async (res) => {
                    if (res.code) {
                        try {
                            const result = await this.request('/auth/wx-login', { code: res.code }, 'POST');
                            if (result.success) {
                                if (result.data.user) {
                                    authStore.setLogin(result.data.token, result.data.user);
                                }
                                resolve({ success: true, openId: result.data.openId });
                            }
                            else {
                                resolve({ success: false, error: result.error });
                            }
                        }
                        catch (error) {
                            console.error('登录失败:', error);
                            const errMsg = (error === null || error === void 0 ? void 0 : error.errMsg) || (error === null || error === void 0 ? void 0 : error.message) || JSON.stringify(error);
                            resolve({ success: false, error: `请求异常: ${errMsg}` });
                        }
                    }
                    else {
                        resolve({ success: false, error: '获取登录凭证失败' });
                    }
                },
                fail: (err) => {
                    console.error('wx.login 失败:', err);
                    resolve({ success: false, error: `微信登录失败: ${err.errMsg}` });
                }
            });
        });
    },
    /**
     * 封装请求方法
     * - GET 请求支持本地缓存（缓存优先 + 网络异步更新）
     * - 网络失败自动重试 1 次
     */
    async request(path, data = {}, method = 'GET') {
        var _a;
        // 策略：GET 请求且可缓存 → 先返回缓存，后台更新
        const useCache = method === 'GET' && isCacheable(path);
        if (useCache) {
            const cached = getCache(path);
            if (cached) {
                // 后台静默刷新缓存（不阻塞返回）
                this._doRequest(path, data, method).then((freshData) => {
                    setCache(path, freshData);
                }).catch(() => { });
                return cached;
            }
        }
        // 首次请求或无缓存：发起网络请求，失败重试 1 次
        try {
            const result = await this._doRequest(path, data, method);
            // 成功后写入缓存
            if (useCache)
                setCache(path, result);
            return result;
        }
        catch (err) {
            // 网络失败自动重试 1 次
            if ((_a = err === null || err === void 0 ? void 0 : err.errMsg) === null || _a === void 0 ? void 0 : _a.includes('request:fail')) {
                await new Promise(r => setTimeout(r, 1000));
                const retryResult = await this._doRequest(path, data, method);
                if (useCache)
                    setCache(path, retryResult);
                return retryResult;
            }
            throw err;
        }
    },
    /**
     * 底层请求执行（内部方法）
     */
    _doRequest(path, data, method) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${this.globalData.apiBase}${path}`,
                method: method,
                data,
                timeout: 15000,
                header: {
                    'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
                },
                success: (res) => {
                    const duration = Date.now() - startTime;
                    if (res.statusCode === 401) {
                        console.warn('[Request] 401 Unauthorized, logging out...');
                        tracker.api(path, duration, false);
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
                        tracker.api(path, duration, true);
                        resolve(res.data);
                    }
                    else {
                        errorReporter.report({
                            message: `接口请求返回状态码异常: ${res.statusCode}`,
                            type: 'API_ERROR',
                            timestamp: Date.now(),
                            metadata: { path, statusCode: res.statusCode }
                        });
                        tracker.api(path, duration, false);
                        reject({ success: false, error: `请求失败: ${res.statusCode}`, data: res.data });
                    }
                },
                fail: (err) => {
                    const duration = Date.now() - startTime;
                    console.error('[Request] Fail:', err);
                    errorReporter.report({
                        message: err.errMsg || 'Network Failure',
                        type: 'API_ERROR',
                        timestamp: Date.now(),
                        metadata: { path, method }
                    });
                    tracker.api(path, duration, false);
                    reject({ success: false, error: '网络请求失败', errMsg: err.errMsg });
                }
            });
        });
    }
});
