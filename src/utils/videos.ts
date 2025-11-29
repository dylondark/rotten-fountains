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
  const existingFromFs: string[] = [];
  try {
    const files = await fs.readdir(videosDir);
    const re = new RegExp(`^(?:${id}|${id}-\\d+)\\.mp4$`);
    for (const f of files) {
      if (re.test(f)) {
        existingFromFs.push(`/videos/${f}`);
      }
    }
  } catch {
    // directory missing or unreadable; ignore
  }

  // Merge DB-declared and discovered filesystem videos, preserving DB order first.
  const candidate = [...videosFromDb, ...existingFromFs];

  // Filter out any paths whose files do not actually exist to avoid 404 black boxes.
  const resolved: string[] = [];
  for (const rel of candidate) {
    // Expect paths like /videos/<file>.mp4
    const localPath = rel.startsWith('/') ? rel.slice(1) : rel;
    const abs = path.join(publicDir, localPath);
    try {
      await fs.stat(abs); // exists
      if (!resolved.includes(rel)) resolved.push(rel);
    } catch {
      // missing; skip
    }
  }
  return resolved;
}
