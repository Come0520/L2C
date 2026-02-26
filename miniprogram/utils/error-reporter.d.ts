/**
 * 错误上报项定义
 */
export interface ErrorItem {
    message: string;
    stack?: string;
    type: 'JS_ERROR' | 'PROMISE_ERROR' | 'API_ERROR' | 'WX_ERROR';
    path?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * 错误上报工具
 * 负责捕获、过滤、缓存并批量上报小程序运行时的各类异常
 */
export declare class ErrorReporter {
    private static instance;
    private queue;
    private maxQueueSize;
    private flushTimer;
    private logManager;
    private constructor();
    static getInstance(): ErrorReporter;
    /**
     * 初始化全局错误监听
     */
    init(): void;
    /**
     * 上报错误
     */
    report(error: Omit<ErrorItem, 'path'>): void;
    /**
     * 检查队列是否需要上报
     */
    private checkQueue;
    /**
     * 执行批量上报
     */
    flush(): Promise<void>;
}
export declare const errorReporter: ErrorReporter;
export {};
