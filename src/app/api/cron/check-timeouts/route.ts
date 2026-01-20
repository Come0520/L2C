import { NextRequest, NextResponse } from 'next/server';
import { checkTimeoutsManually } from '@/features/approval/actions';

/**
 * Cron Job API route for checking approval timeouts
 * Can be triggered by:
 * - Vercel Cron (configured in vercel.json)
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger for testing
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'development-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await checkTimeoutsManually();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...(result as any)
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
