const { Client } = require('pg');

async function main() {
    const c = new Client(process.env.DATABASE_URL);
    await c.connect();

    // 查看枚举值
    const res = await c.query("SELECT unnest(enum_range(NULL::verification_code_type)) AS val");
    console.log('当前枚举值:', res.rows.map(r => r.val));

    await c.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
