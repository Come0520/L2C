'use client';
import { useReportWebVitals } from 'next/web-vitals';

import { env } from '@/config/env';
import { TRACK_WEB_VITALS } from '@/utils/analytics';

export function WebVitals() {
    useReportWebVitals((metric) => {
        // Track web vitals using analytics system
        TRACK_WEB_VITALS(metric);
        
        // Send to API endpoint for storage
        if (env.NODE_ENV === 'production') {
            const body = JSON.stringify(metric);
            const url = '/api/web-vitals';

            // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, body);
            } else {
                fetch(url, { body, method: 'POST', keepalive: true });
            }
        }
    });

    return null;
}
