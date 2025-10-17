import pool from '../src/utils/postgres.js';

async function seed() {
  const client = await pool.connect();
  try {
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS fountains (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        flavordescription TEXT,
        flavorrating REAL,
        images TEXT[]
      );
    `);

    // Clear existing rows (for idempotent seed)
    await client.query('TRUNCATE TABLE fountains RESTART IDENTITY;');

    const insertText = `INSERT INTO fountains (number, location, description, flavordescription, flavorrating, images) VALUES ($1,$2,$3,$4,$5,$6)`;

    const sample = [
      [
        'Fountain #12',
        'Engineering Building - 2nd Floor',
        'Cool and steady flow near the vending machines.',
        'Tastes crisp with a hint of minerals.',
        8.5,
        ['/fountains/12.jpg']
      ],
      [
        'Fountain #5',
        'Library - Ground Floor',
        'Older unit, sometimes low pressure but clean.',
        'Slightly metallic, still refreshing.',
        7.2,
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #21',
        'Student Union - 1st Floor',
        'Modern refill station with cold, smooth water.',
        'Perfectly neutral and refreshing flavor.',
        9.3,
        ['/fountains/21.jpg']
      ]
    ];

    for (const row of sample) {
      await client.query(insertText, row);
    }

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
