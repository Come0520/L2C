
import 'dotenv/config';
import { db } from "@/shared/api/db";
import { sql } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

async function main() {
    const sqlPath = path.join(process.cwd(), 'drizzle', '0005_flaky_adam_warlock.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');

    const statements = content.split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements.`);

    for (const stmt of statements) {
        console.log(`Executing: ${stmt.substring(0, 50)}...`);
        try {
            await db.execute(sql.raw(stmt));
            console.log('Success');
        } catch (e: any) {
            console.error('FAILED:', stmt);
            console.error('Error:', e.message);
            // Don't exit, try next? No, migration should stop.
            // But for debugging, I want to see which one fails.
        }
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
