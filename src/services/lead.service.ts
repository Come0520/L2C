import { db } from "@/shared/api/db";
import { leads, channels } from "@/shared/api/schema";
import { eq, and, sql } from "drizzle-orm";
import { CustomerService } from "./customer.service";
import { randomBytes } from 'crypto';
import { format } from 'date-fns';

export class LeadService {

    /**
     * Generates a unique Lead No.
     * Format: LD + YYYYMMDD + 6 hex chars
     */
    private static async generateLeadNo() {
        const prefix = `LD${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * Create a new lead with duplicate check, auto-linking, and stats update.
     * @param data Lead data (partial)
     * @param tenantId Tenant ID
     * @param userId Creator User ID
     */
    static async createLead(data: typeof leads.$inferInsert, tenantId: string, userId: string): Promise<{
        isDuplicate: boolean;
        duplicateReason?: 'PHONE' | 'ADDRESS';
        lead: any; // Type inference helper
    }> {

        // 1. Check Phone Uniqueness
        const existingLead = await db.query.leads.findFirst({
            where: and(
                eq(leads.customerPhone, data.customerPhone),
                eq(leads.tenantId, tenantId)
            )
        });

        if (existingLead) {
            return { isDuplicate: true, duplicateReason: 'PHONE', lead: existingLead };
        }

        // 2. Check Address/Community Uniqueness (Secondary Check)
        if (data.community && data.address) {
            const existingAddress = await db.query.leads.findFirst({
                where: and(
                    eq(leads.community, data.community),
                    eq(leads.address, data.address),
                    eq(leads.tenantId, tenantId)
                )
            });
            if (existingAddress) {
                return { isDuplicate: true, duplicateReason: 'ADDRESS', lead: existingAddress };
            }
        }

        // 3. Auto-link to existing customer
        let customerId = data.customerId;
        if (!customerId && data.customerPhone) {
            const existingCustomer = await CustomerService.findByPhone(data.customerPhone);
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
        }

        // 4. Generate Lead No
        const leadNo = await this.generateLeadNo();

        // 5. Create Lead
        // Wrap in transaction for stats consistency
        const newLead = await db.transaction(async (tx) => {
            const [lead] = await tx.insert(leads).values({
                ...data,
                leadNo,
                customerId: customerId,
                tenantId: tenantId,
                createdBy: userId,
                status: 'PENDING_ASSIGNMENT'
            }).returning();

            // 6. Update Channel Statistics
            if (data.channelId) {
                await tx.update(channels)
                    .set({ totalLeads: sql`${channels.totalLeads} + 1` })
                    .where(and(eq(channels.id, data.channelId), eq(channels.tenantId, tenantId)));
            }

            return lead;
        });

        return { isDuplicate: false, lead: newLead };
    }
}
