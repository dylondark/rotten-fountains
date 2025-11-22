import pool from '../src/utils/postgres.js';

async function fix() {
  const client = await pool.connect();
  try {
    // Ensure table exists
    await client.query(`CREATE TABLE IF NOT EXISTS fountains (
      id SERIAL PRIMARY KEY,
      number TEXT,
      location TEXT,
      description TEXT,
      flavordescription TEXT,
      flavorrating TEXT,
      images TEXT[],
      other TEXT,
      video TEXT
    );`);
    // Force flavorrating TEXT
    try { await client.query("ALTER TABLE fountains ALTER COLUMN flavorrating TYPE TEXT USING flavorrating::TEXT;"); } catch {}
    // Migrate raw column if present
    try {
      const col = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='fountains' AND column_name='flavorrating_raw'");
      if (col.rows.length) {
        await client.query("UPDATE fountains SET flavorrating = COALESCE(flavorrating_raw, flavorrating)");
        await client.query("ALTER TABLE fountains DROP COLUMN flavorrating_raw");
      }
    } catch {}
    // Ensure ancillary columns
    try { await client.query("ALTER TABLE fountains ADD COLUMN IF NOT EXISTS other TEXT;"); } catch {}
    try { await client.query("ALTER TABLE fountains ADD COLUMN IF NOT EXISTS video TEXT;"); } catch {}
    console.log('Schema fix complete.');
  } catch (e) {
    console.error('Schema fix failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
