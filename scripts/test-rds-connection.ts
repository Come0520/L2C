/**
 * RDS 连接测试脚本
 * 用于验证阿里云 RDS PostgreSQL 连接是否正常
 * 
 * 使用方法: npx tsx scripts/test-rds-connection.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

async function testConnection() {
    console.log('=== RDS 连接测试 ===\n');

    // 检查 DATABASE_URL 环境变量
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ 错误: DATABASE_URL 环境变量未设置');
        console.log('\n请在 .env.local 文件中配置 DATABASE_URL，格式如下:');
        console.log('DATABASE_URL=postgresql://用户名:密码@外网地址:5432/数据库名');
        console.log('\n您的 RDS 外网地址: pgm-uf6aq31y169c8wvluo.pg.rds.aliyuncs.com');
        process.exit(1);
    }

    // 解析连接字符串 (不显示密码)
    try {
        const url = new URL(dbUrl);
        console.log('📋 连接信息:');
        console.log(`   主机: ${url.hostname}`);
        console.log(`   端口: ${url.port || 5432}`);
        console.log(`   用户: ${url.username}`);
        console.log(`   数据库: ${url.pathname.slice(1)}`);
        console.log(`   SSL: ${url.searchParams.get('sslmode') || '未指定'}`);
        console.log('');
    } catch (e) {
        console.error('❌ DATABASE_URL 格式错误');
        process.exit(1);
    }

    // 尝试连接
    console.log('🔌 正在连接 RDS...');

    const sql = postgres(dbUrl, {
        max: 1,
        idle_timeout: 5,
        connect_timeout: 10,
    });

    try {
        // 测试基本连接
        const result = await sql`SELECT version()`;
        console.log('✅ 连接成功!\n');
        console.log('📦 数据库版本:');
        console.log(`   ${result[0].version}\n`);

        // 检查现有表
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        if (tables.length === 0) {
            console.log('⚠️  数据库中没有表。需要运行 pnpm db:push 创建表结构。');
        } else {
            console.log(`📊 现有表 (共 ${tables.length} 个):`);
            tables.forEach(t => console.log(`   - ${t.table_name}`));
        }

        await sql.end();
        console.log('\n✅ 测试完成!');

    } catch (error: any) {
        console.error('❌ 连接失败!\n');
        console.error('错误信息:', error.message);

        // 常见错误诊断
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 诊断: 无法解析主机名');
            console.log('   - 检查外网地址是否正确');
            console.log('   - 确认 RDS 已开启外网访问');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 诊断: 连接被拒绝');
            console.log('   - 检查端口是否正确 (默认 5432)');
            console.log('   - 确认 IP 白名单中包含您的 IP: 101.87.245.132');
        } else if (error.code === '28P01' || error.message.includes('password')) {
            console.log('\n💡 诊断: 认证失败');
            console.log('   - 检查用户名和密码是否正确');
            console.log('   - 在阿里云控制台 "账号管理" 中重置密码');
        } else if (error.code === '3D000') {
            console.log('\n💡 诊断: 数据库不存在');
            console.log('   - 在阿里云控制台 "数据库管理" 中创建数据库');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 诊断: 连接超时');
            console.log('   - 检查网络是否通畅');
            console.log('   - IP 白名单是否正确配置');
        }

        await sql.end();
        process.exit(1);
    }
}

testConnection();
