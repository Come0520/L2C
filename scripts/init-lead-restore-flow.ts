
import { db } from '@/shared/api/db';
import { approvalFlows, approvalNodes, tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 初始化线索恢复审批流
 * 
 * Flow: 线索恢复审批 (LEAD_RESTORE)
 * Node 1: 店长审批 (Role: MANAGER, Mode: ANY)
 */
async function main() {
    console.log('Starting Lead Restore Flow initialization...');

    // 1. 获取所有租户
    const allTenants = await db.query.tenants.findMany({
        columns: { id: true, name: true }
    });

    console.log(`Found ${allTenants.length} tenants.`);

    for (const tenant of allTenants) {
        console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

        // 2. 检查是否已存在
        const existingFlow = await db.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, tenant.id),
                eq(approvalFlows.code, 'LEAD_RESTORE')
            )
        });

        if (existingFlow) {
            console.log(`  - Flow already exists: ${existingFlow.id}`);
            continue;
        }

        // 3. 创建 Flow
        const [flow] = await db.insert(approvalFlows).values({
            tenantId: tenant.id,
            code: 'LEAD_RESTORE',
            name: '线索恢复审批',
            description: '当销售尝试恢复已作废的线索时触发',
            isActive: true,
            definition: { nodes: [], edges: [] } // Visual placeholder
        }).returning();

        console.log(`  - Created Flow: ${flow.id}`);

        // 4. 创建 Node 1: 店长审批
        await db.insert(approvalNodes).values({
            tenantId: tenant.id,
            flowId: flow.id,
            name: '店长审批',
            approverRole: 'STORE_MANAGER',
            approverMode: 'ANY', // 任意店长通过即可
            nodeType: 'APPROVAL',
            sortOrder: 1
        });

        console.log(`  - Created Node: Manager Approval`);
    }

    console.log('Initialization complete.');
    process.exit(0);
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
