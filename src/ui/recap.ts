// Post-dive recap with full answer reveals. Used by the end screen and the dive log.
// Only ever rendered for COMPLETED dives (first-time or replay).
import { TIER_BY_NAME, type TierName } from '../core/tiers';
import { matchAnswer, normalize, type Prompt, type Answer } from '../core/matching';
import type { PromptResult } from '../core/history';
import { creatureSVG } from './icons';
import { esc, copyText } from './util';

/** rarest first; Too Clever sits below Schooler because it's a loophole, not a rarity */
export const REVEAL_ORDER: TierName[] = ['Golden Krill', 'Deep Cut', 'Rare', 'Schooler', 'Too Clever', 'Plankton'];
const OPEN_TIERS = 3; // Golden Krill, Deep Cut, Rare are shown straight away

const byText = (a: Answer, b: Answer) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });

export function rarestFirst(p: Prompt): Answer[] {
  return REVEAL_ORDER.flatMap((t) => p.answers.filter((a) => a.tier === t).sort(byText));
}

export function recapHTML(prompts: Prompt[], results: PromptResult[]): string {
  return `
  <div class="recap">
    ${prompts.map((p, i) => rowHTML(p, results[i], i)).join('')}
  </div>
  <button class="btn ghost reveal-all" data-reveal-all aria-pressed="false">REVEAL ALL ANSWERS ▼</button>`;
}

function rowHTML(p: Prompt, r: PromptResult | undefined, i: number): string {
  const t = r?.tier ? TIER_BY_NAME[r.tier] : null;
  return `
  <div class="recap-row" data-row="${i}" style="--tc:${t ? t.color : '#5F7A70'}">
    <button class="recap-head" aria-expanded="false" aria-controls="reveal-${i}">
      <div class="r-top">
        <span class="r-prompt">${esc(p.prompt.toUpperCase())}</span>
        <span class="r-pts">${t ? `+${t.points}` : '—'}</span>
      </div>
      <div class="r-mid">
        <span class="r-icon">${creatureSVG(r?.tier ?? 'Timeout', 2)}</span>
        <span class="r-answer">${r?.answer ? esc(r.answer) : '<i>no answer</i>'}</span>
        <span class="r-tier">${t ? t.name : ''}</span>
        <span class="r-caret" aria-hidden="true">▼</span>
      </div>
    </button>
    <div class="reveal-wrap" id="reveal-${i}" inert>
      <div class="reveal">${revealHTML(p, r, i)}</div>
    </div>
  </div>`;
}

function revealHTML(p: Prompt, r: PromptResult | undefined, i: number): string {
  const total = p.answers.length;
  const mine = r?.answer ?? null;
  const groups = REVEAL_ORDER.map((tier, gi) => {
    const list = p.answers.filter((a) => a.tier === tier).sort(byText);
    if (!list.length) return '';
    const T = TIER_BY_NAME[tier];
    return `
    <section class="rv-group ${gi >= OPEN_TIERS ? 'rv-low' : ''} ${tier === 'Golden Krill' ? 'rv-gk' : ''}" style="--tc:${T.color};--tg:${T.glow}">
      <header class="rv-head">
        <span class="rv-icon">${creatureSVG(tier, 2)}</span>
        <b>${tier.toUpperCase()} · ${T.points}</b>
        <span class="rv-count">${list.length} answer${list.length === 1 ? '' : 's'}</span>
      </header>
      <div class="chips">
        ${list.map((a) => {
          const you = a.text === mine;
          const keys = [a.text, ...(a.aliases ?? [])].map((f) => normalize(f, p.ignoreWords)).join('|');
          return `<span class="chip${you ? ' you' : ''}" data-k="${esc(keys)}">${esc(a.text)}${you ? '<i>YOU</i>' : ''}</span>`;
        }).join('')}
      </div>
    </section>`;
  }).join('');
  const lowCount = p.answers.filter((a) => REVEAL_ORDER.indexOf(a.tier) >= OPEN_TIERS).length;

  return `
    <div class="rv-top">
      <div class="rv-summary">
        ${mine ? '' : '<div class="rv-you-none">you: —</div>'}
        You found <b>${mine ? 1 : 0}</b> of <b>${total}</b> answers
      </div>
      <button class="rv-copy" data-copy="${i}" aria-label="Copy the prompt and its 5 rarest answers">⧉ COPY</button>
    </div>
    <label class="rv-search">
      <span class="sr-only">Check an answer</span>
      <input type="search" data-search="${i}" placeholder="would ___ have counted?" autocomplete="off" autocapitalize="off" spellcheck="false" />
    </label>
    <div class="rv-check" aria-live="polite"></div>
    <div class="rv-groups rv-collapsed">${groups}</div>
    ${lowCount ? `<button class="rv-more" data-more aria-expanded="false">show more ▼ <span>Schooler · Too Clever · Plankton (${lowCount})</span></button>` : ''}`;
}

export function revealShareText(p: Prompt, dive: number): string {
  const top = rarestFirst(p).filter((a) => a.tier !== 'Too Clever').slice(0, 5);
  return [
    `GOLDEN KRILL · DIVE #${dive}`,
    `"${p.prompt}": the 5 rarest answers`,
    ...top.map((a) => `${TIER_BY_NAME[a.tier].emoji} ${a.text} (${a.tier})`),
  ].join('\n');
}

/** Wire up expand / reveal-all / show-more / search / copy for a recap inside `root`. */
export function bindRecap(root: HTMLElement, prompts: Prompt[], dive: number) {
  const rows = [...root.querySelectorAll<HTMLElement>('.recap-row')];
  const allBtn = root.querySelector<HTMLButtonElement>('[data-reveal-all]');

  const setOpen = (row: HTMLElement, open: boolean) => {
    row.classList.toggle('open', open);
    row.querySelector('.recap-head')!.setAttribute('aria-expanded', String(open));
    const wrap = row.querySelector<HTMLElement>('.reveal-wrap')!;
    if (open) wrap.removeAttribute('inert'); else wrap.setAttribute('inert', '');
  };
  const syncAll = () => {
    if (!allBtn) return;
    const allOpen = rows.every((r) => r.classList.contains('open'));
    allBtn.textContent = allOpen ? 'HIDE ALL ANSWERS ▲' : 'REVEAL ALL ANSWERS ▼';
    allBtn.setAttribute('aria-pressed', String(allOpen));
  };

  root.addEventListener('click', async (e) => {
    const el = e.target as HTMLElement;
    const head = el.closest<HTMLElement>('.recap-head');
    if (head) { const row = head.closest<HTMLElement>('.recap-row')!; setOpen(row, !row.classList.contains('open')); syncAll(); return; }

    if (el.closest('[data-reveal-all]')) {
      const open = !rows.every((r) => r.classList.contains('open'));
      rows.forEach((r) => setOpen(r, open));
      syncAll();
      return;
    }

    const more = el.closest<HTMLElement>('[data-more]');
    if (more) {
      const groups = more.parentElement!.querySelector('.rv-groups')!;
      const expanded = groups.classList.toggle('rv-collapsed') === false;
      more.setAttribute('aria-expanded', String(expanded));
      more.firstChild!.textContent = expanded ? 'show less ▲ ' : 'show more ▼ ';
      return;
    }

    const copy = el.closest<HTMLElement>('[data-copy]');
    if (copy) {
      const p = prompts[Number(copy.dataset.copy)];
      const ok = await copyText(revealShareText(p, dive));
      copy.textContent = ok ? '✓ COPIED' : 'COPY FAILED';
      setTimeout(() => (copy.textContent = '⧉ COPY'), 1600);
    }
  });

  root.addEventListener('input', (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-search]');
    if (!input) return;
    const reveal = input.closest<HTMLElement>('.reveal')!;
    const p = prompts[Number(input.dataset.search)];
    const raw = input.value.trim();
    const q = normalize(raw, p.ignoreWords);
    const groupsEl = reveal.querySelector<HTMLElement>('.rv-groups')!;
    const moreBtn = reveal.querySelector<HTMLElement>('[data-more]');

    // filtering searches every tier, including collapsed ones
    groupsEl.classList.toggle('rv-searching', !!q);
    if (moreBtn) moreBtn.hidden = !!q;
    reveal.querySelectorAll<HTMLElement>('.rv-group').forEach((g) => {
      let any = false;
      g.querySelectorAll<HTMLElement>('.chip').forEach((c) => {
        const hit = !q || c.dataset.k!.split('|').some((k) => k.includes(q));
        c.hidden = !hit;
        any ||= hit;
      });
      g.hidden = !any;
    });

    // "would X have counted?" uses the real game matcher
    const check = reveal.querySelector<HTMLElement>('.rv-check')!;
    if (!raw) { check.innerHTML = ''; check.className = 'rv-check'; return; }
    const m = matchAnswer(raw, p);
    if (m.kind === 'exact') {
      const T = TIER_BY_NAME[m.answer.tier];
      check.className = 'rv-check ok';
      check.innerHTML = `✓ counts as <b style="color:${T.color}">${esc(m.answer.text)}</b> · ${T.name} · ${T.points} pts`;
    } else if (m.kind === 'near') {
      const T = TIER_BY_NAME[m.answer.tier];
      check.className = 'rv-check near';
      check.innerHTML = `≈ close to <b style="color:${T.color}">${esc(m.answer.text)}</b> (${T.name}). The game would ask you to confirm`;
    } else {
      check.className = 'rv-check no';
      check.innerHTML = `✖ "${esc(raw)}": no echo, wouldn't have counted`;
    }
  });
}
