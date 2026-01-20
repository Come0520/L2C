/**
 * useLatest - 始终返回最新值的 ref
 * 
 * 用于在回调中访问最新状态而无需将其添加到依赖数组
 * 这可以避免不必要的重渲染和过时闭包问题
 */
import { useRef, useLayoutEffect, useEffect } from 'react';

// 服务端使用 useEffect，客户端使用 useLayoutEffect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useLatest<T>(value: T) {
    const ref = useRef(value);

    useIsomorphicLayoutEffect(() => {
        ref.current = value;
    });

    return ref;
}
