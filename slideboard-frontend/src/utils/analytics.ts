import * as Sentry from '@sentry/nextjs';

import { env } from '@/config/env';

// Types for analytics
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

interface PageViewEvent {
  pageName: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  duration?: number;
}

interface TimerData {
  startTime: number;
  properties?: Record<string, unknown>;
}

// Analytics configuration
const CONFIG = {
  batchSize: 10,
  batchInterval: 5000, // 5 seconds
  enabled: env.NODE_ENV !== 'development',
  debug: env.NODE_ENV !== 'production',
};

// In-memory storage for events and timers
let eventQueue: AnalyticsEvent[] = [];
let pageViewQueue: PageViewEvent[] = [];
const timers: Record<string, TimerData> = {};
let batchTimer: NodeJS.Timeout | null = null;

/**
 * Track a custom event
 * @param category Event category (e.g., "user", "order", "system")
 * @param action Event action (e.g., "click", "create", "update")
 * @param label Event label (optional, e.g., "submit-button", "order-123")
 * @param properties Additional event properties (optional)
 */
export const TRACK_EVENT = (category: string, action: string, label?: string, properties?: Record<string, unknown>): void => {
  const event: AnalyticsEvent = {
    category,
    action,
    label,
    properties,
    timestamp: Date.now(),
  };

  if (CONFIG.debug) {
    /* eslint-disable-next-line no-console */
    console.log('Analytics Event:', event);
  }

  if (CONFIG.enabled) {
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category,
      message: `${action} - ${label || ''}`,
      data: properties,
      level: 'info',
    });

    eventQueue.push(event);
    flushEventsIfNeeded();
  }
};

/**
 * Track a page view
 * @param pageName Name of the page (e.g., "dashboard", "orders-create")
 * @param properties Additional page view properties (optional)
 */
export const TRACK_PAGE_VIEW = (pageName: string, properties?: Record<string, unknown>): void => {
  const pageView: PageViewEvent = {
    pageName,
    properties,
    timestamp: Date.now(),
  };

  if (CONFIG.debug) {
    /* eslint-disable-next-line no-console */
    console.log('Page View:', pageView);
  }

  if (CONFIG.enabled) {
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page View: ${pageName}`,
      data: properties,
      level: 'info',
    });

    pageViewQueue.push(pageView);
    flushEventsIfNeeded();
  }
};

/**
 * Identify a user
 * @param userId User ID
 * @param traits User traits/properties
 */
export const IDENTIFY_USER = (userId: string, traits?: Record<string, unknown>): void => {
  if (CONFIG.debug) {
    /* eslint-disable-next-line no-console */
    console.log('Identify User:', userId, traits);
  }

  if (CONFIG.enabled) {
    Sentry.setUser({ id: userId, ...traits });
  }
};

/**
 * Clear user identity
 */
export const RESET_USER = (): void => {
  if (CONFIG.debug) {
    /* eslint-disable-next-line no-console */
    console.log('Reset User');
  }

  if (CONFIG.enabled) {
    Sentry.setUser(null);
  }
};

/**
 * Start a timer for measuring operation duration
 * @param key Unique identifier for the timer
 * @param properties Additional properties to associate with the timer (optional)
 */
export const START_TIMER = (key: string, properties?: Record<string, unknown>): void => {
  timers[key] = {
    startTime: Date.now(),
    properties,
  };
};

/**
 * Stop a timer and track the duration
 * @param key Unique identifier for the timer
 * @param properties Additional properties to include with the duration event (optional)
 * @returns Duration in milliseconds, or null if timer not found
 */
export const STOP_TIMER = (key: string, properties?: Record<string, unknown>): number | null => {
  const timer = timers[key];
  if (!timer) {
    if (CONFIG.debug) {
      /* eslint-disable-next-line no-console */
      console.warn(`Timer not found: ${key}`);
    }
    return null;
  }

  const duration = Date.now() - timer.startTime;
  delete timers[key];

  // Track duration as an event
  TRACK_EVENT(
    'performance',
    'duration',
    key,
    {
      duration,
      ...timer.properties,
      ...properties,
    }
  );

  return duration;
};

/**
 * Track an error with Sentry
 * @param error The error object
 * @param context Additional context properties (optional)
 */
export const TRACK_ERROR = (error: Error, context?: Record<string, unknown>): void => {
  if (CONFIG.debug) {
    /* eslint-disable-next-line no-console */
    console.error('Tracked Error:', error, context);
  }

  if (CONFIG.enabled) {
    Sentry.captureException(error, { extra: context });
  }
};

/**
 * Flush events if queue reaches batch size or interval
 */
const flushEventsIfNeeded = (): void => {
  // If queue reaches batch size, flush immediately
  if (eventQueue.length >= CONFIG.batchSize || pageViewQueue.length >= CONFIG.batchSize) {
    flushEvents();
    return;
  }

  // If batch timer not set, start it
  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      flushEvents();
    }, CONFIG.batchInterval);
  }
};

/**
 * Flush all queued events
 */
const flushEvents = (): void => {
  // Clear batch timer
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  // Skip if no events to flush
  if (eventQueue.length === 0 && pageViewQueue.length === 0) {
    return;
  }

  // Create payload
  const payload = {
    events: [...eventQueue],
    pageViews: [...pageViewQueue],
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
  };

  // Clear queues
  eventQueue = [];
  pageViewQueue = [];

  // Send to server (placeholder implementation)
  // In a real implementation, this would send to your analytics backend
  try {
    // For now, we'll just log to console in debug mode
    if (CONFIG.debug) {
      /* eslint-disable-next-line no-console */
      console.log('Flushing analytics events:', payload);
    }

    // Example API call (commented out)
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to flush analytics events:', error);
  }
};

/**
 * Manually flush all pending events
 */
export const FLUSH = (): void => {
  flushEvents();
};

// Flush events when page is unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', FLUSH);
}

// Export all functions
export default {
  TRACK_EVENT,
  TRACK_PAGE_VIEW,
  IDENTIFY_USER,
  RESET_USER,
  START_TIMER,
  STOP_TIMER,
  TRACK_ERROR,
  FLUSH,
};