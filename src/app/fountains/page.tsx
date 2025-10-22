"use server";

import FountainCard from "@/components/fountains/FountainCard";
import { numberToGrade } from '@/utils/ratings';
import { Fountain } from "@/components/types/fountain";
import pool from "@/utils/postgres";

async function getFountainsFromDb(): Promise<Fountain[]> {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM fountains ORDER BY id;");
    // Map database columns to the Fountain type's property names (flavordescription -> flavorDescription)
    return res.rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      location: r.location,
      description: r.description,
      flavorDescription: r.flavordescription || r.flavorDescription || "",
      flavorRating: r.flavorrating || r.flavorRating || 0,
      images: r.images || [],
    }));
  } finally {
    client.release();
  }
}

export default async function FountainsPage({ searchParams }: { searchParams?: any }) {
  let fountains: Fountain[] = [];
  try {
    fountains = await getFountainsFromDb();
    console.log("Fetched fountains from DB:", fountains);
  } catch (err) {
    console.error("Error fetching fountains:", err);
  }

  // If a query is provided, filter the results server-side.
  const params = await searchParams;
  const q = (params && params.q) ? String(params.q).trim().toLowerCase() : "";
  let filtered = fountains;
  if (q) {
    filtered = fountains.filter((f) => {
      // check string fields
      const checks = [f.number, f.location, f.description, f.flavorDescription]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());

      const strMatch = checks.some((s) => s.includes(q));

  // also allow matching numeric flavorRating (e.g. searching '8.5' or '8')
  const ratingMatch = String(f.flavorRating).toLowerCase().includes(q);
  // allow matching letter grades (e.g. 'A', 'B+')
  const gradeMatch = String(numberToGrade(f.flavorRating)).toLowerCase().includes(q);

  return strMatch || ratingMatch || gradeMatch;
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Campus Fountains</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((fountain) => (
          <FountainCard key={fountain.id} fountain={fountain} />
        ))}
      </div>
    </div>
  );
}
