
import 'dotenv/config';
import { db } from "@/shared/api/db";
import { leads, tenants, users } from "@/shared/api/schema";
import { LeadService } from "@/services/lead.service";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting Lead Deduplication Verification...");

    // 1. Setup Context
    const tenant = await db.query.tenants.findFirst();
    const user = await db.query.users.findFirst();

    if (!tenant || !user) {
        console.error("No tenant or user found. Please seed DB first.");
        process.exit(1);
    }

    const tenantId = tenant.id;
    const userId = user.id;
    const testPhone = "13800000099"; // Unique test phone

    // Cleanup any existing test data
    await db.delete(leads).where(eq(leads.customerPhone, testPhone));

    console.log(`Using Tenant: ${tenant.name}, User: ${user.name}`);
    console.log(`Test Phone: ${testPhone}`);

    // 2. Create a "WON" lead (Simulate old history)
    console.log("\n--- Step 1: Create historic WON lead ---");
    const oldLeadData = {
        leadNo: "LD_TEST_OLD",
        customerName: "Test Customer Old",
        customerPhone: testPhone,
        status: "WON" as const, // Type cast for strict enum
        tenantId,
        createdBy: userId,
        sourceChannelId: null
    };

    // We insert directly to bypass service logic or simulate existing state
    const [oldLead] = await db.insert(leads).values(oldLeadData).returning();
    console.log(`Created Old Lead: ${oldLead.id}, Status: ${oldLead.status}`);

    // 3. Try to create a NEW lead with same phone (Should SUCCEED)
    console.log("\n--- Step 2: Attempt to create NEW lead with same phone (Should SUCCEED) ---");
    const newLeadData = {
        customerName: "Test Customer New",
        customerPhone: testPhone,
        channelId: null,
        notes: "New inquiry from old customer"
    };

    const result1 = await LeadService.createLead(newLeadData as any, tenantId, userId);

    if (result1.isDuplicate) {
        console.error("FAIL: Expected success, but got Duplicate error:", result1.duplicateReason);
    } else {
        console.log("SUCCESS: Created new lead for existing WON customer:", result1.lead.id);
        if (result1.lead.id === oldLead.id) {
            console.error("FAIL: It returned the old lead instead of creating a new one!");
        }
    }

    // 4. Try to create ANOTHER lead with same phone (Should FAIL as now we have an active one)
    console.log("\n--- Step 3: Attempt to create ANOTHER lead with same phone (Should FAIL) ---");
    const result2 = await LeadService.createLead(newLeadData as any, tenantId, userId);

    if (result2.isDuplicate) {
        console.log("SUCCESS: Correctly blocked duplicate active lead. Reason:", result2.duplicateReason);
    } else {
        console.error("FAIL: Expected Duplicate error, but created lead:", result2.lead.id);
    }

    // 5. Cleanup
    console.log("\n--- Cleanup ---");
    await db.delete(leads).where(eq(leads.customerPhone, testPhone));
    console.log("Test Data Deleted.");
}

main().catch(console.error).finally(() => process.exit(0));
