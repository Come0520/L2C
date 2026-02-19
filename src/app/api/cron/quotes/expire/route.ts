import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { QuoteService } from '@/services/quote.service';
import { timingSafeEqual } from 'crypto';

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

        // 安全修复：强制要求配置 CRON_SECRET
        if (!cronSecret) {
            console.error('[Quotes Expire] CRON_SECRET 未配置，拒绝请求');
            return NextResponse.json(
                { error: 'Server configuration error: CRON_SECRET not set' },
                { status: 500 }
            );
        }

        const [scheme, token] = authHeader?.split(' ') || [];

        if (scheme !== 'Bearer' || !token) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        // 使用 timingSafeEqual 防止时序攻击
        const secretBuffer = Buffer.from(cronSecret);
        const tokenBuffer = Buffer.from(token);

        if (secretBuffer.length !== tokenBuffer.length || !timingSafeEqual(secretBuffer, tokenBuffer)) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid cron secret' },
                { status: 401 }
            );
        }

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
                error: 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
