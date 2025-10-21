"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ fountainId }: { fountainId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState<string>("");
  const [flavorDescription, setFlavorDescription] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getUser() {
    try {
      const raw = localStorage.getItem('rf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const user = getUser();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError('You must be signed in to post a review.');
      return;
    }

    const parsedRating = parseFloat(rating as any);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10) {
      setError('Please provide a rating between 0 and 10');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/fountains/${fountainId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
        body: JSON.stringify({ rating: parsedRating, flavorDescription, comments }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not submit review');
        setLoading(false);
        return;
      }

      // refresh the page to show the new review
      router.refresh();
    } catch (err) {
      console.error('Submit review error', err);
      setError('Unexpected error');
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 border rounded">
        <p className="text-sm text-gray-700">Please <a href="/signin" className="text-blue-600">sign in</a> to leave a review.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Rating (0-10)</label>
        <input
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          type="number"
          step="0.1"
          min="0"
          max="10"
          placeholder="8.5"
          className="mt-1 block w-40 border border-gray-200 text-gray-700 placeholder-gray-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Flavor description</label>
        <input
          value={flavorDescription}
          onChange={(e) => setFlavorDescription(e.target.value)}
          placeholder="Tastes crisp with a hint of minerals."
          className="mt-1 block w-full border border-gray-200 text-gray-700 placeholder-gray-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Comments (optional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Any notes about flow, pressure, accessibility..."
          className="mt-1 block w-full border border-gray-200 text-gray-700 placeholder-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div>
        <button type="submit" disabled={loading} className={`px-4 py-2 rounded bg-blue-600 text-white ${loading ? 'opacity-60' : 'hover:bg-blue-700'}`}>
          {loading ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  );
}
