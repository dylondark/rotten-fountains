"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    // navigate to the fountains page with the query param (empty clears it)
    router.push(trimmed ? `/fountains?q=${encodeURIComponent(trimmed)}` : `/fountains`);
  }

  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          RottenFountains
        </Link>
        <div className="flex items-center gap-4">
          {/* Search box - navigates to /fountains?q=... */}
          <form onSubmit={onSubmit} className="hidden sm:block">
            <label htmlFor="nav-search" className="sr-only">Search fountains</label>
            <div className="flex items-center">
              <input
                id="nav-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search fountains..."
                aria-label="Search fountains"
                className="w-64 border border-gray-200 text-gray-700 rounded px-3 py-1 text-sm placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </form>

          <div className="flex gap-4 text-gray-700">
            <Link href="/fountains" className="hover:text-blue-600">Fountains</Link>
            <Link href="/about" className="hover:text-blue-600">About</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
