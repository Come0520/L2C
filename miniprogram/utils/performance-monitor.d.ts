/**
 * 性能采样项定义
 */
export interface PerformanceMetric {
    page: string;
    metric: 'PAGE_LOAD' | 'SET_DATA' | 'MEMORY_LEVEL';
    value: number;
    timestamp: number;
    extra?: string;
}
/**
 * 性能监控工具
 * 负责采集页面加载耗时、setData 频率及资源占用情况
 */
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): PerformanceMonitor;
    /**
     * 记录性能数据
     */
    log(data: Omit<PerformanceMetric, 'page'>): void;
    /**
     * 追踪页面加载耗时
     */
    trackPageLoad(page: string, duration: number): void;
    /**
     * 追踪 setData 大小
     */
    trackSetData(size: number): void;
    /**
     * 获取当前所有采样指标
     */
    getMetrics(): PerformanceMetric[];
}
export declare const performanceMonitor: PerformanceMonitor;
export {};
