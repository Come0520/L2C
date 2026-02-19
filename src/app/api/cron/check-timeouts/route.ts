import { NextRequest, NextResponse } from 'next/server';
import { checkTimeoutsManually } from '@/features/approval/actions';
import { timingSafeEqual } from 'crypto';

/**
 * Cron Job API route for checking approval timeouts
 * Can be triggered by:
 * - Vercel Cron (configured in vercel.json)
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger for testing
 */
export async function GET(request: NextRequest) {
    try {
        // 安全修复：强制要求配置 CRON_SECRET
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            console.error('[Check Timeouts] CRON_SECRET 未配置，拒绝请求');
            return NextResponse.json(
                { error: 'Server configuration error: CRON_SECRET not set' },
                { status: 500 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const [scheme, token] = authHeader?.split(' ') || [];

        if (scheme !== 'Bearer' || !token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 使用 timingSafeEqual 防止时序攻击
        const secretBuffer = Buffer.from(cronSecret);
        const tokenBuffer = Buffer.from(token);

        if (secretBuffer.length !== tokenBuffer.length || !timingSafeEqual(secretBuffer, tokenBuffer)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await checkTimeoutsManually();

        return NextResponse.json({
            success: true,
            message: 'Timeout check completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
