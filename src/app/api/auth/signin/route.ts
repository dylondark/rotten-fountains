import { NextResponse } from 'next/server';
import pool from '@/utils/postgres';
import crypto from 'crypto';

function hashPassword(password: string, salt: Buffer) {
  const iterations = 100_000;
  const keylen = 32;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256');
  return derived.toString('hex');
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    // Ensure users table exists (in case signup hasn't run yet)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const res = await client.query('SELECT id, name, email, password_hash, salt FROM users WHERE email = $1', [email]);
    if (res.rowCount === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = res.rows[0];
    const salt = Buffer.from(user.salt, 'hex');
    const attemptHash = hashPassword(password, salt);

    if (attemptHash !== user.password_hash) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Authentication successful — in a real app you'd set a session/cookie/JWT here
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Auth route error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
