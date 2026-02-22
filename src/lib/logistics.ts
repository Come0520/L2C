
const key = process.env.KUAIDI100_KEY;
const customer = process.env.KUAIDI100_CUSTOMER;

import { logger } from '@/shared/lib/logger';

export interface TrackingResult {
    message: string;
    state: string;
    status: string;
    condition: string;
    ischeck: string;
    com: string;
    nu: string;
    data: Array<{
        context: string;
        time: string;
        ftime: string;
        status: string;
        areaCode?: string;
        areaName?: string;
    }>;
}

export async function queryTracking(company: string, trackingNo: string): Promise<TrackingResult | null> {
    if (!key || !customer) {
        logger.warn('Kuaidi100 API keys not configured (KUAIDI100_KEY, KUAIDI100_CUSTOMER)');
        return null;
    }

    try {
        // Implementation based on standard Kuaidi100 'poll' API
        // Docs: https://api.kuaidi100.com/document/5f0ffb572977d50a94e1023c
        const param = JSON.stringify({ com: company, num: trackingNo });
        const crypto = await import('crypto'); // Dynamic import to keep top-level clean
        const sign = crypto.createHash('md5')
            .update(param + key + customer)
            .digest('hex').toUpperCase();

        const response = await fetch('https://poll.kuaidi100.com/poll/query.do', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                customer,
                sign,
                param
            })
        });

        if (!response.ok) {
            throw new Error(`Kuaidi100 API error: ${response.status}`);
        }

        const result = await response.json() as TrackingResult;

        // Check for API level errors
        if (result.message && result.status !== '200') { // API often returns 200 even on logical error, but 'status' field helps
            // Note: The interface defines 'status' as string. 200 is success.
            // If validation fails, it might return message.
            logger.warn('Kuaidi100 returned error:', result.message);
            return null;
        }

        return result;

    } catch (error) {
        console.error('Kuaidi100 query error:', error);
        return null;
    }
}
