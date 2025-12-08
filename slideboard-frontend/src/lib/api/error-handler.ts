import * as Sentry from '@sentry/nextjs';
import { PostgrestError } from '@supabase/supabase-js'

/**
 * API 错误类
 */
export class ApiError extends Error {
    code: string
    statusCode: number
    details?: unknown
    override cause?: unknown

    constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, details?: unknown, cause?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.statusCode = statusCode
        this.details = details
        this.cause = cause
    }
}

export function handleSupabaseError(error: PostgrestError): never {
    console.error('Supabase Error:', error)

    // RLS error
    if (error.code === '42501') {
        throw new ApiError('您没有权限执行此操作', 'PERMISSION_DENIED', 403, error)
    }

    // Unique violation
    if (error.code === '23505') {
        throw new ApiError('数据已存在，请勿重复提交', 'DUPLICATE_ENTRY', 409, error)
    }

    // Foreign key violation
    if (error.code === '23503') {
        throw new ApiError('关联数据不存在或已被删除', 'REFERENCE_ERROR', 400, error)
    }

    // Check constraint
    if (error.code === '23514') {
        throw new ApiError('数据格式验证失败', 'VALIDATION_ERROR', 400, error)
    }

    throw new ApiError(error.message || '数据库操作失败', 'DB_ERROR', 500, error)
}

/**
 * 通用错误处理包装器
 */
export async function withErrorHandler<T>(
    operation: () => Promise<T>,
    customErrorMessage?: string
): Promise<T> {
    try {
        return await operation()
    } catch (error) {
        // 记录到 Sentry
        Sentry.captureException(error, {
            extra: {
                customErrorMessage,
                details: (error as any)?.details,
                code: (error as any)?.code
            }
        });

        if (error instanceof ApiError) {
            throw error
        }

        if (error && typeof error === 'object' && 'code' in error) {
            handleSupabaseError(error as PostgrestError)
        }

        // 其他未知错误
        throw new ApiError(
            customErrorMessage || (error as Error).message || '操作失败',
            'UNKNOWN_ERROR',
            500,
            error, // details
            error  // cause
        )
    }
}

/**
 * 认证错误检查
 */
export function checkAuthError(user: unknown | null | undefined): void {
    if (!user) {
        throw new ApiError('用户未登录，请先登录', 'UNAUTHENTICATED', 401)
    }
}

/**
 * 数据验证错误
 */
