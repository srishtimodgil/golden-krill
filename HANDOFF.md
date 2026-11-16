# Handoff notes (for Claude or any developer picking this up)

## What this is
Golden Krill: an original browser rarity-trivia game (Vite + vanilla TypeScript, no backend). The game, scripts and README are built and working. See README.md for commands.

## Decisions already made with the owner (don't revisit)
- Name: **Golden Krill**. The top tier is also "Golden Krill". Do NOT use the name "Krillion" or "One in a Krillion", and don't copy krillion.io's look, assets or questions. Mechanics are inspired by it, but the identity is original.
- Look: "bathysphere sonar console". Phosphor green #7CFFB2, amber #FFB347, coral #FF6B5A (the player's answer), gold #FFD24A, dark green-black backgrounds. Fonts: Silkscreen + IBM Plex Mono. Riveted panels, CRT scanlines, a brass bathysphere hanging from a barge crane.
- Tiers: Plankton 10, Too Clever 15, Schooler 30, Rare 60, Deep Cut 85, Golden Krill 100. Depth = points × 10.
- **Exactly ONE Golden Krill answer per prompt** (enforced by the validator).
- Dives are fixed and append-only (data/dives.json). A prompt appears in only one dive. Each dive: 7 different categories, 2 everyday / 3 medium / 2 niche difficulty.
- End-screen recap has a full answer reveal (grouped by tier, rarest first, search box, copy). It is never shown during a dive.

## Current state
- 100 prompts (batch 1) → 13 dives; 9 prompts waiting in the pool. `npm test` checks all 7,332 answer forms and passes.
- Batch 1 was written by 5 agents. The owner hasn't formally reviewed it yet.

## Open items / next steps
1. **Owner review of batch 1.** Suggested fixes:
   - "Name a spice" → "Name a herb or spice" (it currently rejects basil/oregano).
   - Make Julius Caesar a Too Clever answer in roman-emperors.
   - The Beatles Golden Krill answer is a very long title; swap it for a shorter one.
   - Review `.venv/bin/python scripts/calibrate.py` flags (~140, many are false alarms on names).
2. Write the remaining bank in batches of 100 (target 1,050 prompts / 150 dives), then `npm run build-dives` and `npm run validate` after each batch. Category files go in data/batches/bNN/.
3. Deploy (Netlify Drop or GitHub + Vercel, see README).
4. The owner wants continuous generation. Recommended: a scheduled GitHub Action that runs `npm run generate` (key in a GitHub secret), commits, and redeploys. Cost was estimated at roughly $2–5 per 10 dives with claude-opus-5-5; not yet measured.
5. Reveal polish questions for the owner: chip size, collapse Deep Cut when long, include own answer in COPY.
6. v1.5 (ask the owner before starting): Supabase friends leaderboard behind the ScoreStore interface (see README).
