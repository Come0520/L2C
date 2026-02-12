import 'dotenv/config';
import { CustomerService } from '../src/services/customer.service';
import { db } from '../src/shared/api/db';
import { customers, customerAddresses } from '../src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const tenantId = 'e772e5f7-95fe-4b27-9949-fc69de11d647'; // Test Tenant
    const userId = 'f8abd711-153f-42f0-98c8-f0e79c00d141'; // 系统管理员

    // 注意：SQL 报错中第一个 UUID 是 tenant_id ($1)，第二个是 customer_id ($2)
    // 截图中：params: e772e5f7..., 3bc1436f...

    const testPhone = '199' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    console.log(`[TEST] Creating test customer with phone: ${testPhone}`);

    try {
        const result = await CustomerService.createCustomer(
            {
                name: '测试客户-' + Date.now(),
                phone: testPhone,
            },
            tenantId,
            userId,
            { address: '上海市中山北路3671弄' }
        );

        if (result.isDuplicate) {
            console.log('[TEST] Customer already exists.');
        } else {
            console.log('[TEST] Customer created successfully:', result.customer.id);

            // 验证地址是否插入成功
            const address = await db.query.customerAddresses.findFirst({
                where: eq(customerAddresses.customerId, result.customer.id)
            });

            if (address) {
                console.log('[TEST] Address created successfully:', address.id);
                console.log('[TEST] Address details:', {
                    province: address.province,
                    city: address.city,
                    district: address.district,
                    community: address.community,
                    address: address.address
                });
            } else {
                console.error('[TEST] Address creation failed: Address not found in database.');
            }
        }
    } catch (error) {
        console.error('[TEST] Error during verification:', error);
    } finally {
        process.exit(0);
    }
}

main();
