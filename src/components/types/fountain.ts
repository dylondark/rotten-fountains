export type Fountain = {
  id: number;
  number: string;           // e.g. "Fountain #12"
  location: string;         // e.g. "Engineering Building - 2nd Floor"
  description: string;      // Description of the fountain or its condition
  flavorDescription: string; // e.g. "Tastes crisp with a slight metallic hint"
  flavorRating: number;     // Average rating (1–10)
  images?: string[];        // URLs or local paths to images
  videos?: string[];        // URLs or local paths to videos
};
