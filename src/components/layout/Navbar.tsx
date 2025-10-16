import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          RottenFountains
        </Link>
        <div className="flex items-center gap-4">
          {/* Search box (visual only - no behavior implemented yet) */}
          <div className="hidden sm:block">
            <input
              type="search"
              placeholder="Search fountains..."
              aria-label="Search fountains"
              className="w-64 border border-gray-200 text-gray-700 rounded px-3 py-1 text-sm placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex gap-4 text-gray-700">
            <Link href="/fountains" className="hover:text-blue-600">Fountains</Link>
            <Link href="/about" className="hover:text-blue-600">About</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
