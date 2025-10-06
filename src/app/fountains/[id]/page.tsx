import Image from "next/image";
import { notFound } from "next/navigation";
import { Fountain } from "@/types/fountain";

const fountains: Fountain[] = [
  {
    id: 1,
    number: "Fountain #12",
    location: "Engineering Building - 2nd Floor",
    description: "Cool and steady flow near the vending machines.",
    flavorDescription: "Tastes crisp with a hint of minerals.",
    flavorRating: 8.5,
    images: ["/fountains/12.jpg"],
    videos: [],
  },
  {
    id: 2,
    number: "Fountain #5",
    location: "Library - Ground Floor",
    description: "Older unit, sometimes low pressure but clean.",
    flavorDescription: "Slightly metallic, still refreshing.",
    flavorRating: 7.2,
    images: ["/fountains/5.jpg"],
    videos: [],
  },
];

export default function FountainDetailPage({ params }: { params: { id: string } }) {
  const fountain = fountains.find(f => f.id === Number(params.id));
  if (!fountain) return notFound();

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow">
      <h1 className="text-3xl font-bold mb-2">{fountain.number}</h1>
      <p className="text-gray-500 mb-2">{fountain.location}</p>
      <p className="mb-4">{fountain.description}</p>

      <div className="mb-4">
        <h2 className="font-semibold mb-1">Flavor Description</h2>
        <p className="text-gray-700">{fountain.flavorDescription}</p>
      </div>

      <p className="text-lg font-semibold mb-4">
        💧 Flavor Rating: {fountain.flavorRating.toFixed(1)} / 10
      </p>

      {fountain.images && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fountain.images.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`${fountain.number} photo ${i + 1}`}
              width={600}
              height={400}
              className="rounded-xl"
            />
          ))}
        </div>
      )}

      {fountain.videos && fountain.videos.length > 0 && (
        <div className="mt-6 space-y-4">
          {fountain.videos.map((url, i) => (
            <video key={i} controls className="w-full rounded-xl">
              <source src={url} type="video/mp4" />
            </video>
          ))}
        </div>
      )}
    </div>
  );
}
