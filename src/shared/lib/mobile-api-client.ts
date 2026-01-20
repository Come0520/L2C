'use client';

/**
 * 移动端 API 客户端
 *
 * 封装 fetch，提供:
 * - 自动添加 Authorization 头
 * - 统一 401 处理 (跳转登录)
 * - 请求/响应日志 (开发模式)
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
}

const ACCESS_TOKEN_KEY = 'l2c_mobile_access_token';

/**
 * 获取存储的 Token
 */
function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * 处理 401 未授权错误
 */
function handleUnauthorized() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem('l2c_mobile_refresh_token');
        localStorage.removeItem('l2c_mobile_user');
        window.location.href = '/mobile/login';
    }
}

/**
 * 移动端 API 请求
 *
 * @param endpoint - API 端点 (相对路径，如 '/tasks')
 * @param options - 请求选项
 * @returns API 响应
 */
export async function mobileApi<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {} } = options;

    const token = getStoredToken();
    const url = endpoint.startsWith('/api') ? endpoint : `/api/mobile${endpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        // 处理 401 未授权
        if (response.status === 401) {
            handleUnauthorized();
            return { success: false, message: '登录已过期，请重新登录' };
        }

        const data = await response.json();
        return data as ApiResponse<T>;
    } catch (error) {
        console.error('API Request Error:', error);
        return { success: false, message: '网络错误，请检查网络连接' };
    }
}

// ============================================================
// 便捷方法
// ============================================================

/**
 * GET 请求
 */
export function mobileGet<T = unknown>(endpoint: string) {
    return mobileApi<T>(endpoint, { method: 'GET' });
}

/**
 * POST 请求
 */
export function mobilePost<T = unknown>(endpoint: string, body?: unknown) {
    return mobileApi<T>(endpoint, { method: 'POST', body });
}

/**
 * PUT 请求
 */
export function mobilePut<T = unknown>(endpoint: string, body?: unknown) {
    return mobileApi<T>(endpoint, { method: 'PUT', body });
}

/**
 * PATCH 请求
 */
export function mobilePatch<T = unknown>(endpoint: string, body?: unknown) {
    return mobileApi<T>(endpoint, { method: 'PATCH', body });
}

/**
 * DELETE 请求
 */
export function mobileDelete<T = unknown>(endpoint: string) {
    return mobileApi<T>(endpoint, { method: 'DELETE' });
}
