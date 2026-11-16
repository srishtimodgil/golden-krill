// Shared helpers for the bank scripts (validator, dive builder, generator).
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { normalize, CATEGORIES, type Prompt } from '../src/core/matching';
import { TIERS } from '../src/core/tiers';

export const QUESTIONS = 'data/questions.json';
export const DIVES = 'data/dives.json';
export const ALLOW = 'data/near-dup-allow.json';

export const readJSON = <T>(path: string, fallback: T): T =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
export const writeJSON = (path: string, data: unknown) => writeFileSync(path, JSON.stringify(data, null, 1) + '\n');

export const TIER_NAMES = new Set(TIERS.map((t) => t.name));
export const CATEGORY_SET = new Set<string>(CATEGORIES);
export const DIFFICULTIES = ['everyday', 'medium', 'niche'] as const;
export const DIVE_MIX = { everyday: 2, medium: 3, niche: 2 } as const;

// ---------- near-duplicate prompt detection ----------
const STOP = new Set(['name', 'a', 'an', 'the', 'of', 'type', 'kind', 'variety', 'sort', 'form', 'famous', 'well', 'known', 'that', 'in', 'from', 'with', 'or', 'and', 'which', 'any', 'some', 'popular', 'common', 'is', 'are', 'can', 'one']);
const SYN: Record<string, string> = {
  beverage: 'drink', drinks: 'drink', automobile: 'car', vehicle: 'car', film: 'movie', nation: 'country',
  creature: 'animal', species: 'animal', dish: 'food', meal: 'food', cuisine: 'food', tv: 'show', series: 'show',
  sportsperson: 'athlete', player: 'athlete', instrument: 'instrument', canine: 'dog', feline: 'cat', hound: 'dog',
};

export function promptTokens(prompt: string): Set<string> {
  const t = normalize(prompt).split(' ').filter((w) => w && !STOP.has(w)).map((w) => SYN[w] ?? w);
  return new Set(t);
}

const jaccard = (a: Set<string>, b: Set<string>) => {
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return inter / (a.size + b.size - inter || 1);
};

function answerKeys(p: Prompt): Set<string> {
  return new Set(p.answers.map((a) => normalize(a.text, p.ignoreWords)));
}

export interface NearDup { a: string; b: string; why: string }

/** Pairs whose wording overlaps heavily, or whose answer lists largely coincide. */
export function nearDuplicates(prompts: Prompt[], against: Prompt[] = prompts): NearDup[] {
  const out: NearDup[] = [];
  const tok = new Map<Prompt, Set<string>>();
  const ans = new Map<Prompt, Set<string>>();
  const T = (p: Prompt) => tok.get(p) ?? (tok.set(p, promptTokens(p.prompt)), tok.get(p)!);
  const A = (p: Prompt) => ans.get(p) ?? (ans.set(p, answerKeys(p)), ans.get(p)!);
  const same = prompts === against;
  prompts.forEach((p, i) => {
    (same ? against.slice(i + 1) : against).forEach((q) => {
      if (p.id === q.id) return;
      const j = jaccard(T(p), T(q));
      let shared = 0;
      A(p).forEach((x) => A(q).has(x) && shared++);
      const overlap = shared / Math.min(A(p).size, A(q).size || 1);
      if (j >= 0.67) out.push({ a: p.id, b: q.id, why: `wording ${Math.round(j * 100)}% similar` });
      else if (overlap >= 0.5) out.push({ a: p.id, b: q.id, why: `${Math.round(overlap * 100)}% of answers shared` });
    });
  });
  return out;
}

export const pairKey = (a: string, b: string) => [a, b].sort().join(' | ');

// ---------- single-prompt rules (used by validator and generator) ----------
export function promptProblems(p: Prompt): string[] {
  const errs: string[] = [];
  if (!p.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errs.push(`bad id "${p.id}"`);
  if (!/^Name an? \S/.test(p.prompt ?? '')) errs.push(`prompt must start with "Name a/an": "${p.prompt}"`);
  if (!CATEGORY_SET.has(p.category)) errs.push(`unknown category "${p.category}"`);
  if (!DIFFICULTIES.includes(p.difficulty as never)) errs.push(`bad difficulty "${p.difficulty}"`);
  if (!Array.isArray(p.answers) || p.answers.length < 20) errs.push(`only ${p.answers?.length ?? 0} answers (min 20)`);
  const gk = (p.answers ?? []).filter((a) => a.tier === 'Golden Krill').length;
  if (gk !== 1) errs.push(`${gk} Golden Krill answers (must be exactly 1)`);
  const seen = new Map<string, string>();
  for (const a of p.answers ?? []) {
    if (!TIER_NAMES.has(a.tier)) errs.push(`invalid tier "${a.tier}" on "${a.text}"`);
    for (const form of [a.text, ...(a.aliases ?? [])]) {
      const k = normalize(form, p.ignoreWords);
      if (!k) { errs.push(`empty form on "${a.text}"`); continue; }
      const prev = seen.get(k);
      if (prev && prev !== a.text) errs.push(`"${form}" (${a.text}) collides with "${prev}" after normalising`);
      seen.set(k, a.text);
    }
  }
  return errs;
}

export function promptWarnings(p: Prompt): string[] {
  const w: string[] = [];
  const plank = p.answers.filter((a) => a.tier === 'Plankton').length;
  if (plank > 4) w.push(`${plank} Plankton answers (aim ≤3)`);
  if (p.answers.length < 25) w.push(`${p.answers.length} answers (aim 30+)`);
  return w;
}
