# Golden Krill

A browser trivia game about rare answers. Each dive is 7 prompts ("Name a type of cheese"). You get 25 seconds per prompt to type one answer, and rarer answers sink deeper. Dives are numbered and fixed (dive #N is the same for everyone) and never repeat.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. To test on your phone, open the "Network" URL that Vite prints (same Wi-Fi).

> If `npm install` fails with `EACCES` on `~/.npm`, fix the cache once with `sudo chown -R $(whoami) ~/.npm`, or install with `npm install --cache /tmp/npm-cache`.

## How the bank works

| File | What it is |
|---|---|
| `data/questions.json` | Every prompt: `{ id, prompt, category, difficulty, ignoreWords?, answers: [{ text, aliases?, tier }] }` |
| `data/dives.json` | `{ "1": [7 prompt ids], "2": [...] }`. Dives are append-only and never change once published. |
| `data/batches/**.json` | Staging area for new prompts before they're merged |
| `data/near-dup-allow.json` | Prompt pairs you've reviewed and decided are *not* duplicates |

### Rules (enforced by `npm run validate`)
- Every prompt starts with "Name a/an …", has at least 20 answers, uses valid tiers, and has exactly one Golden Krill.
- No two answers in a prompt match after normalization (case, accents, punctuation, a leading "the", plurals, ignoreWords).
- Prompt ids are unique, a prompt appears in at most one dive, and near-duplicate prompts are flagged (similar wording or ≥50% shared answers).
- Every dive has 7 prompts from 7 different categories (so at most one Pop Culture), split 2 everyday / 3 medium / 2 niche.

### Tiers
| Tier | Points | Sinks |
|---|---:|---:|
| Plankton | 10 | 100 m |
| Too Clever (valid, but a loophole) | 15 | 150 m |
| Schooler | 30 | 300 m |
| Rare | 60 | 600 m |
| Deep Cut | 85 | 850 m |
| Golden Krill (exactly one per prompt) | 100 | 1000 m |

## Add questions by hand
1. Put a JSON array of prompts in `data/batches/<anything>.json`.
2. `npm run build-dives` merges new prompts and builds as many balanced dives as the pool allows. Leftover prompts wait for the next batch.
3. `npm run validate`.

## Generate questions with Claude
```bash
cp .env.example .env        # then paste your key: ANTHROPIC_API_KEY=sk-ant-...
npm run generate            # 70 prompts = 10 new dives
npm run generate -- --count 35 --dry-run   # preview without writing anything
```
The generator sends Claude the full list of existing prompts so it avoids them. It asks for balanced categories and difficulties, and drops anything that fails validation or duplicates an existing prompt. Survivors go into `data/batches/generated/`, become new numbered dives, and the validator runs. Review the printed summary, then commit. `.env` is git-ignored.

## Check rarity
`calibrate.py` uses word frequency (via `wordfreq`) to flag answers whose tier looks wrong: very common words rated Rare or higher, or obscure words rated Plankton. It's only a hint. It can't judge names or phrases, so review the flags by hand.
```bash
python3 -m venv .venv && .venv/bin/pip install wordfreq
.venv/bin/python scripts/calibrate.py                     # whole bank
.venv/bin/python scripts/calibrate.py data/batches/b01    # one batch
```

## Deploy (free)

**Vercel:** import the repo at vercel.com. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.

**GitHub Pages:**
```bash
npm run build
npx gh-pages -d dist        # publishes dist/ to the gh-pages branch
```
Then in the repo, go to Settings → Pages → Branch: `gh-pages`. Asset paths are relative (`base: './'`), so it works on a sub-path like `you.github.io/golden-krill/`.

`npm run build` runs the validator first, so a broken bank never deploys.

## Code layout
```
src/core/      game logic, no DOM (reusable for a PWA / Expo app)
  matching.ts  normalization + exact / near-match rules
  tiers.ts     tiers, points, constants
  dive.ts      DiveSession: prompts per dive, submit/confirm/timeout, scoring
  history.ts   DiveRecord, Progress (next dive, resumable dive), ScoreStore + LocalScoreStore
  stats.ts     percentile, score curve, bearing bands, share text
src/ui/        scene (pixel ocean canvas), end screen, dive log, icons, Web Audio
scripts/       validate-bank.ts, build-dives.ts, generate.ts, calibrate.py
```

## v1.5: friends leaderboard with Supabase (planned)
Scores sit behind the `ScoreStore` interface (`src/core/history.ts`). v1 uses `LocalScoreStore` (localStorage). For v1.5:
1. Create a free project at supabase.com. In the SQL editor:
   ```sql
   create table scores (
     id bigint generated always as identity primary key,
     player_name text not null,
     dive_number int not null,
     score int not null,
     depth int not null,
     tiers text[] not null,
     created_at timestamptz default now(),
     unique (player_name, dive_number)
   );
   alter table scores enable row level security;
   create policy "read all" on scores for select using (true);
   create policy "insert own" on scores for insert with check (true);
   ```
2. Copy the project URL and anon key into `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Add a `SupabaseScoreStore` implementing `save`, `personal` and `friendsOnDive`. The end screen then shows "better than X of Y friends on dive #N" plus a small leaderboard, and falls back to personal history when fewer than 3 friends have played that dive.

(No login: players pick a display name on first visit. This is fine among friends, but anyone with the link could post a score under any name.)
