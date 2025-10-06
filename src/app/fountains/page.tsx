import FountainCard from "@/components/fountains/FountainCard";
import { Fountain } from "@/types/fountain";

export default function FountainsPage() {
  const fountains: Fountain[] = [
    {
      id: 1,
      number: "Fountain #12",
      location: "Engineering Building - 2nd Floor",
      description: "Cool and steady flow near the vending machines.",
      flavorDescription: "Tastes crisp with a hint of minerals.",
      flavorRating: 8.5,
      images: ["/fountains/12.jpg"],
    },
    {
      id: 2,
      number: "Fountain #5",
      location: "Library - Ground Floor",
      description: "Older unit, sometimes low pressure but clean.",
      flavorDescription: "Slightly metallic, still refreshing.",
      flavorRating: 7.2,
      images: ["/fountains/5.jpg"],
    },
    {
      id: 3,
      number: "Fountain #21",
      location: "Student Union - 1st Floor",
      description: "Modern refill station with cold, smooth water.",
      flavorDescription: "Perfectly neutral and refreshing flavor.",
      flavorRating: 9.3,
      images: ["/fountains/21.jpg"],
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Campus Fountains</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fountains.map(fountain => (
          <FountainCard key={fountain.id} fountain={fountain} />
        ))}
      </div>
    </div>
  );
}
