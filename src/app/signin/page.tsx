"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Sign in failed');
        setLoading(false);
        return;
      }

      // on success, store user in localStorage and navigate to home
      try {
        localStorage.setItem('rf_user', JSON.stringify(data.user));
      } catch (err) {
        console.warn('Could not persist user to localStorage', err);
      }
      router.push('/');
    } catch (err) {
      console.error('Sign in error', err);
      setError('Unexpected error signing in');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center text-black">Sign in to RottenFountains</h1>

      <p className="text-sm text-gray-600 mb-6 text-center">
        Enter your campus email and password to continue. This demo uses a mock backend.
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@school.edu"
            className="mt-1 block w-full border border-gray-200 text-gray-700 placeholder-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 block w-full border border-gray-200 text-gray-700 placeholder-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-2 ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 rounded`}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="text-center text-sm text-gray-600">
          <Link href="/signup" className="text-blue-600 hover:underline">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
