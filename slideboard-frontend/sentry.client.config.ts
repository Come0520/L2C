// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/

import * as Sentry from '@sentry/nextjs';

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Set sampling rates based on environment
const isProduction = environment === 'production';
const tracesSampleRate = isProduction ? 0.1 : 1.0;
const replaysSessionSampleRate = isProduction ? 0.05 : 0.1;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment-specific sampling rates
  tracesSampleRate,

  // Environment configuration
  environment,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate,

  // Add user context if available
  beforeSend(event) {
    // Get user info from local storage or context
    const userInfo = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        event.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          ...event.user
        };
      } catch {
        // Ignore parsing errors
      }
    }
    return event;
  },

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
