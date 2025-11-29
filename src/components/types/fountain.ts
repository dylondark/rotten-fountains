export type Fountain = {
  id: number;
  number: string;
  location: string;
  description: string;
  flavorDescription: string;
  flavorRating: string;
  images?: string[];
  videos?: string[]; // Derived from single DB 'video' column if present
};
