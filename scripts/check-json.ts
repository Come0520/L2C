import 'dotenv/config';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('检查失效的 JSON 字符串...');
    try {
        const res = await db.execute(sql`
      SELECT id, added_permissions, removed_permissions FROM role_overrides;
    `);

        let hasInvalid = false;
        for (const row of res) {
            try {
                if (row.added_permissions) JSON.parse(row.added_permissions as string);
                if (row.removed_permissions) JSON.parse(row.removed_permissions as string);
            } catch (e) {
                hasInvalid = true;
                console.log(`[INVALID JSON] ID: ${row.id}`);
                console.log(` - added_permissions: '${row.added_permissions}'`);
                console.log(` - removed_permissions: '${row.removed_permissions}'`);

                // 修复它们
                await db.execute(sql`
          UPDATE role_overrides 
          SET added_permissions = '[]', removed_permissions = '[]'
          WHERE id = ${row.id};
        `);
            }
        }

        if (!hasInvalid) {
            console.log('所有 JSON 均合法，可能是 USING 语法问题。');
        } else {
            console.log('无效的 JSON 数据已被置回 []');
        }

    } catch (error) {
        console.error('检查发生错误:', error);
    } finally {
        process.exit(0);
    }
}

main();
