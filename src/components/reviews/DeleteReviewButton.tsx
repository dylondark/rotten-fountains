"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteReviewButton({ review, fountainId }: { review: any; fountainId: number }) {
  const router = useRouter();
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

  // Only show button if user exists and matches the review author email
  const isAuthor = user && (user.email === review.user_email || user.email === review.user_email);
  if (!isAuthor) return null;

  async function onDelete() {
    if (!confirm('Delete this review? This action cannot be undone.')) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/fountains/${fountainId}/reviews/${review.id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user.email },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not delete review');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error('Delete review error', err);
      setError('Unexpected error');
      setLoading(false);
    }
  }

  return (
    <div className="ml-auto">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        onClick={onDelete}
        disabled={loading}
        className={`px-2 py-1 text-sm rounded bg-red-600 text-white ${loading ? 'opacity-60' : 'hover:bg-red-700'}`}
      >
        {loading ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
