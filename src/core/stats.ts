// End-of-dive maths: percentile, score curve, bearing bands, share text. No DOM.
import { TIER_BY_NAME, MAX_SCORE, type TierName } from './tiers';
import type { DiveRecord, PromptResult } from './history';

export const MIN_DIVES_FOR_CURVE = 5;

/** % of past dives this score beats (ties count half). */
export function betterThan(score: number, past: number[]): number {
  if (!past.length) return 0;
  const beat = past.reduce((n, s) => n + (s < score ? 1 : s === score ? 0.5 : 0), 0);
  return Math.round((beat / past.length) * 100);
}

/** Smooth curve (gaussian KDE) over 0..MAX_SCORE, normalised to peak 1. */
export function scoreCurve(scores: number[], points = 71): { x: number; y: number }[] {
  const data = scores.length >= MIN_DIVES_FOR_CURVE ? scores : null;
  const mean = 270, sd = 105; // default curve before the player has history
  const bw = data ? Math.max(28, 1.06 * stdev(data) * Math.pow(data.length, -0.2)) : 0;
  const out = [];
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * MAX_SCORE;
    const y = data
      ? data.reduce((s, v) => s + Math.exp(-0.5 * ((x - v) / bw) ** 2), 0)
      : Math.exp(-0.5 * ((x - mean) / sd) ** 2);
    out.push({ x, y });
  }
  const peak = Math.max(...out.map((p) => p.y)) || 1;
  return out.map((p) => ({ x: p.x, y: p.y / peak }));
}

function stdev(a: number[]) {
  const m = a.reduce((s, v) => s + v, 0) / a.length;
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length) || 60;
}

export interface Bearing { name: TierName; min: number; max: number; flavor: string }
export const BEARINGS: Bearing[] = [
  { name: 'Plankton', min: 0, max: 150, flavor: 'Drifting near the surface. The deep is still waiting.' },
  { name: 'Schooler', min: 151, max: 250, flavor: 'A steady dive. You held your own with the crowd.' },
  { name: 'Rare', min: 251, max: 350, flavor: 'Well past the sunlight. Your instincts run deep.' },
  { name: 'Deep Cut', min: 351, max: 449, flavor: 'Down where few divers go. Seriously good pulls.' },
  { name: 'Golden Krill', min: 450, max: MAX_SCORE, flavor: 'Legendary. They will tell stories about this dive.' },
];
export const bearingFor = (score: number) => BEARINGS.find((b) => score >= b.min && score <= b.max) ?? BEARINGS[0];

export function shareText(dive: number, score: number, results: PromptResult[], url?: string): string {
  const icons = results.map((r) => (r.tier ? TIER_BY_NAME[r.tier].emoji : '⬛')).join('');
  return [
    `GOLDEN KRILL · DIVE #${dive}`,
    `${score}/${MAX_SCORE} · ⬇ ${(score * 10).toLocaleString('en-US')}m · ${bearingFor(score).name}`,
    icons,
    url ?? '',
  ].filter(Boolean).join('\n');
}

export const firstTimeScores = (records: DiveRecord[], excludeDive?: number) =>
  records.filter((r) => !r.replay && r.dive !== excludeDive).map((r) => r.score);
