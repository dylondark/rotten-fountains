import { NextResponse } from 'next/server';
import updateAllTasteProfiles from '@/utils/updateTasteProfiles';

export async function POST() {
  try {
    const res = await updateAllTasteProfiles({
      ollamaUrl: process.env.OLLAMA_URL,
      model: process.env.OLLAMA_MODEL,
      delayMs: process.env.TASTE_PROFILE_DELAY_MS ? parseInt(process.env.TASTE_PROFILE_DELAY_MS, 10) : 250,
    });

    return NextResponse.json({ ok: true, result: res });
  } catch (err) {
    console.error('API trigger error for taste profile update:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
