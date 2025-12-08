import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';

// Web Vitals 数据类型定义
interface WebVitalsMetric {
  id: string;
  name: string;
  delta: number;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries: unknown[];
  navigationType: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalsMetric = await request.json();
    
    // 这里可以添加将数据发送到监控服务的代码
    // 例如：Sentry、New Relic、Datadog 等
    
    // 示例：记录到控制台（生产环境中应移除或替换）
    if (env.NODE_ENV === 'development') {
      console.log('Web Vitals:', metric);
    }
    
    // 示例：发送到 Sentry（如果已配置）
    // if (env.SENTRY_DSN) {
    //   import('@sentry/nextjs').then((Sentry) => {
    //     Sentry.captureMessage('Web Vitals', {
    //       level: 'info',
    //       extra: metric,
    //     });
    //   });
    // }
    
    return NextResponse.json({ success: true, message: 'Metric received' });
  } catch (error) {
    console.error('Error processing Web Vitals:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing metric' },
      { status: 500 }
    );
  }
}
