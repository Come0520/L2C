'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
    useReportWebVitals((metric) => {
        const body = JSON.stringify({
            ...metric,
            pathname: window.location.pathname,
            href: window.location.href,
        });

        if (process.env.NODE_ENV === 'development') {
            // 开发环境：在控制台醒目打印 Web Vitals
            // eslint-disable-next-line no-console
            console.log(
                `%c WebVitals: ${metric.name} `,
                'background: #333; color: #bada55',
                metric.value,
                metric
            );
        } else {
            // 生产环境：使用 sendBeacon 异步上报，不阻塞主线程
            // 如果 sendBeacon 失败，可以回退到 fetch
            const url = '/api/monitoring/vitals';
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, body);
            } else {
                fetch(url, {
                    body,
                    method: 'POST',
                    keepalive: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
        }
    });

    return null;
}
