import * as Sentry from '@sentry/nextjs';

import { env } from '@/config/env';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await Sentry.init({
            dsn: env.SENTRY_DSN,
            // Adjust this value in production, or use tracesSampler for greater control
            tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: false,
        });
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await Sentry.init({
            dsn: env.SENTRY_DSN,
            // Adjust this value in production, or use tracesSampler for greater control
            tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: false,
        });
    }
}
