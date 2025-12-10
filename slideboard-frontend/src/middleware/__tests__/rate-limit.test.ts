import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { RateLimitMiddleware } from '../handlers/rate-limit';

const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: class {
      static fixedWindow = vi.fn();
      limit = mockLimit;
    }
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: class {}
}));

describe('RateLimitMiddleware IP Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 });
    // Use vi.stubEnv for safer env mocking
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://mock');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'mock');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should extract the first IP from x-forwarded-for when req.ip is missing', async () => {
    const middleware = new RateLimitMiddleware();
    const req = {
      nextUrl: { pathname: '/' },
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
      }),
      // ip undefined
      url: 'http://localhost/'
    } as any;

    const res = NextResponse.next();
    const next = vi.fn();

    await middleware.execute(req, res, next);

    expect(mockLimit).toHaveBeenCalledWith('203.0.113.195');
  });

  it('should trim whitespace from the extracted IP', async () => {
    const middleware = new RateLimitMiddleware();
    const req = {
      nextUrl: { pathname: '/' },
      headers: new Headers({
        'x-forwarded-for': '  203.0.113.195  , 70.41.3.18'
      }),
      url: 'http://localhost/'
    } as any;

    const res = NextResponse.next();
    const next = vi.fn();

    await middleware.execute(req, res, next);

    expect(mockLimit).toHaveBeenCalledWith('203.0.113.195');
  });

  it('should prioritize x-forwarded-for over req.ip', async () => {
    const middleware = new RateLimitMiddleware();
    const req = {
      nextUrl: { pathname: '/' },
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195'
      }),
      ip: '192.168.1.1', // Next.js resolved IP (e.g. from local proxy)
      url: 'http://localhost/'
    } as any;

    const res = NextResponse.next();
    const next = vi.fn();

    await middleware.execute(req, res, next);

    // Expectation: use x-forwarded-for because in production it's more reliable for original client IP
    expect(mockLimit).toHaveBeenCalledWith('203.0.113.195');
  });

  it('should fallback to req.ip if x-forwarded-for is missing', async () => {
    const middleware = new RateLimitMiddleware();
    const req = {
      nextUrl: { pathname: '/' },
      headers: new Headers(),
      ip: '192.168.1.1',
      url: 'http://localhost/'
    } as any;

    const res = NextResponse.next();
    const next = vi.fn();

    await middleware.execute(req, res, next);

    expect(mockLimit).toHaveBeenCalledWith('192.168.1.1');
  });

  it('should fallback to unknown if no IP found', async () => {
    const middleware = new RateLimitMiddleware();
    const req = {
      nextUrl: { pathname: '/' },
      headers: new Headers(),
      url: 'http://localhost/'
    } as any;

    const res = NextResponse.next();
    const next = vi.fn();

    await middleware.execute(req, res, next);

    // Current logic: if ip === 'unknown', it calls next() and DOES NOT call limit()
    expect(mockLimit).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
