
import 'dotenv/config';
import postgres from 'postgres';

function generateDocNo(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not set');
        process.exit(1);
    }

    const sql = postgres(databaseUrl);

    try {
        console.log('🌱 Seeding Finance Data (SQL mode)...');

        // 1. 获取租户和用户
        const tenant = await sql`SELECT id FROM tenants WHERE code = 'E2E_TEST' LIMIT 1`;
        if (tenant.length === 0) throw new Error('Tenant not found');
        const tenantId = tenant[0].id;

        const user = await sql`SELECT id FROM users WHERE phone = '13800000001' LIMIT 1`;
        if (user.length === 0) throw new Error('User not found');
        const userId = user[0].id;

        // 2. 获取或创建客户
        const customer = await sql`SELECT id FROM customers WHERE phone = '13811111111' LIMIT 1`;
        let customerId;
        if (customer.length === 0) {
            const newCustomer = await sql`
                INSERT INTO customers (tenant_id, name, phone, customer_no, created_by)
                VALUES (${tenantId}, 'E2E客户-财务测试', '13811111111', ${generateDocNo('C')}, ${userId})
                RETURNING id
            `;
            customerId = newCustomer[0].id;
        } else {
            customerId = customer[0].id;
        }

        // 2.5 创建报价单 (满足订单外键约束)
        const quoteNo = generateDocNo('QUO');
        const [quote] = await sql`
            INSERT INTO quotes (tenant_id, customer_id, quote_no, total_amount, status, created_by)
            VALUES (${tenantId}, ${customerId}, ${quoteNo}, 10000.00, 'ACCEPTED', ${userId})
            RETURNING id
        `;
        const quoteId = quote.id;

        // 3. 创建 Pending 状态的订单和 AR
        const orderNo = generateDocNo('ORD');
        const pendingOrder = await sql`
            INSERT INTO orders (tenant_id, customer_id, quote_id, quote_version_id, order_no, total_amount, paid_amount, status, settlement_type, sales_id, created_by)
            VALUES (${tenantId}, ${customerId}, ${quoteId}, ${quoteId}, ${orderNo}, 10000.00, 0.00, 'SIGNED', 'CREDIT', ${userId}, ${userId})
            RETURNING id
        `;
        const orderId = pendingOrder[0].id;

        await sql`
            INSERT INTO ar_statements (tenant_id, order_id, statement_no, total_amount, received_amount, pending_amount, status, customer_id, sales_id, customer_name, settlement_type)
            VALUES (${tenantId}, ${orderId}, ${generateDocNo('AR')}, 10000.00, 0.00, 10000.00, 'PENDING_RECON', ${customerId}, ${userId}, 'E2E客户-财务测试', 'CREDIT')
        `;

        // 插入收款计划
        await sql`
            INSERT INTO payment_schedules (tenant_id, order_id, name, amount, status, expected_date)
            VALUES 
            (${tenantId}, ${orderId}, '定金', 5000.00, 'PENDING', ${new Date(Date.now() + 86400000 * 3)}),
            (${tenantId}, ${orderId}, '尾款', 5000.00, 'PENDING', ${new Date(Date.now() + 86400000 * 30)})
        `;

        // 4. 创建 Partial 状态的订单和 AR
        const partialQuoteNo = generateDocNo('QUO');
        const [partialQuote] = await sql`
            INSERT INTO quotes (tenant_id, customer_id, quote_no, total_amount, status, created_by)
            VALUES (${tenantId}, ${customerId}, ${partialQuoteNo}, 5000.00, 'ACCEPTED', ${userId})
            RETURNING id
        `;
        const partialQuoteId = partialQuote.id;

        const partialOrder = await sql`
            INSERT INTO orders (tenant_id, customer_id, quote_id, quote_version_id, order_no, total_amount, paid_amount, status, settlement_type, sales_id, created_by)
            VALUES (${tenantId}, ${customerId}, ${partialQuoteId}, ${partialQuoteId}, ${generateDocNo('ORD')}, 5000.00, 2000.00, 'SIGNED', 'CREDIT', ${userId}, ${userId})
            RETURNING id
        `;
        const partialOrderId = partialOrder[0].id;

        const partialAr = await sql`
            INSERT INTO ar_statements (tenant_id, order_id, statement_no, total_amount, received_amount, pending_amount, status, customer_id, sales_id, customer_name, settlement_type)
            VALUES (${tenantId}, ${partialOrderId}, ${generateDocNo('AR')}, 5000.00, 2000.00, 3000.00, 'PARTIAL', ${customerId}, ${userId}, 'E2E客户-财务测试', 'CREDIT')
            RETURNING id
        `;

        await sql`
            INSERT INTO receipt_bills (tenant_id, receipt_no, total_amount, payment_method, received_at, status, created_by, type, customer_name, customer_phone, remaining_amount, proof_url)
            VALUES (${tenantId}, ${generateDocNo('REC')}, 2000.00, 'WECHAT', ${new Date()}, 'APPROVED', ${userId}, 'NORMAL', 'E2E客户-财务测试', '13811111111', 0, 'http://test.com/proof.jpg')
        `;

        console.log('✅ Finance data seeded successfully!');
        await sql.end();

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        await sql.end();
        process.exit(1);
    }
}

main();
