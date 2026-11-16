// npm run generate — ask Claude for 70 NEW prompts (= 10 dives), dedupe, validate, append as numbered dives.
//
//   npm run generate                  70 prompts (default)
//   npm run generate -- --count 35    any multiple of 7
//   npm run generate -- --dry-run     generate + check, but don't write anything
//
// Needs ANTHROPIC_API_KEY in .env (never committed; .env is in .gitignore).
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { normalize, CATEGORIES, type Prompt } from '../src/core/matching';
import { QUESTIONS, readJSON, writeJSON, nearDuplicates, promptProblems, promptWarnings } from './bank-lib';

if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY missing. Create a .env file containing:\n  ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const COUNT = Number(arg('--count') ?? 70);
const DRY = process.argv.includes('--dry-run');
const CHUNK = 10;
const MODEL = 'claude-opus-5-5';
if (COUNT % 7) { console.error('--count must be a multiple of 7'); process.exit(1); }

// ---------- what already exists (bank + any batch files not merged yet) ----------
function allBatchPrompts(dir = 'data/batches'): Prompt[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? allBatchPrompts(p) : f.endsWith('.json') ? readJSON<Prompt[]>(p, []) : [];
  });
}
const existing = new Map<string, Prompt>();
for (const p of [...readJSON<Prompt[]>(QUESTIONS, []), ...allBatchPrompts()]) existing.set(p.id, p);

// ---------- slot plan: balanced categories + 2/3/2 difficulty per 7 ----------
type Slot = { category: string; difficulty: 'everyday' | 'medium' | 'niche' };
function plan(n: number): Slot[] {
  const diffs: Slot['difficulty'][] = [];
  for (let i = 0; i < n / 7; i++) diffs.push('everyday', 'everyday', 'medium', 'medium', 'medium', 'niche', 'niche');
  // fewest-used categories first, pop culture capped at 1 per 7
  const counts = new Map<string, number>(CATEGORIES.map((c) => [c, 0]));
  [...existing.values()].forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
  return diffs.map((difficulty, i) => {
    const pick = [...counts.entries()]
      .filter(([c]) => c !== 'Pop Culture' || i % 7 === 0)
      .sort((a, b) => a[1] - b[1] || Math.random() - 0.5)[0][0];
    counts.set(pick, counts.get(pick)! + 1);
    return { category: pick, difficulty };
  });
}

// ---------- schema the model must return ----------
const TIER = z.enum(['Plankton', 'Too Clever', 'Schooler', 'Rare', 'Deep Cut', 'Golden Krill']);
const PromptSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  difficulty: z.enum(['everyday', 'medium', 'niche']),
  ignoreWords: z.array(z.string()),
  answers: z.array(z.object({ text: z.string(), aliases: z.array(z.string()), tier: TIER })),
});
const Batch = z.object({ prompts: z.array(PromptSchema) });

const STYLE = `You write content for "Golden Krill", a rarity trivia game. Each round shows a prompt; the player types ONE answer in 25 seconds; rarer valid answers score more.

PROMPT STYLE
- Always "Name a ___" / "Name an ___". Short, instantly understood, no trick wording.
- 1–3 obvious answers everyone thinks of PLUS a long tail of 30–100+ valid but rarer answers. That gap is the fun.
- Good: "Name a noodle dish", "Name a species of great ape", "Name a hot drink", "Name a variety of wine", "Name an interjection or exclamation", "Name a country with a coastline".
- Avoid: fewer than ~25 valid answers; answers needing exact spelling of long phrases; anything that changes over time (current leaders, recent winners, rosters); opinion-based categories; anything close to an existing prompt.
- difficulty: "everyday" = anyone can name several; "medium" = general knowledge; "niche" = needs real interest.
- Pop Culture: only huge, long-established franchises; answers are names only.

ANSWERS & TIERS (accuracy matters more than length)
- 30–60 answers per prompt, every one unambiguously valid. If unsure, leave it out.
- Tier = how likely an average adult thinks of it within 25 seconds:
  Plankton: the 1–3 answers almost everyone says first (max 3).
  Schooler: commonly known (~25%). Rare: known but rarely first (~30%). Deep Cut: enthusiast knowledge (~25%).
  Golden Krill: EXACTLY ONE per prompt — the single most impressive answer that is still unquestionably valid.
  Too Clever: 0–4 answers that are technically valid but feel like a loophole/cheat. Only if a genuine loophole exists.
- aliases: alternate spellings, abbreviations, alternate names. Not needed for case, accents, punctuation, leading "the", plural -s, or ignoreWords. Never give one alias to two answers.
- ignoreWords: words players tack on (e.g. "cheese", "dog"); never a word that distinguishes answers. Use [] if none.
- id: unique kebab-case slug.
Write everything yourself from general knowledge; do not copy lists from other games or sites.`;

const client = new Anthropic();

async function ask(slots: Slot[], avoid: string[]): Promise<Prompt[]> {
  const want = slots.map((s, i) => `${i + 1}. category "${s.category}", difficulty "${s.difficulty}"`).join('\n');
  // server-side refusal fallback: if the model declines, the API re-runs the request on a fallback model
  const stream = client.beta.messages.stream({
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: zodOutputFormat(Batch) },
    system: STYLE,
    messages: [{
      role: 'user',
      content: `EXISTING PROMPTS — do not repeat or closely paraphrase any of these, and avoid topics whose answer lists would heavily overlap:\n${avoid.join('\n')}\n\nWrite exactly ${slots.length} NEW prompts, one per slot:\n${want}`,
    }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error('model declined this chunk');
  if (msg.stop_reason === 'max_tokens') throw new Error('response hit max_tokens');
  const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const parsed = Batch.parse(JSON.parse(text));
  return parsed.prompts.map((p) => ({
    ...p,
    ignoreWords: p.ignoreWords.length ? p.ignoreWords : undefined,
    answers: p.answers.map((a) => (a.aliases.length ? a : { text: a.text, tier: a.tier })),
  }));
}

// ---------- run ----------
const slots = plan(COUNT);
const accepted: Prompt[] = [];
const dropped: { prompt: string; why: string }[] = [];
const normPrompt = (s: string) => normalize(s.replace(/^name an? /i, ''));
const seenText = new Set([...existing.values()].map((p) => normPrompt(p.prompt)));

console.log(`Generating ${COUNT} prompts with ${MODEL} in chunks of ${CHUNK} (${existing.size} existing prompts sent as the avoid-list)…`);
for (let i = 0; i < slots.length; i += CHUNK) {
  const chunk = slots.slice(i, i + CHUNK);
  const avoid = [...existing.values(), ...accepted].map((p) => `- ${p.prompt}`);
  let got: Prompt[] = [];
  try {
    got = await ask(chunk, avoid);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.error('  rate limited, skipping chunk (re-run later)');
    else if (err instanceof Anthropic.APIError) console.error(`  API error ${err.status}: ${err.message}`);
    else console.error(`  chunk failed: ${(err as Error).message}`);
    continue;
  }
  for (const p of got) {
    const problems = promptProblems(p);
    if (existing.has(p.id) || accepted.some((a) => a.id === p.id)) problems.push('id already exists');
    if (seenText.has(normPrompt(p.prompt))) problems.push('exact duplicate prompt');
    if (!problems.length) {
      const near = nearDuplicates([p], [...existing.values(), ...accepted]);
      if (near.length) problems.push(`near-duplicate of "${near[0].b}" (${near[0].why})`);
    }
    if (problems.length) { dropped.push({ prompt: p.prompt, why: problems.join('; ') }); continue; }
    accepted.push(p);
    seenText.add(normPrompt(p.prompt));
  }
  console.log(`  chunk ${i / CHUNK + 1}/${Math.ceil(slots.length / CHUNK)}: ${got.length} returned · ${accepted.length} accepted so far`);
}

// ---------- summary ----------
console.log(`\n${accepted.length} accepted · ${dropped.length} dropped`);
for (const d of dropped) console.log(`  ✖ ${d.prompt}: ${d.why}`);
for (const p of accepted) {
  const warn = promptWarnings(p);
  const gk = p.answers.find((a) => a.tier === 'Golden Krill')?.text;
  console.log(`  ✔ [${p.category} · ${p.difficulty}] ${p.prompt} (${p.answers.length} answers, Golden Krill: ${gk})${warn.length ? '  ⚠ ' + warn.join('; ') : ''}`);
}

if (DRY || !accepted.length) { console.log(DRY ? '\n--dry-run: nothing written' : ''); process.exit(0); }
mkdirSync('data/batches/generated', { recursive: true });
const file = `data/batches/generated/gen-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeJSON(file, accepted);
console.log(`\nwrote ${file}\nassigning dives…\n`);
execSync('npx tsx scripts/build-dives.ts && npx tsx scripts/validate-bank.ts', { stdio: 'inherit' });
