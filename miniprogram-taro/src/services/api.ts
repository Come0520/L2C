/**
 * API 请求封装
 *
 * @description 基于 Taro.request 的统一请求层，自动携带 JWT Token。
 * 从原生 getApp().request() 全局方法迁移为独立模块。
 */
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import { Logger } from '@/utils/logger'

/**
 * API 基础地址
 *
 * 注意：微信小程序真机无法直接访问 localhost。
 * 本地开发时（模拟器）：已自动切换为 http://localhost:3000/api/miniprogram。
 * 请务必在微信开发者工具「详情 → 本地设置」中勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」。
 * 如果需要真机调试，请将 localhost 改为您电脑的局域网 IP（例如 192.168.x.x）。
 */
const BASE_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3004/api/miniprogram'
    : 'https://l2c.asia/api/miniprogram'

/** 通用响应结构 */
interface ApiResponse<T = any> {
    success: boolean
    data: T
    error?: string
    message?: string
}

/** 请求选项 */
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    data?: Record<string, any>
    header?: Record<string, string>
    /** 是否显示加载提示 */
    showLoading?: boolean
    /** 加载提示文字 */
    loadingText?: string
    /** 是否已重试过，内部使用 */
    _retried?: boolean
}

/** 刷新锁：防止并发刷新 */
let isRefreshing = false
/** 等待刷新完成的请求队列 */
let pendingQueue: Array<{
    resolve: (token: string) => void
    reject: (err: any) => void
}> = []

/**
 * 尝试使用微信 wx.login 无感刷新 Token
 * @returns 新 token 或 null
 */
async function refreshToken(): Promise<string | null> {
    try {
        const loginRes = await Taro.login()
        if (!loginRes.code) return null

        const res = await Taro.request({
            url: `${BASE_URL}/auth/wx-login`,
            method: 'POST',
            data: { code: loginRes.code },
            header: { 'Content-Type': 'application/json' },
        })

        if (res.statusCode === 200 && res.data?.data?.token) {
            const { token, user } = res.data.data
            // 静默更新全局 Token 中状态
            useAuthStore.getState().setLogin(token, user)
            return token
        }
        return null
    } catch {
        return null
    }
}

/**
 * 发送 API 请求
 *
 * @param url - 请求路径（会自动拼接 BASE_URL）
 * @param options - 请求选项
 * @returns API 响应
 */
async function request<T = any>(
    url: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const {
        method = 'GET',
        data,
        header = {},
        showLoading = false,
        loadingText = '加载中...',
        _retried = false,
    } = options

    // 获取 Token
    const token = useAuthStore.getState().token

    if (showLoading) {
        Taro.showLoading({ title: loadingText, mask: true })
    }

    const startTime = Date.now()
    Logger.info('API', '发起请求', { method, url })

    try {
        const res = await Taro.request({
            url: `${BASE_URL}${url}`,
            method,
            data,
            header: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...header,
            },
        })

        if (showLoading) {
            Taro.hideLoading()
        }

        Logger.info('API', '请求成功', { method, url, statusCode: res.statusCode, duration: Date.now() - startTime })

        // HTTP 401 → 尝试无感刷新 Token
        if (res.statusCode === 401) {
            if (!_retried) {
                if (!isRefreshing) {
                    isRefreshing = true
                    const newToken = await refreshToken()
                    isRefreshing = false

                    if (newToken) {
                        // 刷新成功，重试所有积压的请求
                        pendingQueue.forEach(p => p.resolve(newToken))
                        pendingQueue = []
                        // 重试当前请求 (标记 _retried: true 防止无限循环)
                        return request(url, { ...options, _retried: true })
                    } else {
                        // 刷新失败，走正常登出报错逻辑
                        pendingQueue.forEach(p => p.reject(new Error('刷新失败')))
                        pendingQueue = []
                    }
                } else {
                    // 正在有请求正在刷新 Token，当前请求进入队列挂起
                    return new Promise<ApiResponse<T>>((resolve, reject) => {
                        pendingQueue.push({
                            resolve: () => {
                                resolve(request(url, { ...options, _retried: true }))
                            },
                            reject: () => {
                                reject(new Error('登录已过期'))
                            }
                        })
                    })
                }
            }

            // 如果已经重试过还是 401，或者刷新失败，执行登出
            useAuthStore.getState().logout()
            Taro.navigateTo({ url: '/pages/login/index' })
            return { success: false, data: null as any, error: '登录已过期' }
        }

        // HTTP 错误
        if (res.statusCode >= 400) {
            return {
                success: false,
                data: null as any,
                error: (res.data && res.data.error) || (res.data && res.data.message) || `请求失败 (${res.statusCode})`,
            }
        }

        return {
            success: true,
            data: res.data?.data ?? res.data,
        }
    } catch (err: any) {
        if (showLoading) {
            Taro.hideLoading()
        }

        Logger.error('API', '请求失败', err instanceof Error ? err : new Error(String(err.errMsg || err)), { method, url })

        const isNetworkError = err?.errMsg?.includes('request:fail') || err?.errMsg === 'Failed to fetch' || err?.message === 'Network Error'

        if (method === 'GET' && isNetworkError && !_retried) {
            Logger.warn('API', '网络错误，重试一次', { method, url })
            return request(url, { ...options, _retried: true })
        }

        return {
            success: false,
            data: null as any,
            error: err.errMsg || '网络请求失败',
        }
    }
}

/** 并发 GET 请求缓存，用于防抖和合并请求 */
const pendingGets = new Map<string, Promise<ApiResponse<any>>>()

function getRequestKey(url: string, data?: any): string {
    return `${url}|${JSON.stringify(data || {})}`
}

/**
 * API 工具对象，提供便捷的 GET/POST/PUT/DELETE 方法
 *
 * @example
 * ```tsx
 * const res = await api.get('/dashboard')
 * const res = await api.post('/leads', { data: { name: '张三' } })
 * ```
 */
export const api = {
    get: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) => {
        const key = getRequestKey(url, options?.data);
        if (pendingGets.has(key)) {
            return pendingGets.get(key)! as Promise<ApiResponse<T>>;
        }
        const promise = request<T>(url, { ...options, method: 'GET' })
            .finally(() => pendingGets.delete(key));
        pendingGets.set(key, promise);
        return promise;
    },

    post: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'POST' }),

    put: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'PUT' }),

    delete: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'DELETE' }),

    patch: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'PATCH' }),

    upload: async (url: string, filePath: string, name: string = 'file', options: { showLoading?: boolean, loadingText?: string } = {}): Promise<ApiResponse<any>> => {
        const { showLoading = false, loadingText = '上传中...' } = options
        const token = useAuthStore.getState().token

        if (showLoading) {
            Taro.showLoading({ title: loadingText, mask: true })
        }

        try {
            const res = await Taro.uploadFile({
                url: `${BASE_URL}${url}`,
                filePath,
                name,
                header: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                }
            })

            if (showLoading) Taro.hideLoading()

            const data = JSON.parse(res.data)
            if (res.statusCode >= 400 || (data && data.success === false)) {
                return {
                    success: false,
                    data: null as any,
                    error: data.error || data.message || `上传失败 (${res.statusCode})`
                }
            }

            return {
                success: true,
                data: data.data !== undefined ? data.data : data
            }
        } catch (err: any) {
            if (showLoading) Taro.hideLoading()
            return {
                success: false,
                data: null as any,
                error: err.errMsg || '网络请求失败'
            }
        }
    }
}
