
import { leads } from '@/shared/api/schema';

type LeadInput = Partial<typeof leads.$inferInsert>;

/**
 * Calculate lead score based on available information.
 * Max score: 100
 */
export function calculateLeadScore(lead: LeadInput): number {
    let score = 0;

    // 1. Intention Level (Max 40)
    if (lead.intentionLevel === 'HIGH') {
        score += 40;
    } else if (lead.intentionLevel === 'MEDIUM') {
        score += 20;
    } else if (lead.intentionLevel === 'LOW') {
        score += 10;
    }

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
