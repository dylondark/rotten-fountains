import { NextResponse } from 'next/server';
import pool from '@/utils/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body || {};
    if (!email) return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });

    const client = await pool.connect();
    try {
      // Find user
      const u = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (u.rowCount === 0) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
      const userId = u.rows[0].id;

      // Get taste profile for user
      const tp = await client.query('SELECT taste_profile, recommended_fountain_ids FROM taste_profile WHERE user_id = $1', [userId]);
      if (tp.rowCount === 0) return NextResponse.json({ ok: true, tasteProfile: null, recommendedIds: [], fountains: [] });

      const tasteProfile = tp.rows[0].taste_profile || null;
      const recommendedIds = tp.rows[0].recommended_fountain_ids || [];

      let fountains = [];
      if (Array.isArray(recommendedIds) && recommendedIds.length > 0) {
        const fres = await client.query('SELECT id, number, location, description, flavordescription, flavorrating, images FROM fountains WHERE id = ANY($1)', [recommendedIds]);
        fountains = fres.rows.map((r: any) => ({
          id: r.id,
          number: r.number,
          location: r.location,
          description: r.description,
          flavorDescription: r.flavordescription || r.flavorDescription || '',
          flavorRating: r.flavorrating || '',
          images: r.images || [],
        }));
      }

      return NextResponse.json({ ok: true, tasteProfile, recommendedIds, fountains });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Recommendations API error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
