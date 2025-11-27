import fs from 'fs/promises';
import path from 'path';

function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

export async function getVideoUrlsForId(id: number, dbVideo?: string | string[]): Promise<string[]> {
  const videosFromDb = toArray(dbVideo).filter(Boolean) as string[];
  const publicDir = path.join(process.cwd(), 'public');
  const videosDir = path.join(publicDir, 'videos');
  const existing: string[] = [];
  try {
    const files = await fs.readdir(videosDir);
    const re = new RegExp(`^(?:${id}|${id}-\\d+)\\.mp4$`);
    for (const f of files) {
      if (re.test(f)) {
        existing.push(`/videos/${f}`);
      }
    }
  } catch {
    // directory missing or unreadable; ignore
  }

  // Prefer DB-declared videos first, then filesystem matches
  const unique = new Set<string>([...videosFromDb, ...existing]);
  return Array.from(unique);
}
