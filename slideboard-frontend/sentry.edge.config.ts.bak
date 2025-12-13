import * as Sentry from "@sentry/nextjs";

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const tracesSampleRate = isProduction ? 0.1 : 1.0;

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate,

    environment,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: !isProduction,
});
