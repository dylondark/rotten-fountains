import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          RottenFountains
        </Link>
        <div className="flex gap-4">
          <Link href="/fountains" className="hover:text-blue-600">Fountains</Link>
          <Link href="/about" className="hover:text-blue-600">About</Link>
        </div>
      </div>
    </nav>
  );
}
