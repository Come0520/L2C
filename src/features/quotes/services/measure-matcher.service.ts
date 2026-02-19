import { MeasureItem, mapMeasureItemToQuoteItem, QuoteItemDraft } from '../config/measure-mapping';
import { QuoteItem } from '@/shared/api/schema/quotes';

export interface MatchResult {
    measureItemId: string;
    quoteItemId?: string; // If matched to existing
    draftItem: QuoteItemDraft;
    confidence: number; // 0-1
    matchType: 'EXACT_ROOM' | 'FUZZY_ROOM' | 'NEW';
}

export class MeasureMatcherService {
    /**
     * Auto-match measurement items to existing quote items or generate new drafts
     */
    static autoMatch(measureItems: MeasureItem[], existingQuoteItems: QuoteItem[] = []): MatchResult[] {
        const results: MatchResult[] = [];
        const usedQuoteItemIds = new Set<string>();

        for (const item of measureItems) {
            // 1. Convert to draft first
            const draft = mapMeasureItemToQuoteItem(item);

            // 2. Try to find match in existing items
            let bestMatch: QuoteItem | null = null;
            let maxScore = 0;

            for (const qItem of existingQuoteItems) {
                if (usedQuoteItemIds.has(qItem.id)) continue;

                const score = this.calculateMatchScore(item, qItem);
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = qItem;
                }
            }

            // 3. Determine match result
            if (bestMatch && maxScore > 0.8) {
                usedQuoteItemIds.add(bestMatch.id);
                results.push({
                    measureItemId: item.id || '',
                    quoteItemId: bestMatch.id,
                    draftItem: draft, // The measurement data to overwrite/update
                    confidence: maxScore,
                    matchType: maxScore === 1 ? 'EXACT_ROOM' : 'FUZZY_ROOM'
                });
            } else {
                results.push({
                    measureItemId: item.id || '',
                    draftItem: draft,
                    confidence: 1.0, // High confidence for new item generation
                    matchType: 'NEW'
                });
            }
        }

        return results;
    }

    private static calculateMatchScore(measure: MeasureItem, quote: QuoteItem): number {
        let score = 0;

        // Room Name Match (Primary factor)
        if (measure.roomName === quote.roomName) {
            score += 0.6;
        } else if (measure.roomName && quote.roomName &&
            (measure.roomName.includes(quote.roomName) || quote.roomName.includes(measure.roomName))) {
            score += 0.4;
        }

        // Product Category/Usage Match (Secondary)
        // e.g., both are Curtains
        // For now, simple check if exists
        score += 0.2;

        return Math.min(score, 1);
    }
}
