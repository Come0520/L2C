import { NextResponse } from 'next/server';
import { getARAgingAnalysis } from '@/features/analytics';
import { auth } from '@/shared/lib/auth';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('API:ARAging');

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const asOfDate = searchParams.get('asOfDate') || undefined;

        // getARAgingAnalysis actually returns an object with a data property containing the actual result 
        // since it's wrapped in createSafeAction.
        // Let's call it and return the result.
        const result = await getARAgingAnalysis({ asOfDate });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        logger.error('Failed to get AR aging analysis', {}, error as Error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch AR aging analysis' },
            { status: 500 }
        );
    }
}
