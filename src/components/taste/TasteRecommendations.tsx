"use client";

import { useEffect, useState } from 'react';
import FountainCard from '@/components/fountains/FountainCard';

type Fountain = {
  id: number;
  number?: string;
  location?: string;
  description?: string;
  flavorDescription?: string;
  flavorRating?: string;
  images?: string[];
};

export default function TasteRecommendations() {
  const [loading, setLoading] = useState(false);
  const [fountains, setFountains] = useState<Fountain[]>([]);
  const [tasteProfile, setTasteProfile] = useState<string | null>(null);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('rf_user') : null;
    if (!raw) return;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const email = parsed?.email;
    if (!email) return;

    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/users/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const j = await res.json();
        if (j?.ok) {
          setTasteProfile(j.tasteProfile || null);
          setFountains(j.fountains || []);
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !fountains || fountains.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Recommended for you</h2>
      {tasteProfile && <p className="text-sm text-gray-600 mb-3">{tasteProfile}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fountains.map((f) => (
          <FountainCard key={f.id} fountain={f as any} />
        ))}
      </div>
    </section>
  );
}
