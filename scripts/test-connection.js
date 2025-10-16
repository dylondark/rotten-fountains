import pool from '../src/utils/postgres.js';

async function test() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM fountains;');
    console.log('Rows:', res.rows);
  } catch (err) {
    console.error('Test query error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

test();
