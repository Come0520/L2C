import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../use-debounce';

/**
 * useDebounce hook 单元测试
 *
 * 测试目标：验证防抖逻辑的行为，保证在延迟时间内快速连续变化的值
 * 只会在最后一次变化后延迟触发，从而减少订单等列表页面的无效查询次数。
 */
describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('初始值应立即返回', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('值变化后，在延迟时间内应仍返回旧值', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
            initialProps: { value: 'initial' },
        });

        // 变更 value
        rerender({ value: 'updated' });

        // 延迟尚未到，应仍是旧值
        expect(result.current).toBe('initial');
    });

    it('经过 delay 毫秒后，应返回新值', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
            initialProps: { value: 'initial' },
        });

        rerender({ value: 'updated' });

        // 推进时间超过 delay
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });

    it('连续快速变化（模拟用户连续输入），只应在最后一次变化后触发更新', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
            initialProps: { value: '' },
        });

        // 模拟用户快速连续输入 "窗帘"
        rerender({ value: '窗' });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: '窗帘' });
        act(() => { vi.advanceTimersByTime(100); });

        // 此时距最后一次输入只过了 100ms，应仍是旧值
        expect(result.current).toBe('');

        // 再推进 400ms（共 500ms），触发最终防抖
        act(() => { vi.advanceTimersByTime(400); });

        // 只应拿到最后输入的值
        expect(result.current).toBe('窗帘');
    });

    it('默认延迟为 500ms（不传 delay 参数）', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'b' });

        // 499ms 内应保持旧值
        act(() => { vi.advanceTimersByTime(499); });
        expect(result.current).toBe('a');

        // 500ms 后更新
        act(() => { vi.advanceTimersByTime(1); });
        expect(result.current).toBe('b');
    });
});
