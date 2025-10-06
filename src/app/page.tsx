import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">
        Welcome to RottenFountains
      </h1>
      <p className="text-gray-600 mb-8">
        Explore and rate the best drinking fountains on your college campus.
      </p>
      <Link
        href="/fountains"
        className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
      >
        Browse Fountains
      </Link>
    </div>
  );
}
