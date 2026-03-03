/**
 * API 请求封装
 *
 * @description 基于 Taro.request 的统一请求层，自动携带 JWT Token。
 * 从原生 getApp().request() 全局方法迁移为独立模块。
 */
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import { Logger } from '@/utils/logger'

/** API 基础地址 — 根据环境自动切换 */
const BASE_URL = 'http://localhost:3000/api/miniprogram'

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

        // HTTP 401 → 自动登出
        if (res.statusCode === 401) {
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
    get: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'GET' }),

    post: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'POST' }),

    put: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'PUT' }),

    delete: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'DELETE' }),

    patch: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
        request<T>(url, { ...options, method: 'PATCH' }),
}
