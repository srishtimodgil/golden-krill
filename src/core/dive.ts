// Dive session: bank lookup, per-prompt flow, scoring. No DOM.
import { matchAnswer, normalize, type Answer, type Prompt, type MatchResult } from './matching';
import { TIER_BY_NAME, TIERS, PROMPTS_PER_DIVE, depthForScore, type TierName } from './tiers';
import type { PromptResult } from './history';

export interface Bank {
  prompts: Record<string, Prompt>;
  /** dive number (1-based) → 7 prompt ids */
  dives: Record<string, string[]>;
}

export const diveCount = (bank: Bank) => Object.keys(bank.dives).length;

export function promptsForDive(bank: Bank, dive: number): Prompt[] {
  const ids = bank.dives[String(dive)];
  if (!ids) throw new Error(`Dive #${dive} does not exist`);
  return ids.map((id) => {
    const p = bank.prompts[id];
    if (!p) throw new Error(`Dive #${dive} references unknown prompt "${id}"`);
    return p;
  });
}

export type SubmitOutcome =
  | { kind: 'accepted'; answer: Answer; result: PromptResult }
  | { kind: 'confirm'; suggestion: Answer }
  | { kind: 'rejected' };

export class DiveSession {
  readonly prompts: Prompt[];
  results: PromptResult[] = [];
  private pending: Answer | null = null;

  constructor(readonly dive: number, bank: Bank, readonly replay = false, resumed: PromptResult[] = []) {
    this.prompts = promptsForDive(bank, dive);
    this.results = resumed.slice(0, PROMPTS_PER_DIVE);
  }

  get index() { return this.results.length; }
  get current(): Prompt | null { return this.prompts[this.index] ?? null; }
  get done() { return this.results.length >= this.prompts.length; }
  get score() { return this.results.reduce((s, r) => s + r.points, 0); }
  get depth() { return depthForScore(this.score); }

  /** Submit typed text for the current prompt. Near-matches need a second submit of the suggested text. */
  submit(raw: string): SubmitOutcome {
    const p = this.current;
    if (!p) return { kind: 'rejected' };
    if (this.pending && normalize(raw, p.ignoreWords) === normalize(this.pending.text, p.ignoreWords)) {
      const a = this.pending;
      return this.accept(a);
    }
    const m: MatchResult = matchAnswer(raw, p);
    if (m.kind === 'exact') return this.accept(m.answer);
    if (m.kind === 'near') { this.pending = m.answer; return { kind: 'confirm', suggestion: m.answer }; }
    this.pending = null;
    return { kind: 'rejected' };
  }

  timeout(): PromptResult {
    const p = this.current!;
    const r: PromptResult = { promptId: p.id, answer: null, tier: null, points: 0 };
    this.results.push(r);
    this.pending = null;
    return r;
  }

  private accept(a: Answer): SubmitOutcome {
    const p = this.current!;
    const t = TIER_BY_NAME[a.tier];
    const result: PromptResult = { promptId: p.id, answer: a.text, tier: a.tier, points: t.points };
    this.results.push(result);
    this.pending = null;
    return { kind: 'accepted', answer: a, result };
  }
}

const RANK: Record<TierName, number> = Object.fromEntries(TIERS.map((t, i) => [t.name, i])) as Record<TierName, number>;

/** The rarest answers the player could have given (Too Clever excluded). */
export function rarestAnswers(p: Prompt, n = 3, exclude?: string | null): Answer[] {
  return p.answers
    .filter((a) => a.tier !== 'Too Clever' && a.text !== exclude)
    .sort((a, b) => RANK[b.tier] - RANK[a.tier])
    .slice(0, n);
}
