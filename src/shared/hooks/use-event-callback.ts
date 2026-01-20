/**
 * useEventCallback - 创建稳定的回调引用
 * 
 * 返回一个永不改变的函数引用，但总是调用最新的回调
 * 适用于事件处理器，避免因频繁更新而导致子组件重渲染
 */
import { useCallback } from 'react';
import { useLatest } from './use-latest';

export function useEventCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T
): T {
    const ref = useLatest(fn);

    return useCallback(
        (...args: Parameters<T>) => ref.current(...args),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    ) as T;
}
