// Answer matching — pure functions, no DOM.
import type { TierName } from './tiers';

export interface Answer {
  text: string;
  aliases?: string[];
  tier: TierName;
}

export type Category =
  | 'Food & Drink' | 'Animals & Nature' | 'Geography' | 'Pop Culture' | 'Science & Body'
  | 'History & Mythology' | 'Sports' | 'Objects & Brands' | 'Words';
export const CATEGORIES: Category[] = ['Food & Drink', 'Animals & Nature', 'Geography', 'Pop Culture', 'Science & Body', 'History & Mythology', 'Sports', 'Objects & Brands', 'Words'];
export type Difficulty = 'everyday' | 'medium' | 'niche';

export interface Prompt {
  id: string;
  prompt: string;
  category: Category | string;
  difficulty?: Difficulty;
  /** words dropped before comparing, e.g. ["cheese"] so "gouda cheese" == "gouda" */
  ignoreWords?: string[];
  answers: Answer[];
}

export type MatchResult =
  | { kind: 'exact'; answer: Answer }
  | { kind: 'near'; answer: Answer }
  | { kind: 'none' };

const SPECIAL: Record<string, string> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

/** lowercase, strip accents & punctuation, collapse spaces, drop leading "the" and ignore-words */
export function normalize(s: string, ignoreWords: string[] = []): string {
  let t = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/[øæœßłđðþı]/g, (c) => SPECIAL[c] ?? c);
  t = t.replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  t = t.replace(/^the /, '');
  let words = t.split(' ').filter(Boolean).map(singular);
  if (ignoreWords.length) {
    const ign = ignoreWords.map((w) => singular(w.toLowerCase()));
    const kept = words.filter((w) => !ign.includes(w));
    if (kept.length) words = kept;
  }
  return words.join(' ');
}

/** crude, symmetric singularizer — applied to both input and answers, so it only needs to be consistent */
function singular(w: string): string {
  if (w.length <= 3 || w.endsWith('ss')) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (/(ch|sh|x|z|o)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

const compact = (s: string) => s.replace(/ /g, '');

export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

interface Form { answer: Answer; norm: string; tokens: string[] }

function formsFor(p: Prompt): Form[] {
  const out: Form[] = [];
  for (const a of p.answers) {
    for (const raw of [a.text, ...(a.aliases ?? [])]) {
      const norm = normalize(raw, p.ignoreWords);
      if (norm) out.push({ answer: a, norm, tokens: norm.split(' ') });
    }
  }
  return out;
}

/** index of `needle` as a contiguous token run inside `hay`, or -1 */
function tokenIndex(hay: string[], needle: string[]): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export function matchAnswer(input: string, p: Prompt): MatchResult {
  const q = normalize(input, p.ignoreWords);
  if (!q) return { kind: 'none' };
  const forms = formsFor(p);

  // 1. exact (also tolerant of spacing: "blue cheese" == "bluecheese")
  const exact = forms.find((f) => f.norm === q || compact(f.norm) === compact(q));
  if (exact) return { kind: 'exact', answer: exact.answer };

  // 2. input contains a valid answer plus extra words ("aged gouda")
  const qTokens = q.split(' ');
  if (qTokens.length > 1) {
    const hits = forms
      .map((f) => ({ f, at: tokenIndex(qTokens, f.tokens) }))
      .filter((h) => h.at >= 0 && h.f.norm.length >= 3)
      .sort((a, b) => b.f.tokens.length - a.f.tokens.length || b.f.norm.length - a.f.norm.length);
    if (hits.length) {
      const best = hits[0];
      const end = best.at + best.f.tokens.length;
      // any *different* answer found outside the best span → ambiguous ("cheddar brie")
      const conflict = hits.some(
        (h) => h.f.answer !== best.f.answer && (h.at < best.at || h.at + h.f.tokens.length > end),
      );
      if (!conflict) return { kind: 'near', answer: best.f.answer };
      return { kind: 'none' };
    }
  }

  // 3. typo tolerance: ≤1 edit for answers of ≤5 chars, ≤2 for longer
  if (q.length < 3) return { kind: 'none' };
  const best = new Map<Answer, number>();
  for (const f of forms) {
    const limit = f.norm.length <= 5 ? 1 : 2;
    const d = Math.min(levenshtein(q, f.norm, limit), levenshtein(compact(q), compact(f.norm), limit));
    if (d <= limit && d < (best.get(f.answer) ?? Infinity)) best.set(f.answer, d);
  }
  if (best.size === 0) return { kind: 'none' };
  const ranked = [...best.entries()].sort((a, b) => a[1] - b[1]);
  // never guess between two different valid answers at the same distance
  if (ranked.length > 1 && ranked[1][1] === ranked[0][1]) return { kind: 'none' };
  return { kind: 'near', answer: ranked[0][0] };
}
