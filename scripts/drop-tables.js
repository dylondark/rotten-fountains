import pool from '../src/utils/postgres.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { cascade: false };
  const tables = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--cascade') opts.cascade = true;
    else tables.push(a);
  }
  return { tables, opts };
}

function isValidIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

async function dropTables(tables, { cascade }) {
  if (!tables.length) {
    console.error('Usage: node drop-tables.js [--cascade] <table1> [table2 ...]');
    process.exit(1);
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of tables) {
      if (!isValidIdentifier(t)) {
        throw new Error(`Invalid table identifier: ${t}`);
      }
      const sql = `DROP TABLE IF EXISTS ${t} ${cascade ? 'CASCADE' : ''}`;
      console.log('Executing:', sql);
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('Drop complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Drop failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

const { tables, opts } = parseArgs(process.argv);
dropTables(tables, opts);
