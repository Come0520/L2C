'use client';

import { useState, useEffect } from 'react';

/**
 * 防抖 Hook
 * @param value 需要防抖的�?
 * @param delay 延迟时间 (ms)
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
