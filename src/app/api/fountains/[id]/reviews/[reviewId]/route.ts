import { NextResponse } from 'next/server';
import pool from '@/utils/postgres';

export async function DELETE(request: Request, { params }: { params: { id: string; reviewId: string } }) {
  const fountainId = Number(params.id);
  const reviewId = Number(params.reviewId);
  if (Number.isNaN(fountainId) || Number.isNaN(reviewId)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  try {
    // Expect client to include x-user-email header identifying the signed-in user
    const email = request.headers.get('x-user-email');

    const client = await pool.connect();
    try {
      // ensure reviews table exists (safe to run repeatedly)
      await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          fountain_id INTEGER NOT NULL REFERENCES fountains(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          rating REAL,
          flavor_description TEXT,
          comments TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      // find the review and its associated user email (if any)
      const res = await client.query(
        `SELECT r.id, r.user_id, u.email as user_email, r.fountain_id
         FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = $1 AND r.fountain_id = $2`,
        [reviewId, fountainId]
      );

      if (res.rowCount === 0) {
        return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 });
      }

      const row: any = res.rows[0];

      // Only allow delete if the requesting user email matches the review author's email
      if (row.user_email) {
        if (!email) {
          return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (email !== row.user_email) {
          return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }
      } else {
        // Review has no associated user; require matching email header to allow deletion to prevent anonymous deletion
        if (!email) {
          return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }
        // If desired, you might allow deletion of anonymous reviews by the same email that posted them if client recorded email; here we require email but no further check.
      }

      await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

      return NextResponse.json({ ok: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Delete review error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
