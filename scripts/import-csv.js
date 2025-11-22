import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import pool from '../src/utils/postgres.js';
import xlsx from 'xlsx';

// We no longer convert ratings; we preserve the raw string exactly as in the source file.
function keepRawRating(cell) {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}

function normalizeImagesCell(cell) {
  if (!cell) return [];
  const parts = String(cell).split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  return parts.map(p => {
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p;
    return `/fountains/${p.replace(/^\//, '')}`;
  });
}

async function ensureSchema(client) {
  // Unified schema: single flavorrating TEXT column storing raw string; drop/merge any previous numeric or raw columns.
  await client.query(`
    CREATE TABLE IF NOT EXISTS fountains (
      id SERIAL PRIMARY KEY,
      number TEXT,
      location TEXT,
      description TEXT,
      flavordescription TEXT,
      flavorrating TEXT,
      images TEXT[],
      other TEXT,
      video TEXT
    );
  `);
  // Force flavorrating to TEXT unconditionally (handles prior REAL type).
  try {
    await client.query("ALTER TABLE fountains ALTER COLUMN flavorrating TYPE TEXT USING flavorrating::TEXT;");
  } catch (e) {
    // ignore if already TEXT
  }
  // Migrate and drop legacy flavorrating_raw if present.
  try {
    const colCheck = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='fountains' AND column_name='flavorrating_raw'");
    if (colCheck.rows.length) {
      await client.query("UPDATE fountains SET flavorrating = COALESCE(flavorrating_raw, flavorrating)");
      await client.query("ALTER TABLE fountains DROP COLUMN flavorrating_raw");
    }
  } catch (e) {
    // ignore
  }
  // Ensure other/video columns exist
  try { await client.query("ALTER TABLE fountains ADD COLUMN IF NOT EXISTS other TEXT;"); } catch (e) {}
  try { await client.query("ALTER TABLE fountains ADD COLUMN IF NOT EXISTS video TEXT;"); } catch (e) {}
}

async function importCsv(filePath, opts = { dryRun: false, batchSize: 500 }) {
  let records = [];
  if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
    // read the first sheet from the workbook and convert to JSON records
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  } else {
    const raw = await fs.readFile(filePath, 'utf8');
    records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  console.log(`Parsed ${records.length} rows from ${filePath}`);

  const client = await pool.connect();
  try {
    await ensureSchema(client);
    // Single INSERT statement with RETURNING so we can build id-based image placeholders.
    const insertText = `INSERT INTO fountains (number, location, description, flavordescription, flavorrating, images, other, video) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, images`;

    // Basic validation and transformation
      function getField(row, variants) {
        for (const v of variants) {
          if (v in row && String(row[v]).trim() !== '') return String(row[v]).trim();
          const lower = Object.keys(row).find(k => k.toLowerCase() === v.toLowerCase());
          if (lower && String(row[lower]).trim() !== '') return String(row[lower]).trim();
        }
        return '';
      }

      let autoCounter = 1;
  const rows = records.map((row) => {
        // Map common spreadsheet headers to canonical fields
        const floor = getField(row, ['Floor','floor']);
        const fountainNumberRaw = getField(row, ['Fountain Number','number','Fountain','Fountain #','fountain number']);
        const descField = getField(row, ['Fountain Description/Location','Fountain Description','Location','description']);
        // Compose location: prefer explicit campus floor prefix if present
        const locationParts = [];
        if (floor) locationParts.push(floor);
        if (descField) locationParts.push(descField);
        const location = locationParts.join(' - ');
        const number = fountainNumberRaw || (location ? `AUTO-${autoCounter++}` : '');
        const description = descField;
        const flavorDescription = getField(row, ['Flavor Description','flavorDescription','flavordescription']);
  const rawRatingOriginal = getField(row, ['Flavor Rating','flavorRating','flavorrating']);
  const flavorRating = keepRawRating(rawRatingOriginal); // raw string only
        const other = getField(row, ['Other','Notes']);
        const video = getField(row, ['Video of water','Video']);
        // Images: capture fountain + cup separately; generate placeholders if both missing.
        const fountainImgRaw = getField(row, ['Image of Fountain']);
        const cupImgRaw = getField(row, ['Image of Water in Cup']);
        let images = [];
        if (fountainImgRaw) images = images.concat(normalizeImagesCell(fountainImgRaw));
        if (cupImgRaw) images = images.concat(normalizeImagesCell(cupImgRaw));
        return { number, location, description, flavorDescription, flavorRating, images, other, video };
      }).filter(r => {
        // Keep rows that have either a number or a location; discard totally empty metadata lines
        if (!r.number && !r.location) {
          console.warn('Skipping empty metadata row:', r);
          return false;
        }
        return true;
      });

    if (opts.dryRun) {
      console.log('Dry run mode — no DB changes will be made. Example transformed rows:');
      console.log(rows.slice(0, 10));
      return;
    }

    // Insert in a transaction in batches
    await client.query('BEGIN');
    try {
      for (let i = 0; i < rows.length; i += opts.batchSize) {
        const batch = rows.slice(i, i + opts.batchSize);
        for (const r of batch) {
          const resInsert = await client.query(insertText, [
            r.number || null,
            r.location || null,
            r.description || null,
            r.flavorDescription || null,
            r.flavorRating || null, // raw string in flavorrating column
            r.images, // may be empty array
            r.other || null,
            r.video || null
          ]);
          if (!resInsert.rows.length) {
            console.warn('Insert returned no rows (unexpected), skipping placeholder generation for:', r.number);
            continue;
          }
          const insertedId = resInsert.rows[0].id;
          const currentImages = resInsert.rows[0].images || [];
          if (!currentImages || currentImages.length === 0) {
            const placeholders = [
              `/fountains/${insertedId}_fountain.jpg`,
              `/fountains/${insertedId}_cup.jpg`
            ];
            await client.query('UPDATE fountains SET images = $1 WHERE id = $2', [placeholders, insertedId]);
          }
        }
        console.log(`Inserted batch ${i / opts.batchSize + 1} (${batch.length} rows)`);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    console.log(`Imported ${rows.length} rows from ${filePath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { dryRun: false, batchSize: 500 };
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--batch-size') opts.batchSize = Number(args[++i] || 500);
    else files.push(a);
  }
  return { files, opts };
}

const { files, opts } = parseArgs(process.argv);
if (files.length === 0) {
  console.error('Usage: node import-csv.js [--dry-run] [--batch-size N] <path/to/fountains.csv>');
  process.exit(1);
}

importCsv(files[0], opts).catch(err => {
  console.error('Import failed:', err);
  process.exitCode = 1;
});
