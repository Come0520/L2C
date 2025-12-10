'use client';
import { useReportWebVitals } from 'next/web-vitals';
import { env } from '@/config/env';

export function WebVitals() {
    useReportWebVitals((metric) => {
        if (env.NODE_ENV === 'production') {
            const body = JSON.stringify(metric);
            const url = '/api/web-vitals';

            // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, body);
            } else {
                fetch(url, { body, method: 'POST', keepalive: true });
            }
        } else {
            console.log('[Web Vitals]', metric);
        }
    });

    return null;
}
