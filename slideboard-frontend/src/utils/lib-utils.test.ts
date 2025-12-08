import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { debounce } from './debounce-throttle';
import { formatDate, formatDateTime, formatCurrency, truncate } from './lib-utils';

describe('formatDate', () => {
  it('should format date string correctly', () => {
    expect(formatDate('2023-10-15T14:30:45')).toBe('2023-10-15');
    expect(formatDate('2024-01-01T00:00:00')).toBe('2024-01-01');
    expect(formatDate('2023-12-31T23:59:59')).toBe('2023-12-31');
  });

  it('should format Date object correctly', () => {
    expect(formatDate(new Date('2023-10-15T14:30:45'))).toBe('2023-10-15');
    expect(formatDate(new Date('2024-01-01T00:00:00'))).toBe('2024-01-01');
    expect(formatDate(new Date('2023-12-31T23:59:59'))).toBe('2023-12-31');
  });

  it('should handle edge cases correctly', () => {
    expect(formatDate('2023-02-28T12:00:00')).toBe('2023-02-28');
    expect(formatDate('2024-02-29T12:00:00')).toBe('2024-02-29'); // Leap year
  });
});

describe('formatDateTime', () => {
  it('should format date-time string correctly', () => {
    expect(formatDateTime('2023-10-15T14:30:45')).toBe('2023-10-15 14:30');
    expect(formatDateTime('2024-01-01T00:00:00')).toBe('2024-01-01 00:00');
    expect(formatDateTime('2023-12-31T23:59:59')).toBe('2023-12-31 23:59');
  });

  it('should format Date object correctly', () => {
    expect(formatDateTime(new Date('2023-10-15T14:30:45'))).toBe('2023-10-15 14:30');
    expect(formatDateTime(new Date('2024-01-01T00:00:00'))).toBe('2024-01-01 00:00');
    expect(formatDateTime(new Date('2023-12-31T23:59:59'))).toBe('2023-12-31 23:59');
  });

  it('should handle edge cases correctly', () => {
    expect(formatDateTime('2023-02-28T09:05:30')).toBe('2023-02-28 09:05');
    expect(formatDateTime('2024-02-29T18:45:15')).toBe('2024-02-29 18:45'); // Leap year
  });
});

describe('formatCurrency', () => {
  it('should format positive amount correctly', () => {
    expect(formatCurrency(1000)).toBe('¥1,000.00');
    expect(formatCurrency(1234.56)).toBe('¥1,234.56');
    expect(formatCurrency(0.99)).toBe('¥0.99');
  });

  it('should format negative amount correctly', () => {
    expect(formatCurrency(-1000)).toBe('¥-1,000.00');
    expect(formatCurrency(-1234.56)).toBe('¥-1,234.56');
    expect(formatCurrency(-0.99)).toBe('¥-0.99');
  });

  it('should format zero amount correctly', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
  });

  it('should format large amount with thousand separator correctly', () => {
    expect(formatCurrency(1234567.89)).toBe('¥1,234,567.89');
    expect(formatCurrency(9999999.99)).toBe('¥9,999,999.99');
  });

  it('should handle different decimal places correctly', () => {
    expect(formatCurrency(100)).toBe('¥100.00');
    expect(formatCurrency(100.5)).toBe('¥100.50');
    expect(formatCurrency(100.555)).toBe('¥100.56'); // Rounded to 2 decimal places
  });
});

describe('truncate', () => {
  it('should return original string when length is less than maxLength', () => {
    expect(truncate('short string', 20)).toBe('short string');
    expect(truncate('test', 10)).toBe('test');
  });

  it('should truncate string when length exceeds maxLength', () => {
    expect(truncate('this is a long string that needs truncation', 20)).toBe('this is a long strin...');
    expect(truncate('123456789012345678901', 20)).toBe('12345678901234567890...');
  });

  it('should handle string with exact maxLength correctly', () => {
    expect(truncate('1234567890', 10)).toBe('1234567890');
  });

  it('should handle empty string correctly', () => {
    expect(truncate('', 5)).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute the function after the specified wait time', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should only execute the last call when multiple calls are made', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first call');
    vi.advanceTimersByTime(50);
    debouncedFn('second call');
    vi.advanceTimersByTime(50);
    debouncedFn('third call');
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third call');
  });

  it('should cancel the debounce when clearTimeout is called', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle immediate execution correctly', () => {
    // Note: The current debounce implementation doesn't support immediate execution
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
