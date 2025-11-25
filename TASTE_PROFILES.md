# Taste Profile Updater

This repository includes a background/CLI/HTTP-triggered routine that infers per-user "taste profiles"
from their fountain reviews using an LLM (via an Ollama HTTP server), and stores those profiles in the
database.

This document explains what was added, how it operates, environment variables, and how to run it.

## What was added

- `src/utils/updateTasteProfiles.js` — core updater. Queries users who have reviews, composes a prompt
  containing their review text, calls an Ollama server to infer a short taste profile, and upserts the
  result into the `taste_profile` table.
- `scripts/update-taste-profiles.js` — CLI runner. Can run once or as a periodic daemon (env/configurable).
- `src/app/api/admin/update-taste-profiles/route.ts` — Next.js POST endpoint to trigger an update run from the server.
- `package.json` — added `update:taste-profiles` npm script to run the CLI.

## Database schema

The updater creates the `taste_profile` table if it does not exist:

```
CREATE TABLE IF NOT EXISTS taste_profile (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  taste_profile TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);
```

The updater only processes reviews that are associated with a `user_id` (i.e., reviews tied to registered users).

## How it works

1. The updater queries `users` joined with `reviews` and aggregates each user's review text.
2. It constructs a prompt that asks the LLM to summarize a concise 1–2 sentence taste profile and a one-line
   comma-separated list of simple attributes.
3. The prompt is sent to an Ollama HTTP endpoint. The textual reply is stored as the user's `taste_profile`.
4. The updater upserts into `taste_profile` table and records `last_updated`.

A small delay (default 250ms) is added between LLM calls to avoid overwhelming the LLM server.

## How to run

One-off run (recommended for testing):

```zsh
npm run update:taste-profiles
# or
node ./scripts/update-taste-profiles.js --once
```

Run as a daemon (periodic updates):

```zsh
# Run with env to enable daemon mode and set interval (minutes)
RUN_AS_DAEMON=true TASTE_PROFILE_INTERVAL_MINUTES=60 npm run update:taste-profiles
```

Trigger from the running Next.js server (manual):

```bash
curl -X POST http://localhost:3000/api/admin/update-taste-profiles
```

## Environment variables

- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — standard Postgres connection variables used by the repo.
- `OLLAMA_URL` — base URL of your Ollama server (default: `http://localhost:11434`).
- `OLLAMA_MODEL` — model name to pass to Ollama (default: `llama2`).
- `TASTE_PROFILE_DELAY_MS` — ms delay between LLM calls (default: `250`).
- `TASTE_PROFILE_INTERVAL_MINUTES` — daemon interval in minutes (default: `60`).
- `RUN_AS_DAEMON` — set to `true` (or pass `--daemon`) to run the CLI in periodic mode.

## Prompt & output

The updater asks the LLM to produce:
- A short human-readable paragraph (1–2 sentences) describing the user's preferences.
- A one-line comma-separated list of simple attributes (e.g., `cold, metallic, clean`).

If you need structured output (JSON, canonical tags, etc.), modify `src/utils/updateTasteProfiles.js` to change
the prompt and parse the result accordingly.

## Troubleshooting

- If Ollama responds in an unexpected JSON shape, the helper attempts several common response formats, but you
  may need to adapt `callOllama` in `src/utils/updateTasteProfiles.js` for your Ollama version.
- If the script fails early, check DB connectivity and credentials (same as other scripts in `scripts/`).
- Long review text is truncated to avoid sending very large payloads — adjust the 12k character cap in the updater
  if you need more.

## Security & deployment notes

- Running the daemon from the app server is only appropriate for self-hosted environments. On serverless platforms
  use an external scheduler (cron, GitHub Actions, etc.) that calls the API endpoint or runs the CLI.
- LLM outputs are not verified; they may hallucinate. If this data is used for recommendations, consider adding
  downstream validation or asking for structured JSON from the model.

## Next steps / improvements

- Add option to request structured JSON output from the LLM and store parsed attributes in the DB.
- Add an admin UI page to view and manually re-run profile generation per user.
- Add unit/integration tests that run the updater against a test DB and a mocked LLM.

If you want, I can adapt the prompt to return strict JSON and update the code to parse and store attributes separately.
