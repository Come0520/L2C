import { NextResponse } from 'next/server';
import { getChannelStatsOverview } from '@/features/channels/actions/channel-stats';
import { auth } from '@/shared/lib/auth';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('API:ChannelStats');

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await getChannelStatsOverview();

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Failed to get channel stats overview', {}, error as Error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch channel stats' },
            { status: 500 }
        );
    }
}
