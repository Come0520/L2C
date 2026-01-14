/**
 * 通用日志工具
 * 封装 console.log/error，未来可接入 Sentry 或其他监控系�?
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

        // TODO: 可在此处接入 Sentry
        // if (process.env.NODE_ENV === 'production') {
        //   Sentry.captureException(args[0], { extra: { context: args.slice(1) } });
        // }
    }
};
