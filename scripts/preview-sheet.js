import fs from 'fs/promises';
import xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';

async function preview(filePath, count = 10) {
  let records = [];
  if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  } else {
    const raw = await fs.readFile(filePath, 'utf8');
    records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  }

  console.log(`Detected ${records.length} rows. Showing up to ${count} rows:`);
  const sample = records.slice(0, count);
  console.log(JSON.stringify(sample, null, 2));

  if (records.length > 0) {
    const headers = Object.keys(records[0]);
    console.log('\nDetected headers:', headers.join(', '));
  }
}

if (process.argv.length < 3) {
  console.error('Usage: node preview-sheet.js <file> [count]');
  process.exit(1);
}

preview(process.argv[2], Number(process.argv[3] || 10)).catch(err => {
  console.error('Preview failed:', err);
  process.exitCode = 1;
});
