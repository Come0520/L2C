'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
    useReportWebVitals((metric) => {
        console.log('[Web Vitals]', metric);
        // Future: Send to analytics endpoint
        // navigator.sendBeacon('/api/analytics', JSON.stringify(metric));
    });

    return null;
}
