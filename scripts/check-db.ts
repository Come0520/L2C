
import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  console.log('Connecting to:', databaseUrl);
  const sql = postgres(databaseUrl);

  try {
    const arCount = await sql`SELECT count(*) FROM ar_statements`;
    console.log('AR Statements Count:', arCount[0].count);

    if (arCount[0].count > 0) {
      const firstRow = await sql`SELECT * FROM ar_statements LIMIT 1`;
      console.log('First Row:', firstRow[0]);
    } else {
      console.log('❌ No AR Statements found!');
    }
  } catch (e) {
    console.error('❌ DB Query Error:', e);
  } finally {
    await sql.end();
  }
}

main();
