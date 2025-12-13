import { NextRequest } from 'next/server';

import { env } from '@/config/env';
import { withApiHandler, createSuccessResponse } from '@/utils/api-error-handler';

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

export const POST = withApiHandler(async (request: NextRequest) => {
  const metric: WebVitalsMetric = await request.json();
  
  // 记录到控制台（开发环境）
  if (env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
  
  // 示例：发送到 Sentry（如果已配置）
  if (env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureMessage('Web Vitals', {
      level: 'info',
      extra: metric,
    });
  }
  
  // 这里可以添加将数据存储到数据库的代码
  // 例如：使用 Supabase 或其他数据库
  
  return createSuccessResponse({ message: 'Metric received' });
});

