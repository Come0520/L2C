/**
 * 健康检�?API 端点
 * 用于 Docker 容器健康检查和负载均衡器探�?
 */

import { NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // 检查数据库连接
        await db.execute(sql`SELECT 1`);

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
        });
    } catch (error) {
        console.error('[Health Check] Database connection failed:', error);

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed',
            },
            { status: 503 }
        );
    }
}
