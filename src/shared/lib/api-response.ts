/**
 * 移动端 API 统一响应格式
 * 
 * 标准响应结构：
 * { success: boolean, data?: T, message?: string, code: number }
 */

import { NextResponse } from 'next/server';

// ============================================================
// 响应类型定义
// ============================================================

/**
 * API 成功响应结构
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    code: number;
}

/**
 * API 错误响应结构
 */
export interface ApiErrorResponse {
    success: false;
    error: string;
    code: number;
    details?: unknown;
}

/**
 * API 分页数据结构
 */
export interface PaginatedData<T> {
    items: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// ============================================================
// 响应工厂函数
// ============================================================

/**
 * 成功响应
 * @param data - 响应数据
 * @param message - 可选消息
 * @param code - HTTP 状态码（默认 200）
 */
export function apiSuccess<T>(
    data: T,
    message?: string,
    code = 200
): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            success: true as const,
            data,
            message,
            code,
        },
        { status: code }
    );
}

/**
 * 错误响应
 * @param error - 错误消息
 * @param code - HTTP 状态码（默认 400）
 * @param details - 可选错误详情
 */
export function apiError(
    error: string,
    code = 400,
    details?: unknown
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            success: false as const,
            error,
            code,
            details,
        },
        { status: code }
    );
}

/**
 * 分页成功响应
 * @param items - 数据列表
 * @param page - 当前页码
 * @param pageSize - 每页条数
 * @param total - 总条数
 */
export function apiPaginated<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
    return apiSuccess({
        items,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    });
}

// ============================================================
// 预定义错误响应
// ============================================================

/**
 * 未授权（401）
 */
export function apiUnauthorized(message = '未登录或登录已过期'): NextResponse<ApiErrorResponse> {
    return apiError(message, 401);
}

/**
 * 无权限（403）
 */
export function apiForbidden(message = '无权限访问'): NextResponse<ApiErrorResponse> {
    return apiError(message, 403);
}

/**
 * 未找到（404）
 */
export function apiNotFound(message = '资源不存在'): NextResponse<ApiErrorResponse> {
    return apiError(message, 404);
}

/**
 * 服务器错误（500）
 */
export function apiServerError(message = '服务器内部错误'): NextResponse<ApiErrorResponse> {
    return apiError(message, 500);
}

/**
 * 参数错误（400）
 */
export function apiBadRequest(message = '请求参数错误'): NextResponse<ApiErrorResponse> {
    return apiError(message, 400);
}
