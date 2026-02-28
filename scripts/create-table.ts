import { sql } from 'drizzle-orm';
import { db } from '../src/shared/api/db';

async function main() {
    console.log('--- 开始创建 landing_testimonials 表 ---');
    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "landing_testimonials" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "content" text NOT NULL,
        "author_name" varchar(100) NOT NULL,
        "author_role" varchar(100),
        "author_company" varchar(200),
        "is_approved" boolean DEFAULT false NOT NULL,
        "sort_order" integer DEFAULT 100 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );
    `);
        console.log('+++ 创建成功 +++');
    } catch (err) {
        console.error('--- 创建失败 ---', err);
    }
    process.exit(0);
}

main();
