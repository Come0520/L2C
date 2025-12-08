import { NextRequest, NextResponse } from 'next/server';

import { BaseMiddleware } from '../base';

// Simple in-memory store for rate limiting
// Note: In a distributed environment (serverless/edge), this should be replaced with Redis/Upstash
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Configuration
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const DEFAULT_LIMIT = 100;
const AUTH_LIMIT = 20;

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

export class RateLimitMiddleware extends BaseMiddleware {
    async execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void> {
        // 1. Cleanup old entries periodically
        const now = Date.now();
        if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
            rateLimitMap.clear();
            lastCleanup = now;
        }

        // 2. Identify client (IP)
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
        if (ip === 'unknown') {
            // If we can't identify IP, we skip rate limiting or block? Skipping for safety in dev.
            return next();
        }

        // 3. Determine limit based on path
        const path = request.nextUrl.pathname;
        const isAuthRoute = path.startsWith('/api/auth') || path.startsWith('/login');
        const limit = isAuthRoute ? AUTH_LIMIT : DEFAULT_LIMIT;

        // 4. Rate Limit Logic (Fixed Window)
        const currentWindowStart = now - (now % WINDOW_SIZE_MS);
        const key = `${ip}:${currentWindowStart}`; // Key includes window to auto-expire

        const record = rateLimitMap.get(key) || { count: 0, windowStart: currentWindowStart };

        // If we switched windows implicitly (by key change), old keys are just garbage collected eventually

        // Increment
        record.count++;
        rateLimitMap.set(key, record);

        // 5. Check Limit
        if (record.count > limit) {
            // Return 429 Too Many Requests
            if (path.startsWith('/api')) {
                return NextResponse.json(
                    { error: 'Too Many Requests', message: 'Please try again later.' },
                    { status: 429 }
                );
            } else {
                // Redirect to error page for UI routes
                return NextResponse.redirect(new URL('/too-many-requests', request.url));
            }
        }

        // 6. Add Headers (Optional but good practice)
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString());

        return next();
    }
}
