/**
 * 防抖函数 - 延迟执行函数调用，防止短时间内多次调用
 * 
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒），默认值为300ms
 * @returns {Function & { clear?: () => void }} - 防抖后的函数，带有clear方法用于取消待执行的函数调用
 * 
 * @example
 * // 基本使用
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // 调用防抖函数
 * debouncedSearch('test');
 * debouncedSearch('test 2'); // 前一次调用会被取消
 * 
 * @example
 * // 取消待执行的函数调用
 * const debouncedFn = debounce(() => {
 *   console.log('This will not be called');
 * }, 1000);
 * 
 * debouncedFn();
 * debouncedFn.clear(); // 取消待执行的调用
 */
export function debounce<T extends (...args: any[]) => unknown>(
  func: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) & { clear: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = function(this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };

  debounced.clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * 节流函数 - 限制函数在一定时间内只能执行一次
 * 
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒），默认值为300ms
 * @returns {Function} - 节流后的函数
 * 
 * @example
 * // 基本使用
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event:', window.scrollY);
 * }, 200);
 * 
 * // 添加事件监听
 * window.addEventListener('scroll', throttledScroll);
 * 
 * @example
 * // 按钮点击节流
 * const throttledClick = throttle((e) => {
 *   console.log('Button clicked:', e.target);
 * }, 1000);
 * 
 * // 添加点击事件
 * document.getElementById('my-button')?.addEventListener('click', throttledClick);
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
