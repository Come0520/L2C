/**
 * 节流点击工具
 * 防止用户在短时间内多次点击提交按钮导致重复请求
 *
 * @description 使用闭包维护锁状态，在指定间隔内仅执行一次。
 * 适用于所有提交类操作（创建线索、提交报价单、保存表单等）。
 *
 * @param fn - 需要节流保护的原函数
 * @param delay - 节流间隔（毫秒），默认 1500ms
 * @returns 包装后的节流函数
 *
 * @example
 * ```typescript
 * // 在 Page methods 中使用
 * Page({
 *   onSubmit: throttleTap(async function(this: any) {
 *     await submitData();
 *   })
 * })
 * ```
 */
export function throttleTap(fn, delay = 1500) {
    let locked = false;
    return function (...args) {
        if (locked) {
            console.log('[throttleTap] 操作被节流，请稍后再试');
            return;
        }
        locked = true;
        setTimeout(() => {
            locked = false;
        }, delay);
        return fn.apply(this, args);
    };
}
/**
 * 防抖装饰器
 * 用于搜索输入等场景，只在用户停止输入后才触发
 *
 * @param fn - 原函数
 * @param wait - 等待时间（毫秒），默认 300ms
 * @returns 包装后的防抖函数
 */
export function debounce(fn, wait = 300) {
    let timer = null;
    return function (...args) {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, wait);
    };
}
