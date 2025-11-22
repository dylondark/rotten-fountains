import pool from '../src/utils/postgres.js';

// Migration script to convert existing dash-based placeholder names (<id>-fountain.jpg) to underscore (<id>_fountain.jpg)
// It only changes images that exactly match the dash pattern and have both fountain and cup forms.

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT id, images FROM fountains');
    let updated = 0;
    for (const row of rows) {
      const { id, images } = row;
      if (!Array.isArray(images) || images.length === 0) continue;
      // Detect old pattern
      const dashFountain = `/fountains/${id}-fountain.jpg`;
      const dashCup = `/fountains/${id}-cup.jpg`;
      const needsChange = images.includes(dashFountain) || images.includes(dashCup);
      if (!needsChange) continue;

      const newImages = images.map(img => {
        if (img === dashFountain) return `/fountains/${id}_fountain.jpg`;
        if (img === dashCup) return `/fountains/${id}_cup.jpg`;
        return img; // leave any user-supplied images untouched
      });
      await client.query('UPDATE fountains SET images = $1 WHERE id = $2', [newImages, id]);
      updated++;
    }
    console.log(`Image filename migration complete. Rows updated: ${updated}`);
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
