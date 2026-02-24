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
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetric[] = [];

    private constructor() {
        // 监听内存警告
        wx.onMemoryWarning((res) => {
            this.log({
                metric: 'MEMORY_LEVEL',
                value: res.level, // 5: TRIM_MEMORY_RUNNING_MODERATE, 10: TRIM_MEMORY_RUNNING_LOW, 15: TRIM_MEMORY_RUNNING_CRITICAL
                timestamp: Date.now(),
                extra: 'Memory Warning'
            });
        });
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * 记录性能数据
     */
    public log(data: Omit<PerformanceMetric, 'page'>): void {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const page = currentPage ? currentPage.route : 'app';

        this.metrics.push({ ...data, page });

        // 当积累到一定量时可以异步上报，或者在 ErrorReporter flush 时带过去
        if (this.metrics.length > 50) {
            this.metrics.shift();
        }
    }

    /**
     * 追踪页面加载耗时
     */
    public trackPageLoad(page: string, duration: number): void {
        this.log({
            metric: 'PAGE_LOAD',
            value: duration,
            timestamp: Date.now(),
            extra: page
        });
    }

    /**
     * 追踪 setData 大小
     */
    public trackSetData(size: number): void {
        if (size > 1024 * 100) { // 超过 100KB 记录警告
            this.log({
                metric: 'SET_DATA',
                value: size,
                timestamp: Date.now(),
                extra: 'Large setData detected'
            });
        }
    }

    /**
     * 获取当前所有采样指标
     */
    public getMetrics(): PerformanceMetric[] {
        return this.metrics;
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export {};
