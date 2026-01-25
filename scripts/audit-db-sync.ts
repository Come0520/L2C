
import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';

// Config
const LOCAL_DB_URL = 'postgres://l2c_user:l2c_dev_password@localhost:5433/l2c_dev';
const REMOTE_DB_URL = process.env.DATABASE_URL;

async function audit() {
    let output = 'Starting Database Audit (Docker vs RDS)...\n\n';

    if (!REMOTE_DB_URL) {
        console.error('Error: DATABASE_URL not set');
        process.exit(1);
    }

    output += `Local (Docker): ${LOCAL_DB_URL}\n`;
    output += `Remote (RDS)  : ${REMOTE_DB_URL.replace(/:[^:@]*@/, ':****@')}\n\n`;

    const localSql = postgres(LOCAL_DB_URL, { max: 1 });
    const remoteSql = postgres(REMOTE_DB_URL, { max: 1 });

    try {
        // 1. Get Tables and Row Counts
        const getTables = async (sql: any) => {
            return await sql`
                SELECT 
                    t.table_name,
                    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
                    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
                FROM (
                    SELECT table_name, 
                           query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                ) t
                ORDER BY t.table_name;
            `;
        };

        // Get Local Tables
        const localTables = await getTables(localSql);
        const localMap = new Map(localTables.map((t: any) => [t.table_name, t]));

        // Get Remote Tables
        const remoteTables = await getTables(remoteSql);
        const remoteMap = new Map(remoteTables.map((t: any) => [t.table_name, t]));

        // 2. Compare
        output += 'Audit Report:\n\n';

        const allTables = new Set([...localMap.keys(), ...remoteMap.keys()]);
        const sortedTables = Array.from(allTables).sort();

        output += 'State   | Table Name                  | Local(Rows) | RDS(Rows)   | Schema Check\n';
        output += '--------|-----------------------------|-------------|-------------|--------------\n';

        let matchCount = 0;
        let diffCount = 0;
        let missingCount = 0;

        for (const tableName of sortedTables) {
            const local: any = localMap.get(tableName);
            const remote: any = remoteMap.get(tableName);

            let status = '';
            let schemaStatus = 'OK';

            if (!local) {
                status = '+RDS'; // Only in RDS
                diffCount++;
            } else if (!remote) {
                status = '-RDS'; // Missing in RDS
                missingCount++;
            } else {
                if (local.row_count === remote.row_count) {
                    status = 'MATCH';
                    matchCount++;
                } else {
                    status = 'DIFF';
                    diffCount++;
                }

                if (local.column_count !== remote.column_count) {
                    schemaStatus = `FAIL(Cols ${local.column_count} vs ${remote.column_count})`;
                }
            }

            output += `${status.padEnd(8)}| ` +
                `${(tableName as string).padEnd(27)} | ` +
                `${(local?.row_count ?? '-').toString().padEnd(11)} | ` +
                `${(remote?.row_count ?? '-').toString().padEnd(11)} | ` +
                schemaStatus + '\n';
        }

        output += '\n----------------------------------------\n';
        output += 'Summary:\n';
        output += `   Matches: ${matchCount} tables\n`;
        output += `   Diffs  : ${diffCount} tables (Row count mismatch)\n`;
        output += `   Missing: ${missingCount} tables\n`;

        if (diffCount > 0) {
            output += '\nNote: RDS is new, row count mismatches are expected if data migration was not performed.\n';
        }

        fs.writeFileSync('audit_report.txt', output);
        console.log('Audit completed. See audit_report.txt');

    } catch (e: any) {
        console.error('Audit failed:', e);
    } finally {
        await localSql.end();
        await remoteSql.end();
    }
}

audit();
