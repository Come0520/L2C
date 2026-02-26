import { authStore } from '../stores/auth-store';
/**
 * 错误上报工具
 * 负责捕获、过滤、缓存并批量上报小程序运行时的各类异常
 */
export class ErrorReporter {
    constructor() {
        this.queue = [];
        this.maxQueueSize = 20;
        this.flushTimer = null;
        this.logManager = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null;
    }
    static getInstance() {
        if (!ErrorReporter.instance) {
            ErrorReporter.instance = new ErrorReporter();
        }
        return ErrorReporter.instance;
    }
    /**
     * 初始化全局错误监听
     */
    init() {
        console.log('[ErrorReporter] 初始化...');
        // 捕获 JS 运行错误
        wx.onError((error) => {
            this.report({
                message: typeof error === 'string' ? error : error.message,
                stack: typeof error === 'string' ? undefined : error.stack,
                type: 'JS_ERROR',
                timestamp: Date.now()
            });
        });
        // 捕获未处理的 Promise Rejection
        wx.onUnhandledRejection((res) => {
            this.report({
                message: res.reason || 'Unhandled Rejection',
                type: 'PROMISE_ERROR',
                timestamp: Date.now(),
                metadata: { promise: res.promise }
            });
        });
    }
    /**
     * 上报错误
     */
    report(error) {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const path = currentPage ? currentPage.route : 'unknown';
        const fullError = Object.assign(Object.assign({}, error), { path });
        // 1. 本地控制台打印
        console.error(`[ErrorReporter] 捕获到错误 (${fullError.type}):`, fullError.message);
        // 2. 写入微信实时日志管理器 (供后台拉取)
        if (this.logManager) {
            this.logManager.error(`[${fullError.type}]`, fullError.path, fullError.message, fullError.stack || '', JSON.stringify(fullError.metadata || {}));
        }
        this.queue.push(fullError);
        this.checkQueue();
    }
    /**
     * 检查队列是否需要上报
     */
    checkQueue() {
        if (this.queue.length >= this.maxQueueSize) {
            this.flush();
        }
        else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flush(), 10000); // 10秒定时上报
        }
    }
    /**
     * 执行批量上报
     */
    async flush() {
        var _a;
        if (this.queue.length === 0)
            return;
        const errorsToReport = [...this.queue];
        this.queue = [];
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        try {
            // 使用原生 wx.request 避免与 App 上封装的 request 产生循环依赖陷阱
            const app = getApp();
            const apiBase = ((_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.apiBase) || 'http://localhost:3000/api/miniprogram';
            wx.request({
                url: `${apiBase}/log/error`,
                method: 'POST',
                data: { errors: errorsToReport },
                header: {
                    'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
                },
                success: () => {
                    console.log('[ErrorReporter] 批量上报成功', errorsToReport.length);
                },
                fail: (err) => {
                    console.error('[ErrorReporter] 上报失败，重新加入队列', err);
                    // 补偿机制：失败回插列首
                    this.queue = [...errorsToReport, ...this.queue].slice(0, 50);
                }
            });
        }
        catch (e) {
            console.error('[ErrorReporter] 上报异常', e);
        }
    }
}
export const errorReporter = ErrorReporter.getInstance();
