// npm run validate — fails (exit 1) if the bank breaks any rule.
import type { Prompt } from '../src/core/matching';
import { PROMPTS_PER_DIVE } from '../src/core/tiers';
import { QUESTIONS, DIVES, ALLOW, DIVE_MIX, readJSON, nearDuplicates, pairKey, promptProblems, promptWarnings } from './bank-lib';

const prompts = readJSON<Prompt[]>(QUESTIONS, []);
const dives = readJSON<Record<string, string[]>>(DIVES, {});
const allow = new Set(readJSON<[string, string][]>(ALLOW, []).map(([a, b]) => pairKey(a, b)));

const errors: string[] = [];
const warnings: string[] = [];
const byId = new Map<string, Prompt>();

// prompts
for (const p of prompts) {
  if (byId.has(p.id)) errors.push(`duplicate prompt id "${p.id}"`);
  byId.set(p.id, p);
  promptProblems(p).forEach((e) => errors.push(`[${p.id}] ${e}`));
  promptWarnings(p).forEach((w) => warnings.push(`[${p.id}] ${w}`));
}

// near-duplicates
const dups = nearDuplicates(prompts).filter((d) => !allow.has(pairKey(d.a, d.b)));
for (const d of dups) {
  errors.push(`near-duplicate: "${byId.get(d.a)?.prompt}" ⟷ "${byId.get(d.b)?.prompt}" (${d.why}). If fine, add ["${d.a}","${d.b}"] to ${ALLOW}`);
}

// dives
const used = new Map<string, string>();
const nums = Object.keys(dives).map(Number).sort((a, b) => a - b);
nums.forEach((n, i) => { if (n !== i + 1) errors.push(`dive numbers must be 1..N with no gaps (found #${n} at position ${i + 1})`); });
for (const n of nums) {
  const ids = dives[String(n)];
  const tag = `dive #${n}`;
  if (ids.length !== PROMPTS_PER_DIVE) errors.push(`${tag} has ${ids.length} prompts (needs ${PROMPTS_PER_DIVE})`);
  const cats = new Map<string, number>();
  const mix = { everyday: 0, medium: 0, niche: 0 } as Record<string, number>;
  for (const id of ids) {
    if (used.has(id)) errors.push(`prompt "${id}" used in ${used.get(id)} AND ${tag}`);
    used.set(id, tag);
    const p = byId.get(id);
    if (!p) { errors.push(`${tag} references unknown prompt "${id}"`); continue; }
    cats.set(p.category, (cats.get(p.category) ?? 0) + 1);
    mix[p.difficulty ?? ''] = (mix[p.difficulty ?? ''] ?? 0) + 1;
  }
  for (const [c, k] of cats) if (k > 1) errors.push(`${tag} has ${k} prompts from "${c}"`);
  if ((cats.get('Pop Culture') ?? 0) > 1) errors.push(`${tag} has more than one Pop Culture prompt`);
  for (const [d, want] of Object.entries(DIVE_MIX)) if (mix[d] !== want) errors.push(`${tag} has ${mix[d] ?? 0} ${d} prompts (needs ${want})`);
}

const unassigned = prompts.filter((p) => !used.has(p.id)).length;
const answers = prompts.reduce((s, p) => s + p.answers.length, 0);

console.log(`\nGolden Krill bank: ${prompts.length} prompts · ${answers.toLocaleString()} answers · ${nums.length} dives · ${unassigned} prompts waiting in the pool`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); warnings.forEach((w) => console.log('  ⚠ ' + w)); }
if (errors.length) {
  console.log(`\n✖ ${errors.length} error(s):`);
  errors.forEach((e) => console.log('  ✖ ' + e));
  process.exit(1);
}
console.log('\n✔ bank is valid\n');
