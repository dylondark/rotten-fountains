import { NextResponse } from 'next/server';
import pool from '@/utils/postgres';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const fountainId = Number(params.id);
  if (Number.isNaN(fountainId)) return NextResponse.json({ ok: false, error: 'Invalid fountain id' }, { status: 400 });

  try {
    const body = await request.json();
    const { rating, flavorDescription, comments } = body || {};

    // Basic validation
    if (typeof rating !== 'number' || rating < 0 || rating > 10) {
      return NextResponse.json({ ok: false, error: 'Invalid rating' }, { status: 400 });
    }

    // Optional: associate user if provided via rf_user header (client stores user in localStorage)
    // For now expect client to include an 'x-user-email' header with the signed-in user's email
    const email = request.headers.get('x-user-email');

    const client = await pool.connect();
    try {
      // ensure reviews table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          fountain_id INTEGER NOT NULL REFERENCES fountains(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          user_name TEXT,
          user_email TEXT,
          rating REAL,
          flavor_description TEXT,
          comments TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      let userId = null;
      let userName = null;
      let userEmail = null;

      if (email) {
        const u = await client.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
        if (u.rowCount > 0) {
          userId = u.rows[0].id;
          userName = u.rows[0].name;
          userEmail = u.rows[0].email;
        }
      }

      await client.query(
        'INSERT INTO reviews (fountain_id, user_id, user_name, user_email, rating, flavor_description, comments) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [fountainId, userId, userName, userEmail, rating, flavorDescription, comments]
      );

      return NextResponse.json({ ok: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create review error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
