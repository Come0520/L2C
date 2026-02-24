import { logger } from "@/shared/lib/logger";

import { leads } from '@/shared/api/schema';
import { INTENTION_WEIGHTS } from '../config/scoring-config';

type LeadInput = Partial<typeof leads.$inferInsert>;

/**
 * Calculate lead score based on available information.
 * Max score: 100
 */
export function calculateLeadScore(lead: LeadInput): number {
    let score = 0;

    // 1. Intention Level (Max 50)
    const intentionScore = lead.intentionLevel ? (INTENTION_WEIGHTS[lead.intentionLevel] || 0) : 0;
    score += intentionScore;

    // 2. Contact Info (Max 30)
    if (lead.customerPhone && lead.customerPhone.length === 11) {
        score += 20;
    }
    if (lead.customerWechat) {
        score += 10;
    }

    // 3. Asset Info (Max 20)
    if (lead.community || lead.address) {
        score += 10;
    }
    if (lead.houseType) {
        score += 5;
    }
    if (lead.estimatedAmount) {
        score += 5;
    }

    // 4. Source Info (Max 10)
    if (lead.channelId || lead.sourceChannelId) {
        score += 10;
    }

    // Cap at 100
    return Math.min(score, 100);
}
