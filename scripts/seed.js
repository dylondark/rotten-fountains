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
        flavorrating TEXT,
        images TEXT[]
      );
    `);

    // Clear existing rows (for idempotent seed)
    await client.query('TRUNCATE TABLE fountains RESTART IDENTITY;');

    const insertText = `INSERT INTO fountains (number, location, description, flavordescription, flavorrating, images) VALUES ($1,$2,$3,$4,$5,$6)`;

    const sample = [
      [
        'Fountain #1B',
        'ASEC - Floor 1B',
        'By 15 Mech Engineering Research Lab. A button has dislodged from the machine.',
        'There is a slight aftertaste that doesnt last for too long. Cold. Due to location it will probably be cold year-round. Mineral flavor.',
        'B-,B+,A,',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #2B',
        'ASEC - Floor 1B',
        'Copper erosion and rust around faucet',
        'Really good and very cold',
        'A-,A-,B',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #3A B',
        'ASEC - Floor 1B',
        'Outside of B227, "splooge" came out of the faucet when first tapped.',
        'N/A',
        'N/A',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #3B B',
        'ASEC - Floor 1B',
        'Outside of B226 Looks Clean',
        'N/A',
        'N/A',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #1A A',
        'ASEC - Floor 1B',
        'OWarm and smells like clay and rum. F on looks. Eww looking.',
        'Slightly metallic, still refreshing.',
        'B,C+',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #1A B',
        'ASEC - Floor 1B',
        'Outside of Zips Electric and bathroom.',
        'Same as above but slightly worse. I think because we let it run for a bit. We think the water might not be perfectly clear... IT SMELLS THOUGH. Just when we touch metal?',
        'C+, C+',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #2A B',
        'ASEC - Floor 1B',
        'Located outside of B207 by flow',
        'Decent amount of metal but very cold',
        'B, C',
        ['/fountains/5.jpg']
      ],
      [
        'Fountain #2B B',
        'ASEC - Floor 1B',
        'Located outside of B207 not by flow',
        'Even more metal less cold but still cold',
        'D, B+',
        ['/fountains/5.jpg']
      ],
    ];

    for (const row of sample) {
      // Store raw flavor rating string exactly as provided (column is TEXT)
      const flavorRating = row[4] === undefined ? null : row[4];
      await client.query(insertText, [row[0], row[1], row[2], row[3], flavorRating, row[5]]);
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
