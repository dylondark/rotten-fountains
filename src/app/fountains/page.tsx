"use server";

import FountainCard from "@/components/fountains/FountainCard";
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

export default async function FountainsPage() {
  let fountains: Fountain[] = [];
  try {
    fountains = await getFountainsFromDb();
    console.log("Fetched fountains from DB:", fountains);
  } catch (err) {
    console.error("Error fetching fountains:", err);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Campus Fountains</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fountains.map((fountain) => (
          <FountainCard key={fountain.id} fountain={fountain} />
        ))}
      </div>
    </div>
  );
}
