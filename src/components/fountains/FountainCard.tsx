import Link from "next/link";
import { Droplets } from "lucide-react";
import { Fountain } from "@/types/fountain";

export default function FountainCard({ fountain }: { fountain: Fountain }) {
  return (
    <Link href={`/fountains/${fountain.id}`}>
      <div className="p-4 bg-white rounded-2xl shadow hover:shadow-lg transition">
        <h2 className="font-semibold text-lg">{fountain.number}</h2>
        <p className="text-sm text-gray-500 mb-2">{fountain.location}</p>
        <div className="flex items-center gap-1 mt-1">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{fountain.flavorRating.toFixed(1)} / 10</span>
        </div>
        <p className="text-sm mt-2 text-gray-600 line-clamp-2">
          {fountain.flavorDescription}
        </p>
      </div>
    </Link>
  );
}
