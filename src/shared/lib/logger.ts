/**
 * 通用日志工具
 * 封装 console.log/error，支持结构化 JSON 输出
 */

import type { MobileSession } from '@/shared/middleware/mobile-auth';

// 结构化日志上下文
export interface LogContext {
    route?: string;
    session?: Partial<MobileSession>;
    traceId?: string;
    userId?: string;
    tenantId?: string;
    method?: string;
    statusCode?: number;
    duration?: string;
    [key: string]: unknown;
}

// 结构化日志接口
export interface Logger {
    info(message: string, context?: LogContext, ...args: unknown[]): void;
    warn(message: string, context?: LogContext, ...args: unknown[]): void;
    error(message: string, context?: LogContext, error?: unknown, ...args: unknown[]): void;
}

/**
 * 格式化日志为 JSON 字符串 (生产环境) 或 文本 (开发环境)
 */
function formatLog(level: 'info' | 'warn' | 'error', message: string, context: LogContext = {}, args: unknown[] = [], error?: unknown) {
    const timestamp = new Date().toISOString();
    const { route, session, ...otherContext } = context;

    // 提取 Session 关键信息
    const sessionInfo = session ? {
        userId: session.userId,
        tenantId: session.tenantId,
        role: session.role,
        traceId: session.traceId
    } : {};

    // 合并上下文
    const finalContext = {
        ...otherContext,
        ...sessionInfo,
        route
    };

    if (process.env.NODE_ENV === 'production') {
        // 生产环境：JSON 输出
        const logEntry = {
            timestamp,
            level,
            message,
            context: finalContext,
            args: args.length > 0 ? args : undefined,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error
        };
        return JSON.stringify(logEntry);
    } else {
        // 开发环境：可读文本
        const contextStr = Object.keys(finalContext).length > 0 ? JSON.stringify(finalContext) : '';
        const argsStr = args.length > 0 ? JSON.stringify(args) : '';
        const errorStr = error ? (error instanceof Error ? error.stack : JSON.stringify(error)) : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${route ? `[${route}] ` : ''}${message} ${contextStr} ${argsStr} ${errorStr}`;
    }
}

/**
 * 创建带路由上下文的 Logger
 */
export function createLogger(route: string): Logger {
    return {
        info: (message, context, ...args) => {
            console.log(formatLog('info', message, { route, ...context }, args));
        },
        warn: (message, context, ...args) => {
            console.warn(formatLog('warn', message, { route, ...context }, args));
        },
        error: (message, context, error, ...args) => {
            console.error(formatLog('error', message, { route, ...context }, args, error));
        }
    };
}

/**
 * 遗留 Logger (兼容旧代码)
 * 简单封装 console
 */
export const logger = {
    info: (...args: unknown[]) => {
        console.log('[INFO]', ...args);
    },
    warn: (...args: unknown[]) => {
        console.warn('[WARN]', ...args);
    },
    error: (...args: unknown[]) => {
        console.error('[ERROR]', ...args);
    }
};
