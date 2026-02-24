import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/shared/lib/logger';
import { auth } from '@/shared/lib/auth';

/**
 * 接收前端上报的 Web Vitals 核心性能指标
 * @param req 包含 metric 数据的请求
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const session = await auth();

        const { id, name, value, rating, pathname, href } = body;

        // 记录结构化日志，方便后续接入 ELK 或其他分析平台
        // 这里需要将其以特定的格式打印，以便容易按指标筛选（如筛选 LCP, CLS）
        const logData = {
            metricId: id,
            metricName: name,
            metricValue: value,
            rating, // 'good' | 'needs-improvement' | 'poor'
            pathname,
            href,
            userId: session?.user?.id,
            tenantId: session?.user?.tenantId,
            userAgent: req.headers.get('user-agent'),
        };

        // 对于 Web Vitals，通常 info 级别就够了，但如果是 poor 可能会引起注意
        if (rating === 'poor') {
            logger.warn(`[Web-Vitals] ${name} POOR Performance Detection`, logData);
        } else {
            logger.info(`[Web-Vitals] ${name} Metric Recorded`, logData);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        logger.error('[Web-Vitals] Failed to process metric report', {}, error);
        return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
    }
}
