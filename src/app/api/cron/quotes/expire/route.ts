import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/services/quote.service';
import { headers } from 'next/headers';

/**
 * 定时任务：批量处理过期报价
 * 建议配置频率：每天凌晨执行一次
 * 
 * 安全验证：
 * 1. 检查 Authorization header (Bearer token)
 * 2. 或检查 CRON_SECRET 环境密钥 (适用于 Vercel Cron 等)
 */
export async function POST(_req: NextRequest) {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // 简单的安全检查
        // 如果配置了 CRON_SECRET，则必须匹配
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid cron secret' },
                { status: 401 }
            );
        }

        // 也允许本地开发环境直接通过 (可选)
        // if (process.env.NODE_ENV === 'development') { ... }

        const result = await QuoteService.expireAllOverdueQuotes();

        return NextResponse.json({
            success: true,
            message: 'Batch expiration completed',
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to execute quote expiration cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
