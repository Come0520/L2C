import { describe, it, expect, vi } from 'vitest';
import { cn, formatCurrency, formatDate, generateDocNo, maskPhone, truncate } from '@/shared/lib/utils';

describe('utils.ts', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            expect(cn('a', 'b')).toBe('a b');
            expect(cn('a', { b: true, c: false })).toBe('a b');
        });

        it('should handle tailwind conflict', () => {
            expect(cn('p-4 p-8')).toBe('p-8');
        });
    });

    describe('formatCurrency', () => {
        it('should format numbers as CNY currency by default', () => {
            // Note: non-breaking space might be present depending on environment
            const result = formatCurrency(1234.56).replace(/\s/g, ' ');
            expect(result).toMatch(/¥1,234.56/);
        });
    });

    describe('formatDate', () => {
        it('should format date object correctly', () => {
            const date = new Date(2024, 0, 1); // 2024-01-01
            expect(formatDate(date)).toBe('2024/01/01');
        });

        it('should format date string correctly', () => {
            expect(formatDate('2024-01-01')).toBe('2024/01/01');
        });
    });

    describe('generateDocNo', () => {
        it('should generate a document number with given prefix', () => {
            vi.useFakeTimers();
            const date = new Date(2024, 0, 1);
            vi.setSystemTime(date);

            const docNo = generateDocNo('LD');
            expect(docNo).toMatch(/^LD20240101\d{3}$/);

            vi.useRealTimers();
        });
    });

    describe('maskPhone', () => {
        it('should mask the middle of a phone number', () => {
            expect(maskPhone('13812345678')).toBe('138****5678');
        });

        it('should return original string if it is not a valid 11-digit phone', () => {
            expect(maskPhone('123')).toBe('123');
        });
    });

    describe('truncate', () => {
        it('should truncate text longer than given length', () => {
            expect(truncate('hello world', 5)).toBe('hello...');
        });

        it('should not truncate text shorter than or equal to given length', () => {
            expect(truncate('hello', 5)).toBe('hello');
            expect(truncate('hi', 5)).toBe('hi');
        });
    });

    describe('formatDateTime', () => {
        it('should format date with time correctly', async () => {
            // Dynamic import to get formatDateTime
            const { formatDateTime } = await import('@/shared/lib/utils');
            const date = new Date(2024, 0, 15, 14, 30); // 2024-01-15 14:30
            const result = formatDateTime(date);
            // Format: YYYY/MM/DD HH:mm (zh-CN locale)
            expect(result).toMatch(/2024\/01\/15/);
            expect(result).toMatch(/14:30/);
        });
    });

    describe('sleep', () => {
        it('should delay execution for specified milliseconds', async () => {
            const { sleep } = await import('@/shared/lib/utils');
            const start = Date.now();
            await sleep(100);
            const elapsed = Date.now() - start;
            // Allow some tolerance (80-150ms)
            expect(elapsed).toBeGreaterThanOrEqual(80);
            expect(elapsed).toBeLessThan(200);
        });
    });

    describe('debounce', () => {
        it('should only call the function once after delay', async () => {
            vi.useFakeTimers();
            const { debounce } = await import('@/shared/lib/utils');
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100);

            // Call multiple times rapidly
            debouncedFn();
            debouncedFn();
            debouncedFn();

            // Function should not be called yet
            expect(mockFn).not.toHaveBeenCalled();

            // Fast-forward time
            vi.advanceTimersByTime(100);

            // Now it should be called once
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });

        it('should reset timer on subsequent calls', async () => {
            vi.useFakeTimers();
            const { debounce } = await import('@/shared/lib/utils');
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100);

            debouncedFn();
            vi.advanceTimersByTime(50);
            debouncedFn(); // Reset the timer
            vi.advanceTimersByTime(50);

            // Still not called because timer was reset
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            // Now it should be called
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });
    });
});

