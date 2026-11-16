// Dive records, progress and the ScoreStore abstraction. No DOM; storage is injected.
import type { TierName } from './tiers';

export interface PromptResult {
  promptId: string;
  /** canonical answer text, or null on timeout */
  answer: string | null;
  tier: TierName | null;
  points: number;
}

export interface DiveRecord {
  dive: number;
  score: number;
  depth: number;
  results: PromptResult[];
  playedAt: string;   // ISO
  replay: boolean;    // replays never count toward stats
}

/** Minimal key/value storage so the core works with localStorage, AsyncStorage (Expo), or tests. */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Where scores live. v1 = LocalScoreStore. v1.5 can add a SupabaseScoreStore
 * implementing the same interface (plus friend lookups) without touching the UI.
 */
export interface ScoreStore {
  save(record: DiveRecord): Promise<void>;
  /** all of this player's first-time (non-replay) dives */
  personal(): Promise<DiveRecord[]>;
  /** other players' scores for one dive; local store returns [] */
  friendsOnDive(dive: number): Promise<{ player: string; score: number }[]>;
}

const K = { history: 'gk.history', next: 'gk.nextDive', live: 'gk.liveDive' };

export class LocalScoreStore implements ScoreStore {
  constructor(private kv: KV) {}
  private all(): DiveRecord[] {
    try { return JSON.parse(this.kv.getItem(K.history) ?? '[]'); } catch { return []; }
  }
  async save(record: DiveRecord) {
    if (record.replay) return;
    const list = this.all().filter((r) => r.dive !== record.dive);
    list.push(record);
    this.kv.setItem(K.history, JSON.stringify(list));
  }
  async personal() { return this.all(); }
  async friendsOnDive() { return []; }
}

/** Which dive the player plays next, plus resumable in-progress state. */
export class Progress {
  constructor(private kv: KV) {}
  get nextDive(): number { return Math.max(1, Number(this.kv.getItem(K.next) ?? 1) || 1); }
  set nextDive(n: number) { this.kv.setItem(K.next, String(n)); }

  saveLive(state: LiveDive | null) {
    if (state) this.kv.setItem(K.live, JSON.stringify(state));
    else this.kv.removeItem(K.live);
  }
  loadLive(): LiveDive | null {
    try { return JSON.parse(this.kv.getItem(K.live) ?? 'null'); } catch { return null; }
  }
  reset() { [K.history, K.next, K.live].forEach((k) => this.kv.removeItem(k)); }
}

/** A dive in progress (only first-time dives are persisted, so refreshing can't re-roll a prompt). */
export interface LiveDive { dive: number; results: PromptResult[] }
