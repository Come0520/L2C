
const fs = require('fs');
const path = require('path');

// --- Types (simplified) ---
type DrizzleTable = {
    name: string;
    columns: Record<string, {
        name: string;
        type: string;
        notNull: boolean;
        default?: any;
    }>;
};

type ProductionTableColumns = Record<string, {
    type: string;
    nullable: string; // "YES" or "NO"
    default: any;
}>;

type ProductionSchema = {
    tables: Record<string, {
        columns: ProductionTableColumns;
    }>;
};

// --- Load Files ---
const rootDir = process.cwd();
const snapshotPath = path.join(rootDir, 'drizzle/meta/0017_snapshot.json');
const productionPath = path.join(rootDir, 'production_schema.json');

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const production: ProductionSchema = JSON.parse(fs.readFileSync(productionPath, 'utf8'));

const fixSql: string[] = [];

// --- Config ---
// Type mapping normalization (Postgres udt_name vs Drizzle types)
const typeMap: Record<string, string> = {
    'integer': 'integer',
    'numeric': 'numeric',
    'varchar': 'varchar',
    'text': 'text',
    'boolean': 'bool',
    'timestamp with time zone': 'timestamptz',
    'timestamp': 'timestamp',
    'date': 'date',
    'uuid': 'uuid',
    'jsonb': 'jsonb',
    // Enums are tricky, usually treated as custom types (e.g. 'tenant_status') or 'text' if not cast
};

// --- Comparison Logic ---

Object.entries(snapshot.tables).forEach(([tableNameKey, tableDef]: [string, any]) => {
    // drizzle keys are like "public.roles", production tables keys are "roles"
    const tableName = tableDef.name;
    const prodTable = production.tables[tableName];

    if (!prodTable) {
        fixSql.push(`-- Table ${tableName} is MISSING`);
        // Generate CREATE TABLE
        const cols: string[] = [];
        Object.values(tableDef.columns).forEach((col: any) => {
            let def = `"${col.name}" ${col.type}`;
            if (col.notNull) def += ' NOT NULL';
            if (col.default !== undefined) {
                // formatting default value is complex, using raw string from snapshot if possible
                // Drizzle snapshot default often has sql expression string
                if (typeof col.default === 'string') {
                    def += ` DEFAULT ${col.default}`;
                } else if (col.default === true) def += ` DEFAULT true`;
                else if (col.default === false) def += ` DEFAULT false`;
                else if (typeof col.default === 'number') def += ` DEFAULT ${col.default}`;
            }
            cols.push(def);
        });

        // Simplified Primary Key (assuming 'id' is PK mostly, or looking at snapshot indexes)
        // Note: Drizzle snapshot separates columns and indexes.
        // For simplicity in this rescue script, we'll try to find PK in columns
        let pk = Object.values(tableDef.columns).find((c: any) => c.primaryKey);

        let query = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${cols.join(',\n  ')}`;

        if (pk) {
            query += `,\n  CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("${(pk as any).name}")`;
        }

        query += `\n);`;
        fixSql.push(query);
        fixSql.push(''); // blank line
    } else {
        // Table exists, check columns
        Object.values(tableDef.columns).forEach((col: any) => {
            const prodCol = prodTable.columns[col.name];
            if (!prodCol) {
                fixSql.push(`-- Column ${tableName}.${col.name} is MISSING`);
                let def = `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type}`;
                if (col.notNull) def += ' NOT NULL';
                if (col.default !== undefined) {
                    if (typeof col.default === 'string') {
                        def += ` DEFAULT ${col.default}`;
                    } else if (col.default === true) def += ` DEFAULT true`;
                    else if (col.default === false) def += ` DEFAULT false`;
                    else if (typeof col.default === 'number') def += ` DEFAULT ${col.default}`;
                }
                def += ';';
                fixSql.push(def);
            } else {
                // Column exists, maybe check type? (ignoring for now to avoid false positives with enums)
            }
        });
    }
});

fs.writeFileSync(path.join(rootDir, 'fix_schema.sql'), fixSql.join('\n'));
console.log('Fix SQL generated.');
