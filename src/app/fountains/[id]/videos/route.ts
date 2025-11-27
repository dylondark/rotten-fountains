import pool from '@/utils/postgres';
import { NextResponse } from 'next/server';
import { getVideoUrlsForId } from '@/utils/videos';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT video FROM fountains WHERE id = $1', [id]);
    const dbVideo = res.rows.length ? res.rows[0].video : undefined;
    const videos = await getVideoUrlsForId(id, dbVideo);
    return NextResponse.json({ id, videos });
  } catch (err) {
    console.error('Error resolving videos:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
