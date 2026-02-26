const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:111111@127.0.0.1:5432/l2c' });
client.connect().then(() => client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['sales_targets'])).then(res => { console.log(res.rows); client.end() }).catch(console.error);
