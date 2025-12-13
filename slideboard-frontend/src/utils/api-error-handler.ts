import { NextResponse } from 'next/server';

import { ApiErrorResponse, ApiErrorCode, ApiSuccessResponse } from '@/types/api';

/**
 * API错误处理工具函数
 * 
 * @description
 * 提供统一的API错误处理机制，包括错误类、响应生成、错误处理和API处理函数包装
 * 用于标准化API响应格式，提高系统的可维护性和用户体验
 */

/**
 * API错误类，用于创建和处理API错误
 */
export class ApiError extends Error {
  /**
   * 创建API错误实例
   * @param {string} code - 错误代码，使用ApiErrorCode枚举
   * @param {string} message - 用户友好的错误消息
   * @param {number} [statusCode=500] - HTTP状态码，默认为500
   * @param {unknown} [details] - 详细错误信息，仅在开发环境中返回
   */
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 生成唯一请求ID
 * 
 * @returns {string} 唯一的UUID请求ID
 */
export const generateRequestId = (): string => {
  return crypto.randomUUID();
};

/**
 * 获取客户端IP地址
 * 
 * @param {Request} request - Next.js请求对象
 * @returns {string | undefined} 客户端IP地址，无法获取时返回undefined
 */
export const getClientIp = (request: Request): string | undefined => {
  // 从X-Forwarded-For头获取真实IP（如果存在）
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // 从X-Real-IP头获取（如果存在）
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  // 从请求对象中获取（Node.js环境）
  if ('socket' in request) {
    // @ts-ignore - socket属性在Node.js环境中存在
    return request.socket.remoteAddress;
  }
  
  return undefined;
};

/**
 * 创建标准化的错误响应
 * 
 * @param {ApiError | Error} error - 错误对象，可以是ApiError或原生Error
 * @param {Request} [request] - Next.js请求对象，用于获取请求上下文
 * @returns {ApiErrorResponse} 标准化的错误响应对象
 */
export const createErrorResponse = (
  error: ApiError | Error,
  request?: Request
): ApiErrorResponse => {
  const isDev = process.env.NODE_ENV === 'development';
  const requestId = request?.headers.get('x-request-id') || generateRequestId();
  
  return {
    success: false,
    error: {
      code: error instanceof ApiError ? error.code : ApiErrorCode.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
      details: isDev ? {
        name: error.name,
        stack: error.stack,
        ...(error instanceof ApiError ? { details: error.details } : {})
      } : undefined,
      timestamp: new Date().toISOString(),
      path: request?.url,
      requestId,
    },
  };
};

/**
 * 创建标准化的成功响应
 * 
 * @template T - 响应数据类型
 * @param {T} data - 响应数据
 * @param {Object} [meta] - 元数据，可选
 * @param {string} [meta.timestamp] - 响应时间戳，默认当前时间
 * @param {string} [meta.version] - API版本，默认从package.json获取
 * @returns {ApiSuccessResponse<T>} 标准化的成功响应对象
 */
export const createSuccessResponse = <T>(
  data: T,
  meta?: {
    timestamp?: string;
    version?: string;
  }
): ApiSuccessResponse<T> => {
  return {
    success: true,
    data,
    meta: {
      timestamp: meta?.timestamp || new Date().toISOString(),
      version: meta?.version || process.env.npm_package_version || '1.0.0',
      ...meta,
    },
  };
};

/**
 * 处理API错误，返回标准化响应
 * 
 * @param {unknown} error - 错误对象，可以是任何类型的错误
 * @param {Request} [request] - Next.js请求对象，用于获取请求上下文
 * @returns {NextResponse} NextResponse对象，包含标准化错误响应
 */
export const handleApiError = (error: unknown, request?: Request): NextResponse => {
  console.error('API Error:', error);
  
  let apiError: ApiError;
  
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof Error) {
    apiError = new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      500,
      error
    );
  } else {
    apiError = new ApiError(
      ApiErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      500,
      error
    );
  }
  
  return NextResponse.json(
    createErrorResponse(apiError, request),
    { status: apiError.statusCode }
  );
};

/**
 * 验证请求参数
 * 
 * @template T - 验证后的数据类型
 * @param {any} schema - Zod或其他验证库的schema
 * @param {unknown} data - 要验证的数据
 * @returns {Promise<{ success: true; data: T } | { success: false; error: ApiError }>} 验证结果，成功返回数据，失败返回ApiError
 */
export const validateRequest = async <T>(
  schema: any,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData as T };
  } catch (error: any) {
    let errorMessage = 'Validation failed';
    let details: unknown = error;
    
    // 如果是Zod错误，提取更友好的错误信息
    if (error.issues) {
      errorMessage = error.issues[0].message;
      details = error.issues;
    }
    
    return {
      success: false,
      error: new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        errorMessage,
        400,
        details
      )
    };
  }
};

/**
 * 包装API处理函数，添加错误处理和响应标准化
 * 
 * @template T - API处理函数类型
 * @param {T} handler - API处理函数，通常是Next.js API路由处理函数
 * @returns {Function} 包装后的API处理函数，自动处理错误并标准化响应
 */
export const withApiHandler = <T extends (...args: any[]) => Promise<NextResponse | any>>(handler: T) => {
  return async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      
      // 如果已经是NextResponse，直接返回
      if (result instanceof NextResponse) {
        return result;
      }
      
      // 否则，包装成成功响应
      return NextResponse.json(createSuccessResponse(result));
    } catch (error) {
      // 处理错误
      return handleApiError(error, args[0] as Request);
    }
  };
};
