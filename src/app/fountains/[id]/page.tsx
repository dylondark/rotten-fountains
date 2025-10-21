import Image from "next/image";
import { notFound } from "next/navigation";
import { Fountain } from "@/components/types/fountain";
import pool from "@/utils/postgres";

async function getFountainById(id: number): Promise<Fountain | null> {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM fountains WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r: any = res.rows[0];
    return {
      id: r.id,
      number: r.number,
      location: r.location,
      description: r.description,
      flavorDescription: r.flavordescription || r.flavorDescription || "",
      flavorRating: r.flavorrating || r.flavorRating || 0,
      images: r.images || [],
      videos: r.videos || [],
    };
  } catch (err) {
    console.error("DB error fetching fountain:", err);
    return null;
  } finally {
    client.release();
  }
}

export default async function FountainDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return notFound();

  const fountain = await getFountainById(id);
  if (!fountain) return notFound();

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
        💧 Flavor Rating: {fountain.flavorRating} / 10
      </p>

      {fountain.images && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fountain.images.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`${fountain.number} photo ${i + 1}`}
              width={600}
              height={400}
              className="rounded-xl"
            />
          ))}
        </div>
      )}

      {fountain.videos && fountain.videos.length > 0 && (
        <div className="mt-6 space-y-4">
          {fountain.videos.map((url, i) => (
            <video key={i} controls className="w-full rounded-xl">
              <source src={url} type="video/mp4" />
            </video>
          ))}
        </div>
      )}
    </div>
  );
}
