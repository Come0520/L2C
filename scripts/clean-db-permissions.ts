import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { roles } from '../src/shared/api/schema';
import { roleOverrides } from '../src/shared/api/schema/role-overrides';
import { eq } from 'drizzle-orm';

const replacements: Record<string, string> = {
    'quote.create': 'quote.own.edit',
    'quote.edit': 'quote.own.edit',
    'quote.manage': 'quote.all.edit',
    'order.create': 'order.own.edit',
    'order.edit': 'order.own.edit',
    'order.manage': 'order.all.edit',
    'install.create': 'install.own.edit',
    'install.edit': 'install.own.edit',
    'install.manage': 'install.all.edit',
    'after_sales.create': 'after_sales.own.edit',
    'after_sales.edit': 'after_sales.own.edit',
    'after_sales.manage': 'after_sales.all.edit',
    'measure.manage': 'measure.all.edit',
};

async function migratePermissions() {
    console.log('🔄 开始清理旧版权限数据...');

    try {
        // 1. 处理 roles 表 (系统预设的静态权限)
        const allRoles = await db.query.roles.findMany();
        let updatedRoles = 0;

        for (const roleDef of allRoles) {
            if (!roleDef.permissions) continue;

            let changed = false;
            const currentPerms = roleDef.permissions as string[];
            const newPerms = new Set<string>();

            for (const p of currentPerms) {
                if (replacements[p]) {
                    newPerms.add(replacements[p]);
                    changed = true;
                } else {
                    newPerms.add(p);
                }
            }

            const finalArr = Array.from(newPerms);

            if (changed) {
                await db.update(roles)
                    .set({ permissions: finalArr })
                    .where(eq(roles.id, roleDef.id));
                updatedRoles++;
            }
        }

        // 2. 处理 role_overrides 表
        const allOverrides = await db.query.roleOverrides.findMany();
        let updatedOverrides = 0;

        for (const override of allOverrides) {
            let changed = false;

            let added: string[] = [];
            let removed: string[] = [];
            try {
                added = override.addedPermissions ? JSON.parse(override.addedPermissions as string) : [];
            } catch (e) { }

            try {
                removed = override.removedPermissions ? JSON.parse(override.removedPermissions as string) : [];
            } catch (e) { }

            const newAdded = new Set<string>();
            const newRemoved = new Set<string>();

            for (const p of added) {
                if (replacements[p]) {
                    newAdded.add(replacements[p]);
                    changed = true;
                } else {
                    newAdded.add(p);
                }
            }

            for (const p of removed) {
                if (replacements[p]) {
                    newRemoved.add(replacements[p]);
                    changed = true;
                } else {
                    newRemoved.add(p);
                }
            }

            if (changed) {
                await db.update(roleOverrides)
                    .set({
                        addedPermissions: JSON.stringify(Array.from(newAdded)),
                        removedPermissions: JSON.stringify(Array.from(newRemoved)),
                    })
                    .where(eq(roleOverrides.id, override.id));
                updatedOverrides++;
            }
        }

        console.log(`✅ 清理完成！`);
        console.log(`- 修改了 ${updatedRoles} 个角色的预设权限`);
        console.log(`- 修改了 ${updatedOverrides} 个附加角色覆盖数据`);

    } catch (error) {
        console.error('❌ 执行失败:', error);
    } finally {
        process.exit(0);
    }
}

migratePermissions();
