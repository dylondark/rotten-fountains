"use server";

import Link from "next/link";
import FountainCard from "@/components/fountains/FountainCard";
import { Fountain } from "@/components/types/fountain";
import pool from "@/utils/postgres";

async function getFountainsFromDb(limit = 3): Promise<Fountain[]> {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM fountains ORDER BY id LIMIT $1", [limit]);
    return res.rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      location: r.location,
      description: r.description,
  flavorDescription: r.flavordescription || r.flavorDescription || "",
  flavorRating: r.flavorrating || "",
      images: r.images || [],
    }));
  } finally {
    client.release();
  }
}

export default async function HomePage() {
  let featured: Fountain[] = [];
  try {
    featured = await getFountainsFromDb(3);
    console.log("Featured fountains:", featured);
  } catch (err) {
    console.error("Error loading featured fountains:", err);
  }

  return (
    <div className="text-center mt-6">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to RottenFountains</h1>
      <p className="text-gray-600 mb-8">Explore and rate the best drinking fountains on your college campus.</p>

      {featured.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Featured Fountains</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((f) => (
              <FountainCard key={f.id} fountain={f} />
            ))}
          </div>
        </section>
      )}

      <Link href="/fountains" className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
        Browse Fountains
      </Link>
    </div>
  );
}
