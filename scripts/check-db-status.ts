import 'dotenv/config';
import postgres from 'postgres';

async function checkTables() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ 缺少 DATABASE_URL');
        process.exit(1);
    }

    const client = postgres(connectionString);

    try {
        // 检查 system_settings 表是否存在
        const tables = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('system_settings', 'system_settings_history')
        `;

        console.log('📋 系统设置相关表状态：');
        if (tables.length === 0) {
            console.log('❌ system_settings 表不存在');
        } else {
            tables.forEach(t => console.log(`✅ ${t.table_name} 表已存在`));
        }

        // 检查 quote_status 枚举值
        const enums = await client`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = 'quote_status'::regtype
            ORDER BY enumsortorder
        `;

        console.log('\n📋 quote_status 枚举值：');
        enums.forEach(e => console.log(`  - ${e.enumlabel}`));

    } catch (error) {
        console.error('❌ 查询失败:', error);
    } finally {
        await client.end();
    }
}

checkTables();
