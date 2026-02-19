
import Decimal from 'decimal.js';

export interface BundleQuoteSummary {
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    itemCount: number;
}

/**
 * Aggregates a list of quotes (sub-quotes) into a bundle summary.
 * Uses Decimal.js for precise arithmetic.
 */
export function aggregateBundle(bundle: { quotes: { totalAmount?: number | null | string; discountAmount?: number | null | string; finalAmount?: number | null | string }[] }): BundleQuoteSummary {
    if (!bundle || !bundle.quotes || !Array.isArray(bundle.quotes)) {
        return {
            totalAmount: 0,
            discountAmount: 0,
            finalAmount: 0,
            itemCount: 0
        };
    }

    let totalAmount = new Decimal(0);
    let discountAmount = new Decimal(0);
    let finalAmount = new Decimal(0);
    const itemCount = 0;

    for (const quote of bundle.quotes) {
        // Skip cancelled or invalid quotes if necessary, but typically we aggregate all linked valid quotes
        // Assuming status filtering is done before passing data here, or we can add check:
        // if (quote.status === 'CANCELLED') continue;

        totalAmount = totalAmount.plus(quote.totalAmount || 0);
        discountAmount = discountAmount.plus(quote.discountAmount || 0);
        finalAmount = finalAmount.plus(quote.finalAmount || 0);

        // If quotes have items count, we could sum it up too
        // itemCount += (quote.items?.length || 0); 
    }

    return {
        totalAmount: totalAmount.toDecimalPlaces(2).toNumber(),
        discountAmount: discountAmount.toDecimalPlaces(2).toNumber(),
        finalAmount: finalAmount.toDecimalPlaces(2).toNumber(),
        itemCount
    };
}
