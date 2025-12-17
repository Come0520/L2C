// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Get current environment
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';

// Configure sampling rates based on environment
const tracesSampleRate = isProduction ? 0.1 : 1.0;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://387a4df0b765b2c7db5fb4f857f4d203@o4510533396987904.ingest.us.sentry.io/4510533401051136",

  // Environment configuration
  environment,

  // Define how likely traces are sampled
  tracesSampleRate,

  // Enable logs to be sent to Sentry
  _experiments: {
    enableLogs: true,
  },

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,

  // Debug mode in development
  debug: !isProduction,

  // Ignore specific errors
  ignoreErrors: [
    // Network errors
    'Network Error',
    'Failed to fetch',
    'Load failed',
    // Auth related (expected behavior)
    'User not authenticated',
    'Session expired',
  ],

  // Filter out transactions for static assets
  beforeSendTransaction(event) {
    // Don't send transactions for static files
    if (event.transaction?.includes('/_next/') ||
      event.transaction?.includes('/static/')) {
      return null;
    }
    return event;
  },

  // Add custom tags for better filtering
  initialScope: {
    tags: {
      app: 'l2c-server',
      version: process.env.npm_package_version || 'unknown',
    },
  },
});
