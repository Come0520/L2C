/**
 * 性能监控工具
 * 负责采集页面加载耗时、setData 频率及资源占用情况
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = [];
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
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    /**
     * 记录性能数据
     */
    log(data) {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const page = currentPage ? currentPage.route : 'app';
        this.metrics.push(Object.assign(Object.assign({}, data), { page }));
        // 当积累到一定量时可以异步上报，或者在 ErrorReporter flush 时带过去
        if (this.metrics.length > 50) {
            this.metrics.shift();
        }
    }
    /**
     * 追踪页面加载耗时
     */
    trackPageLoad(page, duration) {
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
    trackSetData(size) {
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
    getMetrics() {
        return this.metrics;
    }
}
export const performanceMonitor = PerformanceMonitor.getInstance();
