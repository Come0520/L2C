import { NextRequest, NextResponse } from 'next/server';
import { BaseMiddleware } from '../base';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Fallback in-memory store for development/testing when Redis is not configured
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Configuration
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const DEFAULT_LIMIT = 100;
const AUTH_LIMIT = 20;

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

export class RateLimitMiddleware extends BaseMiddleware {
  private defaultLimiter: Ratelimit | null = null;
  private authLimiter: Ratelimit | null = null;

  constructor() {
    super();
    // Initialize Upstash Redis if environment variables are present
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      const redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      this.defaultLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(DEFAULT_LIMIT, '60 s'),
        analytics: true,
        prefix: '@upstash/ratelimit/default',
      });

      this.authLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(AUTH_LIMIT, '60 s'),
        analytics: true,
        prefix: '@upstash/ratelimit/auth',
      });
    }
  }

  async execute(
    request: NextRequest,
    response: NextResponse,
    next: () => Promise<void>
  ): Promise<NextResponse | void> {
    // 1. Identify client (IP) with robust handling for proxies
    // Prioritize x-forwarded-for as it is standard in Vercel/Edge environments
    const forwardedFor = request.headers.get('x-forwarded-for');
    // Note: request.ip is available in Next.js Middleware but might be missing in some type definitions
    let ip = forwardedFor ? (forwardedFor.split(',')[0] || '').trim() : (request as any).ip || 'unknown';

    // Skip rate limiting if IP cannot be determined (dev/test safety)
    if (ip === 'unknown') {
      return next();
    }

    const path = request.nextUrl.pathname;
    const isAuthRoute =
      path.startsWith('/api/auth') || path.startsWith('/login');
    const limit = isAuthRoute ? AUTH_LIMIT : DEFAULT_LIMIT;

    // Use Upstash Redis if available
    if (this.defaultLimiter && this.authLimiter) {
      try {
        const limiter = isAuthRoute ? this.authLimiter : this.defaultLimiter;
        const { success, limit: usedLimit, remaining, reset } = await limiter.limit(ip);

        if (!success) {
          if (path.startsWith('/api')) {
             return NextResponse.json(
               { error: 'Too Many Requests', message: 'Please try again later.' },
               { status: 429 }
             );
          } else {
             return NextResponse.redirect(new URL('/too-many-requests', request.url));
          }
        }
        
        // Add Headers
        response.headers.set('X-RateLimit-Limit', usedLimit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());
        
        return next();
      } catch (error) {
        console.error('Upstash Rate Limit Error:', error);
        // If Redis fails, fall through to in-memory fallback or allow request?
        // Let's fall through to in-memory to maintain some protection, 
        // or just return next() to avoid blocking users during outages.
        // Returning next() is safer for availability.
        return next();
      }
    }

    // --- Fallback: In-Memory Implementation ---
    
    // 1. Cleanup old entries periodically
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
        rateLimitMap.clear();
        lastCleanup = now;
    }

    // 2. Rate Limit Logic (Fixed Window)
    const currentWindowStart = now - (now % WINDOW_SIZE_MS);
    const key = `${ip}:${currentWindowStart}:${isAuthRoute ? 'auth' : 'default'}`;

    const record = rateLimitMap.get(key) || { count: 0, windowStart: currentWindowStart };

    // Increment
    record.count++;
    rateLimitMap.set(key, record);

    // 3. Check Limit
    if (record.count > limit) {
        if (path.startsWith('/api')) {
            return NextResponse.json(
                { error: 'Too Many Requests', message: 'Please try again later.' },
                { status: 429 }
            );
        } else {
            return NextResponse.redirect(new URL('/too-many-requests', request.url));
        }
    }

    // 4. Add Headers
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString());

    return next();
  }
}
