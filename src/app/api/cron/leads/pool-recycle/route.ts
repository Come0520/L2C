import { NextResponse } from 'next/server';
import { executePoolRecycleJob } from '@/features/leads/logic/pool-recycle-job';

/**
 * GET /api/cron/leads/pool-recycle
 * 
 * 公海自动回收定时任务
 * 建议配置：每 2 小时执行一次
 * 
 * Vercel Cron 配置示例 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/leads/pool-recycle",
 *     "schedule": "0 * /2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
    try {
        // 验证 Cron Secret (可选，用于安全性)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const startTime = Date.now();
        const results = await executePoolRecycleJob();
        const duration = Date.now() - startTime;

        // 统计总回收数
        const totalNoContact = results.reduce((sum, r) => sum + r.noContactRecycled, 0);
        const totalNoDeal = results.reduce((sum, r) => sum + r.noDealRecycled, 0);

        console.log(`[Pool Recycle] Completed in ${duration}ms. No-contact: ${totalNoContact}, No-deal: ${totalNoDeal}`);

        return NextResponse.json({
            success: true,
            duration: `${duration}ms`,
            summary: {
                tenantsProcessed: results.length,
                totalNoContactRecycled: totalNoContact,
                totalNoDealRecycled: totalNoDeal
            },
            details: results
        });

    } catch (error: unknown) {
        console.error('[Pool Recycle] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
