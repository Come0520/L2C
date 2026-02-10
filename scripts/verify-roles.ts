
import { config } from 'dotenv';
config({ path: '.env' });

import { eq, and } from 'drizzle-orm';

async function main() {
    console.log('Starting verification of Role Management...');

    // Dynamically import app modules after env is loaded
    const { db } = await import('@/shared/api/db');
    const { roles, roleOverrides, users } = await import('@/shared/api/schema');
    const { RolePermissionService } = await import('@/shared/lib/role-permission-service');

    // 1. Get a valid tenantId
    const user = await db.query.users.findFirst();
    if (!user) {
        console.error('No users found in database. Cannot proceed.');
        process.exit(1);
    }
    const tenantId = user.tenantId;
    console.log(`Using Tenant ID: ${tenantId}`);

    // 2. Create a test role
    const testRoleCode = 'TEST_ROLE_' + Date.now();
    const testRoleName = 'Test Role ' + Date.now();
    const testPermissions = ['user.view', 'user.edit'];

    console.log(`Creating test role: ${testRoleCode}`);
    await db.insert(roles).values({
        tenantId,
        code: testRoleCode,
        name: testRoleName,
        description: 'Test Role Description',
        permissions: testPermissions,
        isSystem: false,
    });

    // 3. Verify getEffectivePermissions (Base)
    console.log('Verifying base permissions...');
    const effectivePermissions = await RolePermissionService.getEffectivePermissions(tenantId, testRoleCode);

    const hasBase = testPermissions.every(p => effectivePermissions.includes(p));
    if (hasBase && effectivePermissions.length === testPermissions.length) {
        console.log('✅ Base permissions verified.');
    } else {
        console.error('❌ Base permissions mismatch!');
        console.error('Expected:', testPermissions);
        console.error('Actual:', effectivePermissions);
    }

    // 4. Create an override
    console.log('Creating role override...');
    const addedPermissions = ['order.view'];
    const removedPermissions = ['user.edit'];

    await db.insert(roleOverrides).values({
        tenantId,
        roleCode: testRoleCode,
        addedPermissions: JSON.stringify(addedPermissions),
        removedPermissions: JSON.stringify(removedPermissions),
        updatedBy: user.id
    });

    // 5. Verify getEffectivePermissions (Override)
    console.log('Verifying overridden permissions...');
    const overriddenPermissions = await RolePermissionService.getEffectivePermissions(tenantId, testRoleCode);

    const expectedPermissions = ['user.view', 'order.view']; // user.edit removed, order.view added

    const hasExpected = expectedPermissions.every(p => overriddenPermissions.includes(p));
    const noUnexpected = overriddenPermissions.every(p => expectedPermissions.includes(p));

    if (hasExpected && noUnexpected) {
        console.log('✅ Overridden permissions verified.');
    } else {
        console.error('❌ Overridden permissions mismatch!');
        console.error('Expected:', expectedPermissions);
        console.error('Actual:', overriddenPermissions);
    }

    // 6. Cleanup
    console.log('Cleaning up test data...');
    await db.delete(roleOverrides).where(and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, testRoleCode)));
    await db.delete(roles).where(and(eq(roles.tenantId, tenantId), eq(roles.code, testRoleCode)));
    console.log('✅ Cleanup complete.');

    process.exit(0);
}

main().catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
});
