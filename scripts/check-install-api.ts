import 'dotenv/config';
import { db } from '@/shared/api/db';
import { users, installTasks, installItems, tenants, customers, orders, quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { generateAccessToken } from '@/shared/lib/jwt';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🚀 Starting Installation API E2E Check...');

    // 1. Setup Data: Get Tenant & Worker
    console.log('1️⃣  Setting up test data...');
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) throw new Error('No tenant found');

    // Find or create a worker
    let worker = await db.query.users.findFirst({
        where: and(
            eq(users.tenantId, tenant.id),
            eq(users.role, 'WORKER') // Use WORKER string directly if enum not imported
        )
    });

    if (!worker) {
        console.log('   Creating test worker...');
        const [newWorker] = await db.insert(users).values({
            tenantId: tenant.id,
            name: 'Test Worker',
            phone: '13800000000',
            passwordHash: 'hashed_password',
            role: 'WORKER',
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        worker = newWorker;
    }
    console.log(`   Worker: ${worker.name} (${worker.id})`);

    // Generate Token
    const token = await generateAccessToken(
        worker.id,
        tenant.id,
        worker.phone,
        'WORKER'
    );
    console.log('   Token generated.');

    // 创建测试客户
    const customerId = uuidv4();
    await db.insert(customers).values({
        id: customerId,
        customerNo: `CUST-${Date.now()}`,
        tenantId: tenant.id,
        name: 'Test Customer',
        phone: '13900000000',
        assignedSalesId: worker.id,
        createdBy: worker.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`   Customer created (${customerId})`);


    // 创建测试报价单
    const quoteId = uuidv4();
    await db.insert(quotes).values({
        id: quoteId,
        tenantId: tenant.id,
        customerId: customerId,
        quoteNo: `QT-${Date.now()}`,
        version: 1,
        rootQuoteId: quoteId,
        status: 'APPROVED',
        totalAmount: '1000',
        finalAmount: '1000',
        createdBy: worker.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`   Quote created (${quoteId})`);

    // 创建测试订单
    const orderId = uuidv4();
    await db.insert(orders).values({
        id: orderId,
        tenantId: tenant.id,
        customerId: customerId,
        quoteId: quoteId,
        quoteVersionId: quoteId,
        orderNo: `ORD-${Date.now()}`,
        status: 'PENDING_INSTALL',
        totalAmount: '1000',
        paidAmount: '0',
        settlementType: 'CASH',
        salesId: worker.id,
        createdBy: worker.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log(`   Order created (${orderId})`);

    // 创建测试安装任务
    const taskId = uuidv4();
    console.log(`   Creating test Install Task (${taskId})...`);
    await db.insert(installTasks).values({
        id: taskId,
        taskNo: `INS-${Date.now()}`,
        tenantId: tenant.id,
        orderId: orderId,
        customerId: customerId,
        status: 'PENDING_ACCEPT', // Start from PENDING_ACCEPT
        installerId: worker.id,
        scheduledDate: new Date(),
        timeSlot: 'AM',
        address: 'Test Address 123',
        customerPhone: '13900000000',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Add some items
    await db.insert(installItems).values([
        { tenantId: tenant.id, installTaskId: taskId, roomName: 'Living Room', productName: 'Curtain A', quantity: '2', isInstalled: false },
        { tenantId: tenant.id, installTaskId: taskId, roomName: 'Bedroom', productName: 'Blind B', quantity: '1', isInstalled: false },
    ]);
    console.log('   Test data ready.');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Helper for fetch
    const apiCall = async (method: string, path: string, body?: any) => {
        const url = `${BASE_URL}${path}`;
        console.log(`\n👉 ${method} ${path}`);
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (!res.ok) {
            console.error(`   Error:`, JSON.stringify(data, null, 2));
            throw new Error(`API call failed: ${path}`);
        }
        return data;
    };

    try {
        // 2. Accept Task
        console.log('\n2️⃣  Accepting Task...');
        await apiCall('POST', `/api/mobile/tasks/${taskId}/install-accept`, {
            action: 'accept'
        });

        // 3. Check-in
        console.log('\n3️⃣  Checking In...');
        await apiCall('POST', `/api/mobile/tasks/${taskId}/install-check-in`, {
            latitude: 31.2304,
            longitude: 121.4737,
            accuracy: 10,
            address: 'Shanghai Test Location'
        });

        // 4. Get Items & Update
        console.log('\n4️⃣  Updating Items...');
        const itemsRes = await apiCall('GET', `/api/mobile/tasks/${taskId}`);
        // Note: Detail API returns { items: [...] }
        const items = itemsRes.data ? itemsRes.data.items : itemsRes.items; // Response structure wrapper check
        // Actually our apiSuccess returns 'data' field wrapped?
        // Let's check apiSuccess implementation -> usually returns JSON directly or { success: true, data: ... }
        // Looking at prev code: "return apiSuccess(items)" inside install-items route.
        // And "return apiSuccess({ taskId, ... })" inside detail route.
        // Assuming apiSuccess returns NextResponse.json(data) or { code: 200, data: ... }
        // Let's assume standard response { success: true, data: ... } or just data.
        // We'll see logs.

        // Let's call install-items specifically
        const installItemsList = await apiCall('GET', `/api/mobile/tasks/${taskId}/install-items`);
        const itemUpdates = (installItemsList.data || installItemsList).map((item: any) => ({
            id: item.id,
            isInstalled: true,
            actualInstalledQuantity: 1
        }));

        await apiCall('PUT', `/api/mobile/tasks/${taskId}/install-items`, {
            items: itemUpdates
        });

        // 5. Upload Photo
        console.log('\n5️⃣  Uploading Photo...');
        await apiCall('POST', `/api/mobile/tasks/${taskId}/install-photos`, {
            photoUrl: 'https://placehold.co/600x400.jpg',
            photoType: 'AFTER',
            remark: 'Installation done',
            roomName: 'Living Room'
        });

        // 6. Complete Task
        console.log('\n6️⃣  Completing Task...');
        await apiCall('POST', `/api/mobile/tasks/${taskId}/install-complete`, {
            latitude: 31.2305,
            longitude: 121.4738,
            accuracy: 20,
            address: 'Shanghai Test Location Exit',
            customerSignatureUrl: 'https://placehold.co/signature.png'
        });

        console.log('\n✅ E2E Check Passed Successfully!');

    } catch (error) {
        console.error('\n❌ E2E Check Failed:', error);
    } finally {
        // Cleanup? Maybe keep data for inspection.
        console.log('\n🧹 Done. Test data preserved for inspection.');
    }
}

main();
