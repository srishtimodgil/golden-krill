import { TIER_BY_NAME, MAX_SCORE } from '../core/tiers';
import type { DiveSession } from '../core/dive';
import { recapHTML } from './recap';
import { BEARINGS, bearingFor, betterThan, scoreCurve, MIN_DIVES_FOR_CURVE } from '../core/stats';
import { creatureSVG, krillLogoSVG } from './icons';

export interface EndData {
  session: DiveSession;
  pastScores: number[]; // first-time dives, excluding this one
}

export function endScreenHTML({ session, pastScores }: EndData): string {
  const score = session.score;
  const bearing = bearingFor(score);
  const unlocked = pastScores.length >= MIN_DIVES_FOR_CURVE;
  const pct = betterThan(score, pastScores);

  return `
  <div class="end-inner">
    <div class="end-head">
      ${krillLogoSVG(3)}
      <div class="end-logo">GOLDEN KRILL</div>
    </div>
    <div class="end-title">DIVE #${session.dive} COMPLETE${session.replay ? ' · <span class="replay-tag">REPLAY · NOT COUNTED</span>' : ''}</div>

    <div class="big-score"><span class="num" id="end-score">0</span><span class="of">/${MAX_SCORE}</span></div>
    <div class="big-depth">-${session.depth.toLocaleString('en-US')}m</div>

    <section class="card">
      <div class="card-label">SCORE CURVE</div>
      ${curveSVG(score, pastScores)}
      <div class="compare">${
        unlocked
          ? `BETTER THAN <b>${pct}%</b> OF YOUR PAST DIVES`
          : `keep diving to unlock your curve · ${pastScores.length}/${MIN_DIVES_FOR_CURVE} dives`
      }</div>
    </section>

    <section class="card">
      <div class="card-label">DIVE LOG</div>
      ${diveLogChart(session)}
    </section>

    <section class="card">
      <div class="card-label">THE BEARING</div>
      <div class="bearings">
        ${[...BEARINGS].reverse().map((b) => `
          <div class="bearing ${b === bearing ? 'me' : ''}" style="--tc:${TIER_BY_NAME[b.name].color}">
            <div class="b-icon">${creatureSVG(b.name, 3)}</div>
            <div class="b-text">
              <div class="b-name">${b.name.toUpperCase()} <span>${b.min}${b.max >= MAX_SCORE ? '+' : '–' + b.max}</span></div>
              <div class="b-flavor">${b.flavor}</div>
            </div>
          </div>`).join('')}
      </div>
    </section>

    <button class="btn primary big-ish" id="copy">COPY RESULT</button>

    <section class="card">
      <div class="card-label">RECAP · tap a prompt to reveal every answer</div>
      ${recapHTML(session.prompts, session.results)}
    </section>

    <div class="end-actions">
      <button class="btn primary big" id="next-dive">NEXT DIVE ▼</button>
      <button class="btn ghost" id="end-log">DIVE LOG</button>
    </div>
  </div>`;
}

function curveSVG(score: number, past: number[]): string {
  const W = 320, H = 120, pad = 10;
  const pts = scoreCurve(past).map((p) => [pad + (p.x / MAX_SCORE) * (W - pad * 2), H - 22 - p.y * (H - 40)] as const);
  // Catmull-Rom → cubic Bézier for a smooth bell
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  const base = H - 22;
  const area = `${d} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`;
  const x = pad + (Math.min(score, MAX_SCORE) / MAX_SCORE) * (W - pad * 2);
  return `
  <svg class="curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="Score distribution with your score marked">
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CFFB2" stop-opacity=".35"/><stop offset="1" stop-color="#7CFFB2" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#cg)"/>
    <path d="${d}" fill="none" stroke="#7CFFB2" stroke-width="1.5"/>
    <line x1="${pad}" x2="${W - pad}" y1="${base}" y2="${base}" stroke="#24503f"/>
    ${[0, 350, 700].map((v) => `<text x="${pad + (v / MAX_SCORE) * (W - pad * 2)}" y="${H - 6}" text-anchor="middle">${v}</text>`).join('')}
    <line class="you-line" x1="${x}" x2="${x}" y1="12" y2="${base}" stroke="#FF6B5A" stroke-width="2" stroke-dasharray="3 3"/>
    <rect x="${x - 17}" y="0" width="34" height="13" rx="2" fill="#FF6B5A"/>
    <text x="${x}" y="10" text-anchor="middle" class="you-text">YOU</text>
  </svg>`;
}

function diveLogChart(s: DiveSession): string {
  return `
  <div class="divelog">
    <div class="dl-scale"><span>0m</span><span>500m</span><span>1000m</span></div>
    <div class="dl-cols">
      ${s.prompts.map((_, i) => {
        const r = s.results[i];
        const t = r?.tier ? TIER_BY_NAME[r.tier] : null;
        const frac = t ? t.depth / 1000 : 0;
        return `<div class="dl-col" style="--tc:${t ? t.color : '#5F7A70'};--f:${frac}">
          ${t ? `<div class="dl-line"></div><div class="dl-icon">${creatureSVG(t.name, 2)}</div>` : '<div class="dl-none">—</div>'}
          <div class="dl-n">${i + 1}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
