import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { users, customers, customerAddresses } from '../src/shared/api/schema';
import { CustomerService } from '../src/services/customer.service';
import { eq, and } from 'drizzle-orm';

async function main() {
    console.log('[DEBUG] Repro script started');

    try {
        // 1. 获取一个真实的租户和用户 ID
        const user = await db.query.users.findFirst({
            where: eq(users.isActive, true)
        });

        if (!user) {
            console.error('[ERROR] No active user found in DB to run the test');
            process.exit(1);
        }

        console.log(`[DEBUG] Using User: ${user.id}, Tenant: ${user.tenantId}`);

        const testPhone = '156' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        console.log(`[DEBUG] Creating customer with phone: ${testPhone}`);

        // 2. 调用服务层
        const result = await CustomerService.createCustomer(
            {
                name: 'Repro Test',
                phone: testPhone,
                type: 'INDIVIDUAL',
                level: 'D',
            },
            user.tenantId,
            user.id,
            { address: '上海市中山北路 3671 弄' }
        );

        console.log('[SUCCESS] Customer created:', JSON.stringify(result, null, 2));

    } catch (error: any) {
        console.error('[CRITICAL ERROR] Caught error during customer creation:');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.detail) console.error('Error Detail:', error.detail);
        if (error.table) console.error('Error Table:', error.table);
        if (error.constraint) console.error('Error Constraint:', error.constraint);
        if (error.stack) console.error('Error Stack:', error.stack);

        // 如果是 Drizzle 包装的错误，尝试查看原始错误
        if (error.cause) {
            console.error('[CAUSE]', error.cause);
        }
    } finally {
        // 强制退出以防连接池挂起
        process.exit(0);
    }
}

main();
