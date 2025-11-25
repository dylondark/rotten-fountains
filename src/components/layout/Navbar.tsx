"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    // navigate to the fountains page with the query param (empty clears it)
    router.push(trimmed ? `/fountains?q=${encodeURIComponent(trimmed)}` : `/fountains`);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rf_user');
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch (err) {
      setUser(null);
    }

    function onStorage(e: StorageEvent) {
      if (e.key === 'rf_user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    }

    // Listen for same-tab sign-in/sign-out events. The StorageEvent doesn't fire
    // in the same tab that performs localStorage updates, so we dispatch a
    // custom event from the sign-in page and listen for it here.
    function onRfUser(e: Event) {
      try {
        const ce = e as CustomEvent;
        if (ce && ce.detail) {
          setUser(ce.detail);
          return;
        }
      } catch {}

      // Fallback: read from localStorage
      try {
        const raw2 = localStorage.getItem('rf_user');
        setUser(raw2 ? JSON.parse(raw2) : null);
      } catch {
        setUser(null);
      }
    }

  window.addEventListener('storage', onStorage);
  window.addEventListener('rf_user', onRfUser as EventListener);

    function onClickOutside(ev: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', onClickOutside);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('rf_user', onRfUser as EventListener);
      document.removeEventListener('click', onClickOutside);
    };
  }, []);

  function signOut() {
    localStorage.removeItem('rf_user');
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-4">
            <Image src="/logo/transparent_full_blue.png" alt="RottenFountains Logo" width={40} height={40} />
            RottenFountains
          </Link>
        </div>
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
                className="w-64 border border-gray-200 text-gray-700 rounded px-3 py-1 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </form>

          <div className="flex gap-4 text-gray-700 items-center">
            <Link href="/fountains" className="hover:text-blue-600">Fountains</Link>
            <Link href="/about" className="hover:text-blue-600">About</Link>

            {/* Auth status */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium">
                    {user.name ? String(user.name).split(' ').map((n: string)=>n[0]).slice(0,2).join('').toUpperCase() : String(user.email || '').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:block text-gray-700">{user.name || user.email}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-20">
                    <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="ml-2 px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
