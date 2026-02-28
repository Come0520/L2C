import 'dotenv/config';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('再次尝试执行原生 SQL，先 DROP DEFAULT，再转型，再重设 DEFAULT...');
    try {
        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "added_permissions" DROP DEFAULT;`));
        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "added_permissions" TYPE jsonb USING "added_permissions"::jsonb;`));
        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "added_permissions" SET DEFAULT '[]'::jsonb;`));
        console.log('✔ added_permissions 转换成功');

        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "removed_permissions" DROP DEFAULT;`));
        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "removed_permissions" TYPE jsonb USING "removed_permissions"::jsonb;`));
        await db.execute(sql.raw(`ALTER TABLE "role_overrides" ALTER COLUMN "removed_permissions" SET DEFAULT '[]'::jsonb;`));
        console.log('✔ removed_permissions 转换成功');

        console.log('转换完毕，正在退出...');
    } catch (error) {
        console.error('转换失败:', error);
    } finally {
        process.exit(0);
    }
}

main();
