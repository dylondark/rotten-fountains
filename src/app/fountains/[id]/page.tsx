import Image from "next/image";
import { notFound } from "next/navigation";
import { Fountain } from "@/components/types/fountain";
import pool from "@/utils/postgres";
import { getVideoUrlsForId } from "@/utils/videos";
import ReviewForm from "@/components/reviews/ReviewForm";
import DeleteReviewButton from '@/components/reviews/DeleteReviewButton';
import { numberToGrade } from '@/utils/ratings';
import Gallery from "@/components/media/Gallery";

async function getFountainById(id: number): Promise<Fountain | null> {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM fountains WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r: any = res.rows[0];
    const videos = await getVideoUrlsForId(id, r.video || r.videos);
    // Filter image paths to only those that physically exist under public/ to avoid 404 placeholders.
    const rawImages: string[] = Array.isArray(r.images) ? r.images : [];
    const fs = await import('fs');
    const path = await import('path');
    const publicDir = path.join(process.cwd(), 'public');
    const images = rawImages.filter((p) => {
      if (!p || typeof p !== 'string') return false;
      const rel = p.startsWith('/') ? p.slice(1) : p;
      const abs = path.join(publicDir, rel);
      try { return fs.existsSync(abs); } catch { return false; }
    });
    return {
      id: r.id,
      number: r.number,
      location: r.location,
      description: r.description,
      flavorDescription: r.flavordescription || r.flavorDescription || "",
      flavorRating: r.flavorrating || r.flavorRating || 0,
      images,
      videos,
    };
  } catch (err) {
    console.error("DB error fetching fountain:", err);
    return null;
  } finally {
    client.release();
  }
}

async function getReviewsByFountainId(id: number) {
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

    const res = await client.query(
      `SELECT r.id, r.fountain_id, r.user_id, u.name AS user_name, u.email AS user_email,
              r.rating, r.flavor_description, r.comments, r.created_at
       FROM reviews AS r
       INNER JOIN users AS u ON r.user_id = u.id
       WHERE r.fountain_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    return res.rows;
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  } finally {
    client.release();
  }
}

export default async function FountainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (Number.isNaN(id)) return notFound();

  const fountain = await getFountainById(id);
  if (!fountain) return notFound();

  const reviews = await getReviewsByFountainId(id);

  return (
    <div className="bg-gray-900 max-w-3xl mx-auto p-6 rounded-2xl shadow">
      <h1 className="text-3xl font-bold mb-2">{fountain.number}</h1>
      <p className="text-gray-500 mb-2">{fountain.location}</p>
      <p className="mb-4">{fountain.description}</p>

      <div className="mb-4">
        <h2 className="font-semibold mb-1">Flavor Description</h2>
        <p className="text-gray-700">{fountain.flavorDescription}</p>
      </div>

      <p className="text-lg font-semibold mb-4">
        💧 Flavor Rating: {fountain.flavorRating}
      </p>

      <Gallery images={fountain.images ?? []} videos={fountain.videos ?? []} />

      <section className="mt-8 bg-white p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3 text-black">User Reviews</h2>

        {/* Review submission form (client) */}
        <div className="mb-6">
          {/* ReviewForm will show sign-in prompt if user is not signed in */}
          <ReviewForm fountainId={id} />
        </div>

        {/* Existing reviews */}
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-gray-800">No reviews yet. Be the first to review this fountain!</p>
          )}

          {reviews.map((r: any) => (
            <div key={r.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">{r.user_name || r.user_email}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                  <DeleteReviewButton review={r} fountainId={id} />
                </div>
              </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="text-lg font-semibold text-black">Rating: {numberToGrade(r.rating)}</div>
                    </div>
              {r.flavor_description && (
                <div className="mt-2">
                  <h3 className="font-semibold text-gray-800">Flavor description</h3>
                  <p className="text-gray-700">{r.flavor_description}</p>
                </div>
              )}
              {r.comments && (
                <div className="mt-2">
                  <h3 className="font-semibold text-gray-800">Comments</h3>
                    <p className="text-gray-700">{r.comments}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
