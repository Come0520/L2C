/**
 * 通用日志工具
 * 封装 console.log/error，支持结构化 JSON 输出
 */

import type { MobileSession } from '@/shared/middleware/mobile-auth';
import { v4 as uuidv4 } from 'uuid';

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
function formatLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: LogContext = {},
  args: unknown[] = [],
  error?: unknown
) {
  const timestamp = new Date().toISOString();
  const { route, session, ...otherContext } = context;

  // 提取 Session 关键信息
  const sessionInfo = session
    ? {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
      traceId: session.traceId,
    }
    : {};

  // 合并上下文
  const finalContext = {
    ...otherContext,
    ...sessionInfo,
    route,
  };

  if (process.env.NODE_ENV === 'production') {
    // 生产环境：JSON 输出
    const logEntry = {
      timestamp,
      level,
      message,
      context: finalContext,
      args: args.length > 0 ? args : undefined,
      error:
        error instanceof Error
          ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
          : error,
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
    },
  };
}

/**
 * 遗留 Logger (兼容旧代码)
 * 简单封装 console
 */
export const logger = {
  info: (...args: unknown[]) => {
    try {
      console.log('[INFO]', ...args);
    } catch (_e) {
      console.log('[INFO]', 'Unserializable log arguments');
    }
  },
  warn: (...args: unknown[]) => {
    try {
      console.warn('[WARN]', ...args);
    } catch (_e) {
      console.warn('[WARN]', 'Unserializable log arguments');
    }
  },
  error: (...args: unknown[]) => {
    try {
      console.error('[ERROR]', ...args);
    } catch (_e) {
      console.error('[ERROR]', 'Failed to log error due to serialization crash');
    }
  },
};

/**
 * 审计日志 (专用)
 */
export const auditLogger = createLogger('AUDIT');

/**
 * Server Action 性能追踪包装器
 * 自动计算并输出方法的执行时间并携带独立 traceId
 * @param actionName Action 名称，如 'User.login'
 * @param context 补充上下文
 * @param actionFn 要执行的回调函数
 */
export async function withTracing<T>(
  actionName: string,
  actionFn: (traceId: string) => Promise<T>,
  context?: LogContext
): Promise<T> {
  const traceId = uuidv4();
  const startTime = Date.now();
  const tracingLogger = createLogger(`Trace:${actionName}`);

  tracingLogger.info('Action Tracking Started', { ...context, traceId });

  try {
    const result = await actionFn(traceId);
    const duration = Date.now() - startTime;

    tracingLogger.info('Action Tracking Completed', {
      ...context,
      traceId,
      duration: `${duration}ms`,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    tracingLogger.error(
      'Action Tracking Failed',
      { ...context, traceId, duration: `${duration}ms` },
      error
    );
    throw error;
  }
}
