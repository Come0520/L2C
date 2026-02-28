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
declare class Tracker {
    /** 事件队列 */
    private queue;
    /** 定时器 */
    private flushTimer;
    /** 上报间隔（毫秒） */
    private readonly FLUSH_INTERVAL;
    /** 单次上报最大条数 */
    private readonly MAX_BATCH_SIZE;
    /**
     * 记录页面浏览事件
     * @param path - 页面路径
     */
    pv(path: string): void;
    /**
     * 记录按钮点击事件
     * @param buttonId - 按钮标识符，如 'btn_create_lead'
     * @param extra - 附加数据
     */
    tap(buttonId: string, extra?: Record<string, unknown>): void;
    /**
     * 记录 API 请求耗时
     * @param path - 接口路径
     * @param duration - 耗时（毫秒）
     * @param success - 是否成功
     */
    api(path: string, duration: number, success: boolean): void;
    /**
     * 将事件加入队列并启动定时上报
     */
    private enqueue;
    /**
     * 批量上报并清空队列
     * 在 App.onHide / App.onUnload 时也应调用此方法
     */
    flush(): void;
}
/** 全局埋点实例 */
export declare const tracker: Tracker;
export {};
