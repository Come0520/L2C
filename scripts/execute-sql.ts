import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('Please specify a migration file');
        process.exit(1);
    }

    const sqlPath = path.resolve(process.cwd(), migrationFile);
    if (!fs.existsSync(sqlPath)) {
        console.error(`File not found: ${sqlPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const sqlCommands = sql.split(';').filter(cmd => cmd.trim());

    console.log(`Connecting to database...`);
    const sqlClient = postgres(url);

    try {
        console.log(`Executing commands from ${migrationFile}...`);
        for (const cmd of sqlCommands) {
            console.log(`Executing: ${cmd.trim().substring(0, 50)}...`);
            await sqlClient.unsafe(cmd);
        }
        console.log('Migration successfully applied!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await sqlClient.end();
    }
}

main();
