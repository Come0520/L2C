import { db } from "@/shared/api/db";
import { quotes, quoteItems } from "@/shared/api/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class QuoteService {

    /**
     * Create a new version of an existing quote.
     * Deep copies the quote and its items.
     * Sets old quote to inactive (conceptually, though we default isActive=true, we handle the 'chain' via strict versioning or by deactivating old ones if business rules require).
     * Actually, better to keep old versions 'active' as historical records but 'current' is the latest. 
     * Or we explicitly mark old ones as isActive=false. Let's strictly mark old ones inactive to avoid confusion.
     */
    static async createNextVersion(quoteId: string, userId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            // 1. Get original quote
            const originalQuote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: {
                    items: true
                } as any // drizzle-orm type workaround for relations if needed, else separate query
            });

            if (!originalQuote) throw new Error("Quote not found");

            // 2. Fetch items if not eager loaded (safer)
            const originalItems = await tx.query.quoteItems.findMany({
                where: eq(quoteItems.quoteId, quoteId)
            });

            // 3. Deactivate old quote? 
            // If we view version history, we might want to see them. 
            // But 'isActive' usually implies the one currently in negotiation.
            // Let's set old to false for safety.
            await tx.update(quotes)
                .set({ isActive: false })
                .where(eq(quotes.id, quoteId));

            // 4. Create New Quote
            const newVersion = originalQuote.version + 1;
            const newQuoteNo = `${originalQuote.quoteNo}-V${newVersion}`; // Or keep same QuoteNo and just use version field? 
            // Req often says QuoteNo stays same for customer, version is internal. 
            // But unique constraint on quoteNo exists.
            // Let's append suffix or assume schema has unique(quoteNo, version)?
            // Current Schema has: quoteNo: unique(). So we MUST change quoteNo.
            // Standard Pattern: Q20231010-001-V2

            // Clean old suffix if exists to avoid V1-V2-V3
            const baseQuoteNo = originalQuote.quoteNo.replace(/-V\d+$/, '');
            const finalQuoteNo = `${baseQuoteNo}-V${newVersion}`;

            const [newQuote] = await tx.insert(quotes).values({
                ...originalQuote,
                id: undefined, // Let DB generate
                quoteNo: finalQuoteNo,
                version: newVersion,
                parentQuoteId: originalQuote.id,
                isActive: true,
                status: 'DRAFT', // Reset status
                createdAt: new Date(),
                updatedAt: new Date(),
                lockedAt: null, // Unlock
                createdBy: userId
            }).returning();

            // 5. Clone Items
            if (originalItems.length > 0) {
                await tx.insert(quoteItems).values(
                    originalItems.map(item => ({
                        ...item,
                        id: undefined,
                        quoteId: newQuote.id,
                        createdAt: new Date()
                    }))
                );
            }

            return newQuote;
        });
    }

    /**
     * Import measurement data into quote items.
     * This is a complex mapping logic. For now, we mock basic usage.
     */
    static async importMeasurementData(quoteId: string, measureTaskId: string) {
        // TODO: Implement smart mapping from MeasureItems to QuoteItems
        // 1. Fetch Measure Items
        // 2. Map Room -> Room
        // 3. Map Window Size -> Width/Height
        console.log("Importing measurement data for", quoteId, measureTaskId);
    }
}
