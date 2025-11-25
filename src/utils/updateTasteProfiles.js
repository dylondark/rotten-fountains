import pool from './postgres.js';

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama2';

async function callOllama(prompt, { ollamaUrl = DEFAULT_OLLAMA_URL, model = DEFAULT_MODEL, max_tokens = 8192 } = {}) {
  const url = `${ollamaUrl.replace(/\/$/, '')}/api/generate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, num_predict: max_tokens }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // Modern Ollama API returns { response: "...", model: "...", ... }
  if (json?.response) {
    return json.response;
  }

  throw new Error(`Unexpected Ollama response format: ${JSON.stringify(json)}`);
}

/**
 * Update taste profiles for all users who have reviews.
 * Returns an object with counts and errors for reporting.
 */
export default async function updateAllTasteProfiles(options = {}) {
  const client = await pool.connect();
  const ollamaUrl = options.ollamaUrl || DEFAULT_OLLAMA_URL;
  const model = options.model || DEFAULT_MODEL;

  try {
    // Ensure taste_profile table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS taste_profile (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        taste_profile TEXT,
        recommended_fountain_ids INTEGER[],
        last_updated TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Load fountains once to provide candidates for recommendations
    const fountainsRes = await client.query(`
      SELECT id, number, location, description, flavordescription, flavorrating FROM fountains
    `);
    const fountains = fountainsRes.rows || [];

    // Fetch users that have at least one review tied to a user_id
    const res = await client.query(`
      SELECT u.id, u.name, u.email,
        string_agg(coalesce(r.flavor_description, '') || ' ' || coalesce(r.comments, ''), '\n---\n') AS reviews_text
      FROM users u
      JOIN reviews r ON r.user_id = u.id
      GROUP BY u.id
    `);

    if (res.rowCount === 0) {
      return { updated: 0, skipped: 0, errors: [] };
    }

    const results = { updated: 0, skipped: 0, errors: [] };

    for (const row of res.rows) {
      const userId = row.id;
      const name = row.name || row.email || `user:${userId}`;
      let reviewsText = String(row.reviews_text || '').trim();

      if (!reviewsText) {
        results.skipped += 1;
        continue;
      }

      // Limit the prompt size so we don't send excessively large payloads.
      if (reviewsText.length > 12000) reviewsText = reviewsText.slice(0, 12000) + '\n...[truncated]';

      const prompt = `You are given a collection of short user reviews for water fountains. Each review may include things like whether the water was cold, warm, metallic, clean, mineral, sweet, smelly, or other sensory impressions. Produce a concise "taste profile" for this user that summarizes their clear and consistent preferences when rating fountains. The output should be a short human-readable paragraph (1-2 sentences) followed by a one-line comma-separated list of simple attributes (e.g. "cold, metallic, clean"). Do not invent specifics about locations or timestamps. Reviews:\n\n${reviewsText}\n\nTaste profile:`;

      try {
        const llmResp = await callOllama(prompt, { ollamaUrl, model, max_tokens: 300 });

        const tasteProfile = String(llmResp || '').trim();

        // Now ask the LLM to pick up to 3 fountain ids that the user may like based on the taste profile.
        let recommendedIds = [];

        if (fountains.length > 0) {
          const fountainsText = fountains.map(f => `ID:${f.id} | ${f.number || ''} | ${f.location || ''} | flavor:${f.flavordescription || ''} | desc:${(f.description || '').slice(0,200)}`).join('\n');

          const pickPrompt = `Given the user's taste profile below, select up to three fountains from the following list that the user would most likely enjoy. Return ONLY a JSON array of integers (fountain ids), e.g. [1,2,3]. Do not include any other text.\n\nTaste profile:\n${tasteProfile}\n\nFountains:\n${fountainsText}\n\nSelected ids:`;

          try {
            const pickResp = await callOllama(pickPrompt, { ollamaUrl, model, max_tokens: 200 });
            const pickText = String(pickResp || '').trim();

            // Try to parse JSON array
            try {
              const parsed = JSON.parse(pickText);
              if (Array.isArray(parsed)) {
                recommendedIds = parsed.map(n => parseInt(n, 10)).filter(Number.isFinite);
              } else if (parsed?.ids && Array.isArray(parsed.ids)) {
                recommendedIds = parsed.ids.map(n => parseInt(n, 10)).filter(Number.isFinite);
              }
            } catch (e) {
              // Fallback: extract up to 3 integers from the response text
              const nums = Array.from(pickText.matchAll(/\d+/g)).map(m => parseInt(m[0], 10));
              recommendedIds = nums.slice(0, 3).filter(n => Number.isFinite(n));
            }

            // Ensure recommended ids exist in the fountains list
            const fountainIdSet = new Set(fountains.map(f => f.id));
            recommendedIds = recommendedIds.filter(id => fountainIdSet.has(id)).slice(0, 3);
          } catch (err) {
            console.error(`Error picking fountains for user ${userId}:`, err?.message || err);
          }
        }

        await client.query(
          `INSERT INTO taste_profile (user_id, taste_profile, recommended_fountain_ids, last_updated) VALUES ($1,$2,$3,now())
           ON CONFLICT (user_id) DO UPDATE SET taste_profile = EXCLUDED.taste_profile, recommended_fountain_ids = EXCLUDED.recommended_fountain_ids, last_updated = EXCLUDED.last_updated`,
          [userId, tasteProfile, recommendedIds]
        );

        results.updated += 1;
        // Small delay to avoid hammering Ollama when many users exist
        await new Promise((r) => setTimeout(r, options.delayMs || 250));
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err?.message || err);
        results.errors.push({ userId, error: String(err) });
      }
    }

    return results;
  } finally {
    client.release();
  }
}

export { callOllama };
