import { NextResponse } from 'next/server';
import pool from '@/utils/postgres';
import crypto from 'crypto';

function hashPassword(password: string, salt: Buffer) {
  // PBKDF2 with SHA-256
  const iterations = 100_000;
  const keylen = 32;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256');
  return derived.toString('hex');
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { name, email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    if (typeof password === 'string' && password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Ensure users table exists
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

    // Check if email already exists
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) {
      return NextResponse.json({ ok: false, error: 'Email already registered' }, { status: 409 });
    }

    const salt = crypto.randomBytes(16);
    const passwordHash = hashPassword(password, salt);

    await client.query(
      'INSERT INTO users (name, email, password_hash, salt) VALUES ($1, $2, $3, $4)',
      [name || null, email, passwordHash, salt.toString('hex')]
    );

    return NextResponse.json({ ok: true, user: { name, email } }, { status: 201 });
  } catch (err) {
    console.error('Signup route error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
