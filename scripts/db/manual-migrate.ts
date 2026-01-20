import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function migrate() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        process.exit(1);
    }

    // Connect to specific database, NOT postgres default
    const client = postgres(connectionString, { max: 1 });

    console.log('🔄 Starting manual migration of 0009_new_meltdown.sql...');

    try {
        const sqlPath = path.join(process.cwd(), 'drizzle', '0009_new_meltdown.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by breakpoint
        const statements = sqlContent.split('--> statement-breakpoint');

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (!trimmed) continue;

            console.log(`▶️ Executing: ${trimmed.substring(0, 50)}...`);

            try {
                await client.unsafe(trimmed);
                console.log('   ✅ Success');
            } catch (err) {
                const error = err as { code?: string; message?: string };
                if (error.code === '42710') { // duplicate_object (type exists)
                    console.log('   ⚠️ Object already exists (Type), skipping.');
                } else if (error.code === '42P07') { // duplicate_table
                    console.log('   ⚠️ Table already exists, checking columns...');
                } else if (error.code === '42701') { // duplicate_column
                    console.log('   ⚠️ Column already exists, skipping.');
                } else {
                    console.error('   ❌ Error:', error.message);
                }
            }
        }

        console.log('✅ Migration attempt finished.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await client.end();
    }
}

migrate();
