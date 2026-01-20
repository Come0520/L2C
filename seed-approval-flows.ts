
import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, and } from 'drizzle-orm';

const DEFAULT_FLOWS = [
    {
        code: 'QUOTE_DISCOUNT_APPROVAL',
        name: '报价折扣审批',
        description: '当报价折扣低于设定阈值或毛利过低时触发',
        nodes: [
            {
                name: '店长审批', // Was Sales Manager
                approverRole: 'STORE_MANAGER',
                sortOrder: 1,
            }
        ]
    },
    {
        code: 'ORDER_CHANGE',
        name: '订单变更审批',
        description: '订单关键信息变更或撤销时触发',
        nodes: [
            {
                name: '店长审批', // Was Operation Manager
                approverRole: 'STORE_MANAGER',
                sortOrder: 1,
            }
        ]
    },
    {
        code: 'FINANCE_PAYMENT', // Corrected from PAYMENT
        name: '付款审批',
        description: '大额付款或异常付款触发',
        nodes: [
            {
                name: '财务审核',
                approverRole: 'FINANCE',
                sortOrder: 1,
            }
        ]
    },
    {
        code: 'FINANCE_REFUND', // Corrected from REFUND
        name: '退款审批',
        description: '客户退款申请',
        nodes: [
            {
                name: '财务审核',
                approverRole: 'FINANCE',
                sortOrder: 1,
            }
        ]
    },
    {
        code: 'FREE_MEASURE_APPROVAL',
        name: '免费测量审批',
        description: '申请豁免测量费',
        nodes: [
            {
                name: '店长审批',
                approverRole: 'STORE_MANAGER',
                sortOrder: 1,
            }
        ]
    }
];

async function main() {
    console.log('🌱 Seeding Approval Flows...');

    const tenants = await db.query.tenants.findMany();

    for (const tenant of tenants) {
        console.log(`Processing Tenant: ${tenant.name}`);

        for (const flowDef of DEFAULT_FLOWS) {
            // Check if exists
            const existing = await db.query.approvalFlows.findFirst({
                where: and(
                    eq(schema.approvalFlows.tenantId, tenant.id),
                    eq(schema.approvalFlows.code, flowDef.code)
                )
            });

            if (existing) {
                console.log(`  - Flow ${flowDef.code} already exists.`);
                continue;
            }

            // Create Flow
            const [flow] = await db.insert(schema.approvalFlows).values({
                tenantId: tenant.id,
                code: flowDef.code,
                name: flowDef.name,
                description: flowDef.description,
                isActive: true
            }).returning();

            // Create Nodes
            for (const nodeDef of flowDef.nodes) {
                await db.insert(schema.approvalNodes).values({
                    tenantId: tenant.id,
                    flowId: flow.id,
                    name: nodeDef.name,
                    approverRole: nodeDef.approverRole as any, // Cast to enum
                    sortOrder: nodeDef.sortOrder,
                    nodeType: 'APPROVAL',
                    approverMode: 'ANY'
                });
            }
            console.log(`  + Created Flow ${flowDef.code}`);
        }
    }
    console.log('Done.');
    process.exit(0);
}

main().catch(console.error);
