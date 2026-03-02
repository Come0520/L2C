/**
 * API 请求封装
 *
 * @description 基于 Taro.request 的统一请求层，自动携带 JWT Token。
 * 从原生 getApp().request() 全局方法迁移为独立模块。
 */
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'

/** API 基础地址 — 根据环境自动切换 */
const BASE_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api'
    : 'https://l2c.come0520.com/api'

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
    } = options

    // 获取 Token
    const token = useAuthStore.getState().token

    if (showLoading) {
        Taro.showLoading({ title: loadingText, mask: true })
    }

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
                error: res.data?.message || `请求失败 (${res.statusCode})`,
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
        console.error(`API 请求失败: ${method} ${url}`, err)
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
