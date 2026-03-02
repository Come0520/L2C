/**
 * 精确的逐表差异审计脚本
 * 比较本地 Schema 定义的表与 RDS 实际存在的表
 * 
 * 策略：通过 drizzle-kit introspect 对比，
 * 或者直接分析 RDS Schema 与 drizzle push 执行的语句
 */
import postgres from 'postgres';
import * as fs from 'fs';

// 通过 SSH 隧道连接 RDS
const sql = postgres({
    host: '127.0.0.1',
    port: 15432,
    database: 'l2c',
    username: 'l2c',
    password: 'I@rds2026',
    ssl: false,
    max: 1,
    connect_timeout: 30,
});

interface Col {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    udt_name: string;
}

async function main() {
    // 从 rds-full-schema.json 加载已有的 RDS Schema（避免重复查询）
    const rdsSchemaPath = 'tmp/rds-full-schema.json';
    let rdsSchema: Record<string, { columns: Col[] }>;

    if (fs.existsSync(rdsSchemaPath)) {
        rdsSchema = JSON.parse(fs.readFileSync(rdsSchemaPath, 'utf-8'));
        console.log(`从缓存加载 RDS Schema（${Object.keys(rdsSchema).length} 张表）`);
    } else {
        // 重新查询
        const cols = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    ` as any[];

        rdsSchema = {};
        for (const col of cols) {
            if (!rdsSchema[col.table_name]) rdsSchema[col.table_name] = { columns: [] };
            rdsSchema[col.table_name].columns.push(col);
        }
    }

    const rdsTables = Object.keys(rdsSchema).sort();

    // ==================================================
    // 对比 drizzle introspect - 用 drizzle 直接查询表定义
    // ==================================================

    // 本地 Schema 定义的表（从 schema 文件分析）
    // 这些是本地 drizzle schema 定义的实际数据库表名（snake_case）
    const localSchemaTablesKnown = [
        // infrastructure.ts
        'tenants', 'users', 'roles', 'sys_dictionaries',
        // billing.ts  
        'subscriptions', 'billing_payment_records', 'usage_metrics',
        // tenant-members.ts
        'tenant_members',
        // invitations.ts
        'invitations',
        // catalogs.ts
        'products', 'product_templates', 'product_attribute_templates', 'product_bundles',
        'product_bundle_items', 'product_price_history',
        // customers.ts
        'customers', 'customer_merge_logs',
        // customer-addresses.ts
        'customer_addresses',
        // customer-activities.ts
        'customer_activities',
        // leads.ts
        'leads', 'lead_activities', 'lead_status_history', 'phone_view_logs',
        // channels.ts
        'channels', 'channel_categories', 'channel_contacts', 'channel_commissions',
        'channel_settlements', 'channel_discount_overrides', 'channel_specific_prices',
        'market_channels', 'commission_records', 'commission_adjustments',
        // quotes.ts
        'quotes', 'quote_rooms', 'quote_items', 'quote_plans', 'quote_plan_items',
        'quote_templates', 'quote_template_rooms', 'quote_template_items',
        // orders.ts
        'orders', 'order_items', 'order_changes',
        // supply-chain.ts
        'suppliers', 'warehouses', 'product_suppliers', 'product_packages',
        'package_products', 'purchase_orders', 'purchase_order_items',
        'po_shipments', 'po_payments', 'product_bundles', 'fabric_inventory',
        'fabric_inventory_logs', 'split_route_rules',
        // processing.ts
        'production_tasks', 'work_orders', 'work_order_items',
        // service.ts
        'measure_sheets', 'measure_tasks', 'measure_task_splits', 'measure_items',
        'install_tasks', 'install_items', 'install_photos', 'labor_rates',
        // finance.ts
        'finance_accounts', 'account_transactions', 'payment_orders', 'payment_order_items',
        'payment_bills', 'payment_bill_items', 'receipt_bills', 'receipt_bill_items',
        'payment_schedules', 'payment_plan_nodes', 'ar_statements', 'ap_supplier_statements',
        'ap_labor_statements', 'ap_labor_fee_details', 'chart_of_accounts', 'journal_entries',
        'journal_entry_lines', 'expense_records', 'accounting_periods', 'internal_transfers',
        'finance_audit_logs', 'finance_configs', 'voucher_templates', 'reconciliations',
        'reconciliation_details', 'statement_confirmations', 'statement_confirmation_details',
        // approval.ts
        'approvals', 'approval_flows', 'approval_nodes', 'approval_tasks', 'approval_delegations',
        // after-sales.ts
        'after_sales_tickets', 'liability_notices', 'debt_ledgers',
        'credit_notes', 'debit_notes',
        // audit.ts
        'audit_logs',
        // notifications.ts
        'notifications', 'notification_templates', 'notification_preferences', 'notification_queue',
        // loyalty.ts
        'loyalty_transactions',
        // quote-config.ts
        'quote_config',
        // inventory.ts
        'inventory', 'inventory_logs',
        // verification_codes.ts
        'verification_codes',
        // sales-targets.ts
        'sales_targets',
        // sales-annual-targets.ts
        'sales_annual_targets',
        // sales-weekly-targets.ts
        'sales_weekly_targets',
        // labor-pricing.ts
        'labor_rates',
        // worker-skills.ts
        'worker_skills',
        // system-settings.ts
        'system_settings', 'system_settings_history', 'system_announcements',
        // role-overrides.ts
        'role_overrides',
        // showroom.ts
        'showroom_items', 'showroom_shares',
        // onboarding-profiles.ts
        'tenant_profiles',
        // landing-testimonials.ts
        'landing_testimonials',
    ];

    // 去重
    const localTables = [...new Set(localSchemaTablesKnown)].sort();
    const rdsTableSet = new Set(rdsTables);
    const localTableSet = new Set(localTables);

    console.log('\n' + '='.repeat(80));
    console.log('🔍 第一步：表集合差异分析');
    console.log('='.repeat(80));

    // 在 RDS 中存在但不在本地 Schema 中的表
    const rdsOnlyTables = rdsTables.filter(t => !localTableSet.has(t));
    console.log(`\n⚠️  只在 RDS 中存在（本地 Schema 未定义，共 ${rdsOnlyTables.length} 张）：`);
    for (const t of rdsOnlyTables) {
        const cols = rdsSchema[t].columns;
        console.log(`   ${t} (${cols.length} 列)`);
    }

    // 在本地 Schema 中定义但不在 RDS 中的表
    const localOnlyTables = localTables.filter(t => !rdsTableSet.has(t));
    console.log(`\n❌ 只在本地 Schema 中定义（RDS 缺失，共 ${localOnlyTables.length} 张）：`);
    for (const t of localOnlyTables) {
        console.log(`   ${t}`);
    }

    // 共同存在的表
    const commonTables = localTables.filter(t => rdsTableSet.has(t));
    console.log(`\n✅ 共同存在的表：${commonTables.length} 张`);

    console.log('\n' + '='.repeat(80));
    console.log('🔍 第二步：关键表的列对比');
    console.log('='.repeat(80));

    // 重点检查出问题的关键表
    const criticalTables = ['tenants', 'users', 'tenant_members', 'invitations', 'quotes', 'role_overrides', 'tenant_profiles'];

    for (const tableName of criticalTables) {
        const rdsCols = rdsSchema[tableName];
        if (!rdsCols) {
            console.log(`\n❌ 关键表 ${tableName} 在 RDS 中不存在！`);
            continue;
        }
        console.log(`\n📋 [${tableName}] (RDS: ${rdsCols.columns.length} 列)`);
        for (const col of rdsCols.columns) {
            const type = col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type;
            const nullable = col.is_nullable === 'YES' ? '(nullable)' : '';
            console.log(`   ✓ ${col.column_name}: ${type} ${nullable}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 汇总');
    console.log('='.repeat(80));
    console.log(`RDS 总表数：${rdsTables.length}`);
    console.log(`本地 Schema 总表数：${localTables.length}`);
    console.log(`仅在 RDS：${rdsOnlyTables.length} 张`);
    console.log(`仅在本地：${localOnlyTables.length} 张`);
    console.log(`共同存在：${commonTables.length} 张`);
}

main()
    .catch(console.error)
    .finally(() => sql.end());
