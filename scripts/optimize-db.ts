import postgres from 'postgres';
import 'dotenv/config';

// 使用 process.env.DATABASE_URL
const sql = postgres(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log('Starting DB Optimization...');

        // 1. Slow Query Log (Set to 1000ms)
        // ALTER SYSTEM requires superuser usually, ensuring it works or catching error
        try {
            await sql`ALTER SYSTEM SET log_min_duration_statement = 1000`;
            await sql`SELECT pg_reload_conf()`;
            console.log('[OK] Slow query log enabled (1000ms)');
        } catch (e) {
            console.warn('[WARN] Could not set log_min_duration_statement (Insufficient privileges?):', (e as Error).message);
        }

        // 2. Materialized View for Sales Summary
        console.log('Creating Materialized View: sales_summary...');
        await sql`DROP MATERIALIZED VIEW IF EXISTS sales_summary`;
        await sql`
        CREATE MATERIALIZED VIEW sales_summary AS
        SELECT 
            tenant_id, 
            created_at::date as report_date, 
            SUM(total_amount) as daily_sales
        FROM orders
        GROUP BY tenant_id, created_at::date
    `;
        console.log('[OK] Materialized view sales_summary created');

        // Create index on view for performance
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_summary_tenant_date ON sales_summary(tenant_id, report_date)`;
        console.log('[OK] Index created on sales_summary');

        // 3. RLS Policies (Prepared but Disabled)
        // Ensure RLS enablement is safe. For now, we JUST create policy? No, policy creation requires enabling usually or valid syntax.
        // We will skip RLS to avoid app breakage as discussed.
        console.log('[INFO] RLS implementation skipped to prevent breaking changes without app-layer context support.');

    } catch (err) {
        console.error('Script failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
