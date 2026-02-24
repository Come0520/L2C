/**
 * 结构化日志工具
 */
export const logger = {
    info(tag: string, message: string, data?: unknown): void {
        console.log(`[${tag}] ${message}`, data || '');
    },
    warn(tag: string, message: string, data?: unknown): void {
        console.warn(`[${tag}] ${message}`, data || '');
    },
    error(tag: string, message: string, error?: unknown): void {
        console.error(`[${tag}] ${message}`, error || '');
    }
};

export {};
