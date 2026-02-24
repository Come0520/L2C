/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    error?: string;
    code?: number;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
}

/**
 * 分页响应包装
 */
export interface PaginatedData<T> {
    list: T[];
    total: number;
    hasMore: boolean;
}

export {};
