import 'dotenv/config';
import { db } from '@/shared/api/db';
import { auditLogs, showroomItems, showroomShares, showroomItemStatusEnum } from '@/shared/api/schema';
import { desc, eq, inArray } from 'drizzle-orm';

async function verify() {
    console.log('🔍 Starting Showroom Verification...\n');

    try {
        // 1. Verify Soft Delete (Archived Items)
        console.log('--- 1. Soft Delete Verification ---');
        const archivedItems = await db.select()
            .from(showroomItems)
            .where(eq(showroomItems.status, 'ARCHIVED'))
            .orderBy(desc(showroomItems.updatedAt)) // Assuming logic update updates timestamp
            .limit(3);

        if (archivedItems.length > 0) {
            console.log(`✅ Found ${archivedItems.length} ARCHIVED items.`);
            archivedItems.forEach(item => {
                console.log(`   - [${item.id}] ${item.title} (Status: ${item.status})`);
            });
        } else {
            console.log('⚠️ No ARCHIVED items found. (This is expected if no items have been deleted yet)');
        }
        console.log('');

        // 2. Verify Audit Logs
        console.log('--- 2. Audit Log Verification ---');
        const logs = await db.select()
            .from(auditLogs)
            .where(inArray(auditLogs.tableName, ['showroom_items', 'showroom_shares']))
            .orderBy(desc(auditLogs.createdAt))
            .limit(5);

        // NOTE: Since I removed 'module' from AuditService.record params, I suspect the table MIGHT have logic to determine module or I should filter by tableName
        // Let's check the schema logic below in my thought process before writing this runtime code

        console.log(`Found ${logs.length} recent Audit Logs for Showroom:`);
        logs.forEach(log => {
            console.log(`   - [${log.action}] Table: ${log.tableName}, Record: ${log.recordId}`);
            console.log(`     Details/Changes:`, JSON.stringify(log.changedFields || log.newValues || {}));
        });
        console.log('');

        // 3. Verify Share Views (Redis/DB)
        console.log('--- 3. Share Views Verification ---');
        const shares = await db.select()
            .from(showroomShares)
            .orderBy(desc(showroomShares.lastViewedAt))
            .limit(3);

        if (shares.length > 0) {
            console.log(`Found ${shares.length} active shares. Checking views...`);
            shares.forEach(share => {
                console.log(`   - Share [${share.id}] Views: ${share.views}`);
            });
        } else {
            console.log('⚠️ No Shares found.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }

    console.log('\nVerification Check Complete.');
    process.exit(0);
}

verify();
