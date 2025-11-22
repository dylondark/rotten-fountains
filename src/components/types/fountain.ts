export type Fountain = {
  id: number;
  number: string;            // e.g. "Fountain #12"
  location: string;          // e.g. "Engineering Building - 2nd Floor"
  description: string;       // Description of the fountain or its condition
  flavorDescription: string; // Descriptive text of taste/experience
  flavorRating: string;      // Raw rating string from source (e.g. "B-,B+,A," or "C+,C")
  images?: string[];         // URLs or local paths to images
  videos?: string[];         // URLs or local paths to videos
};
