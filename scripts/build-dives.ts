// npm run build-dives — merge new batch files into questions.json and append balanced dives.
// Existing dives are NEVER changed: dive #N is fixed forever once published.
//
//   npm run build-dives                 merge data/batches/**.json, then assign dives
//   npm run build-dives -- --dry-run    show what would happen
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Prompt } from '../src/core/matching';
import { QUESTIONS, DIVES, DIVE_MIX, readJSON, writeJSON, promptProblems } from './bank-lib';

const dry = process.argv.includes('--dry-run');

function batchFiles(dir = 'data/batches'): string[] {
  try {
    return readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? batchFiles(p) : f.endsWith('.json') ? [p] : [];
    }).sort();
  } catch { return []; }
}

const prompts = readJSON<Prompt[]>(QUESTIONS, []);
const dives = readJSON<Record<string, string[]>>(DIVES, {});
const ids = new Set(prompts.map((p) => p.id));

// 1. merge batches
let added = 0;
for (const file of batchFiles()) {
  for (const p of readJSON<Prompt[]>(file, [])) {
    if (ids.has(p.id)) continue;
    const errs = promptProblems(p);
    if (errs.length) { console.log(`skip ${p.id} (${file}): ${errs.join('; ')}`); continue; }
    prompts.push(p); ids.add(p.id); added++;
  }
}

// 2. assign unused prompts to new dives
const used = new Set(Object.values(dives).flat());
let pool = prompts.filter((p) => !used.has(p.id));

// deterministic PRNG so re-running gives the same result
let seed = 1 + Object.keys(dives).length * 7919;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function pickDive(): Prompt[] | null {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const chosen: Prompt[] = [];
    const cats = new Set<string>();
    const need = { ...DIVE_MIX } as Record<string, number>;
    // fill the scarcest difficulty first; prefer categories with the most prompts left, to avoid starving later dives
    const catCount = new Map<string, number>();
    pool.forEach((p) => catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1));
    for (const diff of Object.keys(need).sort((a, b) => pool.filter((p) => p.difficulty === a).length - pool.filter((p) => p.difficulty === b).length)) {
      for (let k = 0; k < need[diff]; k++) {
        const options = pool.filter((p) => p.difficulty === diff && !cats.has(p.category) && !chosen.includes(p));
        if (!options.length) break;
        const weights = options.map((p) => (catCount.get(p.category) ?? 1) ** 2 * (0.5 + rand()));
        let r = rand() * weights.reduce((s, w) => s + w, 0);
        const pick = options[weights.findIndex((w) => (r -= w) <= 0)] ?? options[0];
        chosen.push(pick); cats.add(pick.category);
      }
    }
    if (chosen.length === 7) {
      // order: open with an everyday prompt, close on a niche one
      const order = { everyday: 0, medium: 1, niche: 2 } as Record<string, number>;
      return chosen.sort((a, b) => order[a.difficulty!] - order[b.difficulty!] || rand() - 0.5);
    }
  }
  return null;
}

let next = Object.keys(dives).length + 1;
const firstNew = next;
for (;;) {
  const d = pickDive();
  if (!d) break;
  dives[String(next++)] = d.map((p) => p.id);
  pool = pool.filter((p) => !d.includes(p));
}

console.log(`merged ${added} new prompt(s) · total ${prompts.length}`);
console.log(next > firstNew ? `new dives #${firstNew}–#${next - 1}` : 'no new dives');
const left: Record<string, number> = {};
pool.forEach((p) => (left[`${p.category}/${p.difficulty}`] = (left[`${p.category}/${p.difficulty}`] ?? 0) + 1));
console.log(`${pool.length} prompt(s) left in the pool for the next batch`, pool.length ? left : '');

if (!dry) { writeJSON(QUESTIONS, prompts); writeJSON(DIVES, dives); console.log(`wrote ${QUESTIONS} and ${DIVES}`); }
