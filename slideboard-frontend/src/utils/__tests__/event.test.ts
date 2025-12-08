import { debounce, throttle } from '../index';

describe('event utilities', () => {
  // Mock setTimeout and clearTimeout for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should execute only once after multiple rapid calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call the debounced function multiple times quickly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Fast-forward time by 150ms
      vi.advanceTimersByTime(150);

      // Verify the function was called only once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should pass correct arguments to the debounced function', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      const testArgs = ['test', 123, { key: 'value' }];
      debouncedFn(...testArgs);

      vi.advanceTimersByTime(150);

      expect(mockFn).toHaveBeenCalledWith(...testArgs);
    });

    it('should execute after specified wait time', () => {
      const mockFn = vi.fn();
      const waitTime = 100;
      const debouncedFn = debounce(mockFn, waitTime);

      debouncedFn();
      
      // Verify function hasn't been called before wait time
      vi.advanceTimersByTime(waitTime - 1);
      expect(mockFn).not.toHaveBeenCalled();

      // Verify function is called after wait time
      vi.advanceTimersByTime(2);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should execute immediately with zero wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn();
      
      // For zero wait time, function should execute immediately
      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle very short wait time (1ms)', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 1);

      debouncedFn();
      vi.advanceTimersByTime(1);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute once when called only once', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(150);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute multiple times when calls are spaced apart', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call once and wait for debounce to complete
      debouncedFn('call1');
      vi.advanceTimersByTime(150);

      // Call again after debounce has completed
      debouncedFn('call2');
      vi.advanceTimersByTime(150);

      // Verify function was called twice
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, 'call1');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'call2');
    });
  });

  describe('advanced features', () => {
    it('should reset timer on each call', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first call');
      vi.advanceTimersByTime(50);
      
      // Reset the timer with a new call
      debouncedFn('second call');
      vi.advanceTimersByTime(50);
      
      // First call shouldn't have executed yet
      expect(mockFn).not.toHaveBeenCalled();
      
      // Wait for the full debounce time from the second call
      vi.advanceTimersByTime(50);
      
      // Only the second call should have executed
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second call');
    });

    it('should preserve function context (this binding)', () => {
      const context = { value: 'test' };
      const mockFn = vi.fn(function(this: any) {
        return this.value;
      });
      
      const debouncedFn = debounce(mockFn, 100);
      const boundDebouncedFn = debouncedFn.bind(context);

      boundDebouncedFn();
      vi.advanceTimersByTime(150);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn.mock.results[0]?.value).toBe('test');
    });

    it('should handle function with no arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(150);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith();
    });

    it('should handle multiple different debounced functions independently', () => {
      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      
      const debouncedFn1 = debounce(mockFn1, 100);
      const debouncedFn2 = debounce(mockFn2, 100);

      debouncedFn1('fn1 call');
      debouncedFn2('fn2 call');
      
      vi.advanceTimersByTime(150);

      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn1).toHaveBeenCalledWith('fn1 call');
      
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledWith('fn2 call');
    });
  });

  describe('throttle function', () => {
    it('should execute immediately on first call', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1');
      
      // Should execute immediately
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should not execute again within the throttle limit', () => {
      const mockFn = vi.fn();
      const limit = 100;
      const throttledFn = throttle(mockFn, limit);

      throttledFn('arg1');
      throttledFn('arg2'); // Should be ignored
      throttledFn('arg3'); // Should be ignored
      
      vi.advanceTimersByTime(limit / 2);
      throttledFn('arg4'); // Should still be ignored
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should execute again after throttle limit has passed', () => {
      const mockFn = vi.fn();
      const limit = 100;
      const throttledFn = throttle(mockFn, limit);

      throttledFn('arg1');
      vi.advanceTimersByTime(limit + 1);
      throttledFn('arg2');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'arg2');
    });

    it('should pass correct arguments to the throttled function', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      const testArgs = ['test', 123, { key: 'value' }];
      throttledFn(...testArgs);
      
      expect(mockFn).toHaveBeenCalledWith(...testArgs);
    });

    it('should handle multiple calls after throttle limit', () => {
      const mockFn = vi.fn();
      const limit = 100;
      const throttledFn = throttle(mockFn, limit);

      // First call - should execute
      throttledFn('call1');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Wait and call again - should execute
      vi.advanceTimersByTime(limit + 1);
      throttledFn('call2');
      expect(mockFn).toHaveBeenCalledTimes(2);
      
      // Wait and call again - should execute
      vi.advanceTimersByTime(limit + 1);
      throttledFn('call3');
      expect(mockFn).toHaveBeenCalledTimes(3);
      
      expect(mockFn).toHaveBeenNthCalledWith(1, 'call1');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'call2');
      expect(mockFn).toHaveBeenNthCalledWith(3, 'call3');
    });
  });
});
