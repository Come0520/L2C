/**
 * 小程序埋点追踪工具
 *
 * @description 轻量级用户行为追踪系统，自动收集：
 * - 页面 PV（通过 onShow 触发）
 * - 按钮点击事件（手动调用 tracker.tap()）
 * - 接口耗时（从 request 拦截器自动采集）
 *
 * 数据采用批量上报策略：5 秒攒批 + 退出时 flush
 */
import { authStore } from '../stores/auth-store';
class Tracker {
    constructor() {
        /** 事件队列 */
        this.queue = [];
        /** 定时器 */
        this.flushTimer = null;
        /** 上报间隔（毫秒） */
        this.FLUSH_INTERVAL = 5000;
        /** 单次上报最大条数 */
        this.MAX_BATCH_SIZE = 50;
    }
    /**
     * 记录页面浏览事件
     * @param path - 页面路径
     */
    pv(path) {
        this.enqueue({
            type: 'pv',
            name: path,
            timestamp: Date.now()
        });
    }
    /**
     * 记录按钮点击事件
     * @param buttonId - 按钮标识符，如 'btn_create_lead'
     * @param extra - 附加数据
     */
    tap(buttonId, extra) {
        this.enqueue({
            type: 'tap',
            name: buttonId,
            timestamp: Date.now(),
            data: extra
        });
    }
    /**
     * 记录 API 请求耗时
     * @param path - 接口路径
     * @param duration - 耗时（毫秒）
     * @param success - 是否成功
     */
    api(path, duration, success) {
        this.enqueue({
            type: 'api',
            name: path,
            timestamp: Date.now(),
            data: { duration, success }
        });
    }
    /**
     * 将事件加入队列并启动定时上报
     */
    enqueue(event) {
        this.queue.push(event);
        // 达到批次上限立即上报
        if (this.queue.length >= this.MAX_BATCH_SIZE) {
            this.flush();
            return;
        }
        // 启动定时器
        if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
        }
    }
    /**
     * 批量上报并清空队列
     * 在 App.onHide / App.onUnload 时也应调用此方法
     */
    flush() {
        var _a;
        if (this.queue.length === 0)
            return;
        const events = this.queue.splice(0, this.MAX_BATCH_SIZE);
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        try {
            const app = getApp();
            const apiBase = ((_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.apiBase) || 'http://localhost:3000/api/miniprogram';
            wx.request({
                url: `${apiBase}/analytics/track`,
                method: 'POST',
                data: { events },
                header: {
                    'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
                },
                success: () => {
                    // 静默成功，不打印日志避免噪音
                },
                fail: () => {
                    // 上报失败不影响业务，静默丢弃
                    console.warn('[Tracker] 埋点上报失败，已丢弃', events.length, '条事件');
                }
            });
        }
        catch (_b) {
            // 防御性处理
        }
    }
}
/** 全局埋点实例 */
export const tracker = new Tracker();
