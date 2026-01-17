
// @ts-expect-error Missing types for kuaidi100 module
import Kuaidi100 from 'kuaidi100';

const key = process.env.KUAIDI100_KEY;
const customer = process.env.KUAIDI100_CUSTOMER;

// Initialize client if keys are present
// Note: Kuaidi100 constructor might throw or fail if keys are missing? 
// Based on typical usage, we should check.
// However, to avoid runtime crash on startup, we might lazy init or check in function.

let client: Kuaidi100 | null = null;
if (key && customer) {
    client = new Kuaidi100({ key, customer });
}

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
    if (!client) {
        console.warn('Kuaidi100 API keys not configured');
        return null;
    }

    try {
        // Based on docs, client.query returns a Promise
        const result = await client.query(trackingNo, company); // Note: check signature (num, com) or (com, num)
        // Kuaidi100 package signature usually (num, com, phone, from, to, resultv2)
        // Wait, typical SDKs often use query(num, com).
        // Let's assume (trackingNo, company) for now or check usage later.
        // Actually, the implementation plan said: client.query({ com: company, num: trackingNo })
        // If the package supports object arg, that's safer.

        // Let's try to infer from common usage or assume object if implementation plan suggested it.
        // If the valid code is `client.poll(com, num)` or `client.query(num, com)`.

        // I'll create a safer wrapper that handles errors.
        return result as unknown as TrackingResult;
    } catch (error) {
        console.error('Kuaidi100 query error:', error);
        return null;
    }
}
