import { TIER_BY_NAME, MAX_SCORE } from '../core/tiers';
import type { DiveRecord } from '../core/history';
import type { Prompt } from '../core/matching';
import { recapHTML } from './recap';

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function logScreenHTML(records: DiveRecord[], nextDive: number, totalDives: number): string {
  const sorted = [...records].sort((a, b) => b.dive - a.dive);
  const scores = records.map((r) => r.score);
  const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores) : 0;

  return `
  <div class="end-inner">
    <div class="log-head">
      <button class="btn ghost small" id="log-back">◀ BACK</button>
      <div class="end-title">DIVE LOG</div>
      <span></span>
    </div>
    <div class="log-stats">
      <div><b>${records.length}</b><span>DIVES</span></div>
      <div><b>${avg}</b><span>AVERAGE</span></div>
      <div><b>${best}</b><span>BEST</span></div>
    </div>
    <div class="log-note">next dive: <b>#${nextDive}</b> of ${totalDives} · tap a dive to see every answer · replays never change your stats</div>
    ${sorted.length ? '' : '<div class="log-empty">No dives yet. Your first descent awaits.</div>'}
    <div class="log-list">
      ${sorted.map((r) => `
        <div class="log-row">
          <button class="log-open" data-open="${r.dive}" aria-label="Open dive ${r.dive} recap">
            <span class="l-num">#${r.dive}</span>
            <span class="l-mid">
              <span class="l-emoji">${r.results.map((x) => (x.tier ? TIER_BY_NAME[x.tier].emoji : '⬛')).join('')}</span>
              <span class="l-meta">${fmt(r.playedAt)} · -${r.depth.toLocaleString('en-US')}m</span>
            </span>
            <span class="l-score">${r.score}<span>/${MAX_SCORE}</span></span>
          </button>
          <button class="btn ghost small" data-replay="${r.dive}" aria-label="Replay dive ${r.dive}">↻</button>
        </div>`).join('')}
    </div>
  </div>`;
}

/** A finished dive from the log, with the same recap + full reveals as the end screen. */
export function logDetailHTML(r: DiveRecord, prompts: Prompt[]): string {
  return `
  <div class="end-inner">
    <div class="log-head">
      <button class="btn ghost small" id="detail-back">◀ LOG</button>
      <div class="end-title">DIVE #${r.dive}</div>
      <button class="btn ghost small" data-replay="${r.dive}">↻ REPLAY</button>
    </div>
    <div class="big-score compact"><span class="num">${r.score}</span><span class="of">/${MAX_SCORE}</span></div>
    <div class="big-depth">-${r.depth.toLocaleString('en-US')}m · ${fmt(r.playedAt)}</div>
    <section class="card">
      <div class="card-label">RECAP · tap a prompt to reveal every answer</div>
      ${recapHTML(prompts, r.results)}
    </section>
  </div>`;
}
