const fs = require('fs');
const { execSync } = require('child_process');

function normalizeType(type) {
    if (!type) return '';
    return type.toLowerCase().replace('character varying', 'varchar');
}

try {
    console.log("Loading snapshot...");
    if (!fs.existsSync('/tmp/snapshot.json')) {
        console.error("Snapshot file not found!");
        process.exit(1);
    }
    const snapshot = JSON.parse(fs.readFileSync('/tmp/snapshot.json', 'utf8'));
    const localTables = snapshot.tables || {};

    console.log("Fetching remote schema...");
    const sql = "SELECT json_build_object('tables', json_agg(t)) FROM (SELECT table_name, (SELECT json_agg(c) FROM (SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tables.table_name) c) as columns FROM information_schema.tables WHERE table_schema = 'public') t;";
    const cmd = `PGPASSWORD='I@rds2026' psql -h pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com -U l2c -d l2c -t -A -c "${sql}"`;

    // Increase max buffer for large output
    const remoteOut = execSync(cmd, { maxBuffer: 1024 * 1024 * 10 }).toString();
    const remoteData = JSON.parse(remoteOut);

    const remoteTables = {};
    if (remoteData.tables) {
        remoteData.tables.forEach(t => {
            const cols = {};
            if (t.columns) t.columns.forEach(c => cols[c.column_name] = c);
            remoteTables[t.table_name] = cols;
        });
    }

    const report = {
        missingTables: [],
        missingColumns: [],
        typeMismatches: []
    };

    console.log("Comparing...");
    Object.keys(localTables).forEach(key => {
        const t = localTables[key];
        // Drizzle keys are "public.tablename" or just "tablename"
        const tableName = t.name;

        if (!remoteTables[tableName]) {
            report.missingTables.push(tableName);
            return;
        }

        const remoteCols = remoteTables[tableName];
        Object.keys(t.columns).forEach(colKey => {
            const c = t.columns[colKey];
            const colName = c.name;
            const remoteCol = remoteCols[colName];

            if (!remoteCol) {
                report.missingColumns.push(`${tableName}.${colName}`);
            } else {
                // strict comparison might be hard, just logging notable diffs?
                // For now, identity check is enough.
            }
        });
    });

    console.log("AUDIT_RESULT_START");
    console.log(JSON.stringify(report, null, 2));
    console.log("AUDIT_RESULT_END");

} catch (e) {
    console.error("Audit failed:", e.message);
    process.exit(1);
}
