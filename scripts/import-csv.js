import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import pool from '../src/utils/postgres.js';

function convertRatingCell(cell) {
  if (cell === null || cell === undefined || String(cell).trim() === '') return null;
  const s = String(cell).trim();

  // If purely numeric (single number), return that
  if (!isNaN(Number(s))) return Number(s);

  // If comma/pipe/semicolon-separated numbers, average them
  const parts = s.split(/[,;|]/).map(p => p.trim()).filter(Boolean);
  const numericParts = parts.filter(p => !isNaN(Number(p))).map(Number);
  if (numericParts.length > 0) {
    return numericParts.reduce((a,b) => a+b, 0) / numericParts.length;
  }

  // Otherwise try letter-grade mapping
  const map = {
    'A+': 10, 'A': 9.5, 'A-': 9.0,
    'B+': 8.0, 'B': 7.5, 'B-': 7.0,
    'C+': 6.5, 'C': 6.0, 'C-': 5.5,
    'D': 4.0, 'F': 2.0
  };

  // split non-numeric list, map letters, average if multiple
  const letterParts = s.split(/[,;|]/).map(p => p.trim().toUpperCase()).filter(Boolean);
  const mapped = letterParts.map(p => map[p]).filter(v => v !== undefined);
  if (mapped.length > 0) return mapped.reduce((a,b) => a+b, 0) / mapped.length;

  // fallback
  return null;
}

function normalizeImagesCell(cell) {
  if (!cell) return [];
  const parts = String(cell).split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  return parts.map(p => {
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p;
    return `/fountains/${p.replace(/^\//, '')}`;
  });
}

async function importCsv(filePath, opts = { dryRun: false, batchSize: 500 }) {
  const raw = await fs.readFile(filePath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Parsed ${records.length} rows from ${filePath}`);

  const client = await pool.connect();
  try {
    const insertText = `INSERT INTO fountains (number, location, description, flavordescription, flavorrating, images) VALUES ($1,$2,$3,$4,$5,$6)`;

    // Basic validation and transformation
    const rows = records.map((row) => {
      const number = row.number || row.Number || '';
      const location = row.location || row.Location || '';
      const description = row.description || row.Description || '';
      const flavorDescription = row.flavorDescription || row.flavordescription || row['flavor description'] || '';

      const rawRating = row.flavorRating || row.flavorrating || '';
      const flavorRating = convertRatingCell(rawRating);

      const rawImages = row.images || row.Images || '';
      const images = normalizeImagesCell(rawImages);

      return { number, location, description, flavorDescription, flavorRating, images };
    }).filter(r => {
      // require minimal fields
      if (!r.number || !r.location) {
        console.warn('Skipping row with missing required fields number/location:', r);
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
          await client.query(insertText, [r.number, r.location, r.description, r.flavorDescription, r.flavorRating, r.images]);
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
