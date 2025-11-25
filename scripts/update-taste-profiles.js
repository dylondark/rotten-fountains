#!/usr/bin/env node
import updateAllTasteProfiles from '../src/utils/updateTasteProfiles.js';

async function runOnce() {
  console.log('Starting taste profile update run...');
  try {
    const res = await updateAllTasteProfiles({
      // allow overrides via env
      ollamaUrl: process.env.OLLAMA_URL,
      model: process.env.OLLAMA_MODEL,
      delayMs: process.env.TASTE_PROFILE_DELAY_MS ? parseInt(process.env.TASTE_PROFILE_DELAY_MS, 10) : 250,
    });
    console.log('Taste profile update completed:', res);
  } catch (err) {
    console.error('Taste profile update failed:', err);
    process.exitCode = 1;
  }
}

async function runDaemon(intervalMinutes = 60) {
  console.log(`Running taste profile updater as daemon; interval ${intervalMinutes} minutes`);
  await runOnce();
  setInterval(async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error('Periodic run error:', err);
    }
  }, intervalMinutes * 60 * 1000);
}

(async function main() {
  const args = process.argv.slice(2);
  const once = args.includes('--once') || args.includes('-1');
  const daemon = process.env.RUN_AS_DAEMON === 'true' || args.includes('--daemon');
  const intervalMinutes = parseInt(process.env.TASTE_PROFILE_INTERVAL_MINUTES || '60', 10);

  if (once) {
    await runOnce();
    process.exit(0);
  }

  if (daemon) {
    await runDaemon(intervalMinutes);
    return;
  }

  // Default: run once
  await runOnce();
  process.exit(0);
})();
