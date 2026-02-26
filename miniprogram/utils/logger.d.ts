/**
 * 结构化日志工具
 */
export declare const logger: {
    info(tag: string, message: string, data?: unknown): void;
    warn(tag: string, message: string, data?: unknown): void;
    error(tag: string, message: string, error?: unknown): void;
};
export {};
