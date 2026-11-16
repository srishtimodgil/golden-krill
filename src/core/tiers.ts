// Pure game data — no DOM. Reusable by a future PWA / Expo app.

export type TierName = 'Plankton' | 'Too Clever' | 'Schooler' | 'Rare' | 'Deep Cut' | 'Golden Krill';

export interface Tier {
  name: TierName;
  points: number;
  /** metres the answer sinks (= points × 10) */
  depth: number;
  color: string;
  glow: string;
  flavor: string;
  emoji: string;
}

export const TIERS: Tier[] = [
  { name: 'Plankton',     points: 10,  depth: 100,  color: '#A9C2CF', glow: 'rgba(169,194,207,.55)', emoji: '🫧', flavor: 'The first thing everyone thinks of. It still counts.' },
  { name: 'Too Clever',   points: 15,  depth: 150,  color: '#FFB347', glow: 'rgba(255,179,71,.55)',  emoji: '🦀', flavor: 'Technically correct. The judges are squinting.' },
  { name: 'Schooler',     points: 30,  depth: 300,  color: '#7CFFB2', glow: 'rgba(124,255,178,.55)', emoji: '🐟', flavor: 'A sturdy pick. Plenty of company down here.' },
  { name: 'Rare',         points: 60,  depth: 600,  color: '#FF6B5A', glow: 'rgba(255,107,90,.6)',   emoji: '🦑', flavor: 'Off the main current. Nicely found.' },
  { name: 'Deep Cut',     points: 85,  depth: 850,  color: '#B48CFF', glow: 'rgba(180,140,255,.6)',  emoji: '🐡', flavor: 'Very few divers ever reach this answer.' },
  { name: 'Golden Krill', points: 100, depth: 1000, color: '#FFD24A', glow: 'rgba(255,210,74,.75)',  emoji: '✨', flavor: 'Shimmering, nearly mythical. A legendary find.' },
];

export const TIER_BY_NAME: Record<TierName, Tier> = Object.fromEntries(
  TIERS.map((t) => [t.name, t]),
) as Record<TierName, Tier>;

export const PROMPTS_PER_DIVE = 7;
export const SECONDS_PER_PROMPT = 25;
export const MAX_SCORE = 700;
export const depthForScore = (score: number) => score * 10;
