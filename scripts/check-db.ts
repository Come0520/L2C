
import 'dotenv/config';
import { db } from "@/shared/api/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking install_tasks columns...");
    const result = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'install_tasks';
  `);
    console.log(result);
    process.exit(0);
}

main();
