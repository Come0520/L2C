
import 'dotenv/config';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { sql } from 'drizzle-orm';

async function main() {
    const counts = await db
        .select({
            category: products.category,
            count: sql<number>`cast(count(*) as integer)`,
        })
        .from(products)
        .groupBy(products.category);

    console.log('Product Counts by Category:');
    counts.forEach(c => console.log(`${c.category}: ${c.count}`));
}

main().catch(console.error).finally(() => process.exit(0));
