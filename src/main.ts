import './styles.css';
import { Scene } from './ui/scene';
import type { Answer, Prompt } from './core/matching';
import { TIERS, TIER_BY_NAME, SECONDS_PER_PROMPT, PROMPTS_PER_DIVE, type Tier } from './core/tiers';
import { DiveSession, diveCount, type Bank } from './core/dive';
import { LocalScoreStore, Progress, type DiveRecord, type ScoreStore } from './core/history';
import { firstTimeScores, shareText } from './core/stats';
import { creatureSVG, krillLogoSVG, ICON } from './ui/icons';
import { endScreenHTML } from './ui/endScreen';
import { logScreenHTML, logDetailHTML } from './ui/logScreen';
import { bindRecap } from './ui/recap';
import { esc, copyText } from './ui/util';
import { sound } from './ui/audio';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// ---------- motion preference ----------
const motionMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = () => motionMQ.matches || localStorage.getItem('gk.reduceMotion') === 'on';
const applyMotion = () => document.documentElement.classList.toggle('reduce-motion', reduceMotion());
applyMotion();
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduceMotion() ? Math.min(ms, 150) : ms));

// ---------- storage ----------
const progress = new Progress(localStorage);
const store: ScoreStore = new LocalScoreStore(localStorage);

// ---------- DOM ----------
$('#app').innerHTML = `
  <canvas id="scene"></canvas>
  <canvas id="overlay"></canvas>
  <div class="bezel" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="scan" aria-hidden="true"></div>

  <header class="topbar">
    <button class="icon-btn" id="menu" aria-label="Menu">${ICON.menu}</button>
    <div class="spacer"></div>
    <button class="icon-btn" id="sound" aria-label="Toggle sound"></button>
    <button class="icon-btn" id="settings" aria-label="Settings">${ICON.gear}</button>
  </header>

  <section id="start" class="screen">
    <div class="logo-wrap">
      ${krillLogoSVG(6)}
      <h1 class="logo" data-text="GOLDEN KRILL">GOLDEN KRILL</h1>
      <div class="subtitle">A RARITY DIVE</div>
    </div>
    <p class="tagline">7 prompts · 25 seconds each · rarer answers sink deeper</p>
    <button id="begin" class="btn primary big" disabled>LOADING…</button>
    <div class="dive-no" id="dive-no"></div>
    <button class="link" id="open-log">open dive log →</button>
  </section>

  <div id="hud" class="hud hidden">
    <div class="hud-box"><span class="hud-label">DEPTH</span><span id="hud-depth" class="hud-depth">0m</span></div>
    <div class="hud-mid">
      <div class="squares">${Array.from({ length: PROMPTS_PER_DIVE }, () => '<i></i>').join('')}</div>
      <div id="hud-prompt" class="hud-label">PROMPT 1 OF 7</div>
    </div>
    <div class="hud-box right"><span class="hud-label">SCORE</span><span id="hud-score" class="hud-score">0</span></div>
  </div>

  <section id="prompt" class="panel prompt-panel hidden">
    <div class="eyebrow" id="prompt-eyebrow"></div>
    <h2 id="prompt-text"></h2>
    <div class="hint">▼ rarer answers sink deeper ▼</div>
  </section>

  <div id="pill" class="pill hidden">descending · the clock starts in <b id="pill-n">3</b></div>
  <div id="tag" class="tag hidden"><span id="tag-text"></span></div>
  <section id="result" class="panel result hidden" aria-live="polite"></section>

  <form id="bar" class="inputbar hidden" autocomplete="off">
    <div id="msg" class="msg" aria-live="polite"></div>
    <div class="bar-row">
      <div class="ring">
        <svg viewBox="0 0 48 48"><circle class="ring-bg" cx="24" cy="24" r="20"/><circle id="ring-fg" class="ring-fg" cx="24" cy="24" r="20"/></svg>
        <span id="ring-n">25</span>
      </div>
      <input id="answer" type="text" placeholder="type one answer…" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="60" aria-label="Your answer" />
      <button class="btn primary" id="dive" type="submit">DIVE</button>
    </div>
    <div class="drain"><i id="drain"></i></div>
  </form>

  <section id="end" class="sheet hidden"></section>
  <section id="log" class="sheet hidden"></section>

  <div id="drawer" class="drawer hidden">
    <nav class="panel drawer-panel">
      <div class="card-label">GOLDEN KRILL</div>
      <button class="drawer-item" data-go="how">How to play</button>
      <button class="drawer-item" data-go="log">Dive log</button>
      <button class="drawer-item" data-go="settings">Settings</button>
      <button class="drawer-item" data-go="close">Close</button>
    </nav>
  </div>

  <div id="modal" class="modal hidden"><div class="panel modal-panel" id="modal-body"></div></div>
`;

const scene = new Scene($('#scene') as HTMLCanvasElement, $('#overlay') as HTMLCanvasElement);
scene.reduced = reduceMotion();

// ---------- bank ----------
let bank: Bank;
async function loadBank(): Promise<Bank> {
  const base = import.meta.env.BASE_URL;
  const [q, d] = await Promise.all([
    fetch(`${base}data/questions.json`).then((r) => r.json() as Promise<Prompt[]>),
    fetch(`${base}data/dives.json`).then((r) => r.json() as Promise<Record<string, string[]>>),
  ]);
  return { prompts: Object.fromEntries(q.map((p) => [p.id, p])), dives: d };
}

// ---------- top bar, drawer, modals ----------
const soundBtn = $('#sound');
const paintSound = () => (soundBtn.innerHTML = sound.enabled ? ICON.soundOn : ICON.soundOff);
paintSound();
soundBtn.onclick = () => { sound.toggle(); paintSound(); sound.ping(); };
$('#menu').onclick = () => show('#drawer');
$('#settings').onclick = () => openSettings();
$('#drawer').onclick = (e) => {
  const go = (e.target as HTMLElement).closest<HTMLElement>('[data-go]')?.dataset.go;
  if (e.target === $('#drawer') || go) show('#drawer', false);
  if (go === 'how') openHow();
  if (go === 'log') void openLog();
  if (go === 'settings') openSettings();
};
$('#modal').onclick = (e) => { if (e.target === $('#modal')) show('#modal', false); };

function modal(html: string) {
  $('#modal-body').innerHTML = html + '<div class="row"><button class="btn ghost" id="modal-close">CLOSE</button></div>';
  show('#modal');
  $('#modal-close').onclick = () => show('#modal', false);
}

function openHow() {
  modal(`
    <div class="card-label">HOW TO PLAY</div>
    <p>Each dive has <b>7 prompts</b> like “Name a type of cheese”. You get <b>25 seconds</b> and <b>one answer</b> each.</p>
    <p>Common answers barely sink. Rare ones plunge. Your score × 10 is your depth in metres.</p>
    <div class="how-tiers">${TIERS.map((t) => `<div style="--tc:${t.color}">${creatureSVG(t.name, 2)}<b>${t.name}</b><span>${t.points} pts</span></div>`).join('')}</div>
    <p class="muted">Too Clever = technically right, but a loophole. Every prompt hides exactly one Golden Krill.</p>`);
}

function openSettings() {
  modal(`
    <div class="card-label">SETTINGS</div>
    <label class="toggle"><input type="checkbox" id="set-sound" ${sound.enabled ? 'checked' : ''}/> Sound effects</label>
    <label class="toggle"><input type="checkbox" id="set-motion" ${localStorage.getItem('gk.reduceMotion') === 'on' ? 'checked' : ''}/> Reduce motion</label>
    <button class="btn ghost small danger" id="set-reset">RESET ALL PROGRESS</button>`);
  ($('#set-sound') as HTMLInputElement).onchange = () => { sound.toggle(); paintSound(); };
  ($('#set-motion') as HTMLInputElement).onchange = (e) => {
    localStorage.setItem('gk.reduceMotion', (e.target as HTMLInputElement).checked ? 'on' : 'off');
    scene.reduced = reduceMotion(); applyMotion();
  };
  let armed = false;
  $('#set-reset').onclick = () => {
    if (!armed) { armed = true; $('#set-reset').textContent = 'TAP AGAIN TO ERASE EVERYTHING'; return; }
    progress.reset(); show('#modal', false); goStart(); toast('Progress erased');
  };
}

function toast(text: string) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// keep the input bar above the mobile keyboard
const vv = window.visualViewport;
if (vv) {
  const fit = () => document.documentElement.style.setProperty('--kb', `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
  vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
}

const show = (sel: string, on = true) => $(sel).classList.toggle('hidden', !on);

// ---------- start screen ----------
function goStart() {
  answering = false;
  session = null;
  ['#hud', '#prompt', '#bar', '#result', '#end', '#log', '#pill'].forEach((s) => show(s, false));
  $('#tag').className = 'tag hidden';
  scene.lines = []; scene.you = 0; scene.follow = 0;
  show('#start');
  const next = progress.nextDive;
  const live = progress.loadLive();
  const total = bank ? diveCount(bank) : 0;
  const begin = $('#begin') as HTMLButtonElement;
  if (bank && next > total) {
    begin.disabled = true;
    begin.textContent = 'ALL DIVES DONE';
    $('#dive-no').innerHTML = `you've finished all ${total} dives · new ones: <code>npm run generate</code>`;
    return;
  }
  begin.disabled = !bank;
  const resuming = live && live.dive === next && live.results.length > 0 && live.results.length < PROMPTS_PER_DIVE;
  begin.textContent = resuming ? '▼ RESUME DESCENT ▼' : '▼ BEGIN DESCENT ▼';
  $('#dive-no').textContent = resuming ? `DIVE #${next} · PROMPT ${live!.results.length + 1} OF 7` : `DIVE #${next}`;
}

$('#begin').onclick = () => {
  sound.ping();
  const next = progress.nextDive;
  const live = progress.loadLive();
  startDive(next, false, live && live.dive === next ? live.results : []);
};
$('#open-log').onclick = () => void openLog();

// ---------- dive flow ----------
let session: DiveSession | null = null;
let deadline = 0;
let answering = false;

function startDive(dive: number, replay: boolean, resumed: DiveRecord['results'] = []) {
  try {
    session = new DiveSession(dive, bank, replay, resumed);
  } catch (err) {
    toast(String((err as Error).message));
    return;
  }
  ['#start', '#end', '#log'].forEach((s) => show(s, false));
  show('#hud');
  scene.you = session.depth;
  scene.follow = session.depth;
  setHud(session.depth);
  void runPrompt();
}

function setHud(depth: number) {
  if (!session) return;
  $('#hud-depth').textContent = `${Math.round(depth).toLocaleString('en-US')}m`;
  $('#hud-score').textContent = String(session.score);
  document.querySelectorAll<HTMLElement>('.squares i').forEach((sq, i) => {
    const r = session!.results[i];
    sq.className = r ? 'done' : i === session!.index ? 'cur' : '';
    sq.style.setProperty('--tc', r?.tier ? TIER_BY_NAME[r.tier].color : '#5F7A70');
  });
  $('#hud-prompt').textContent = `PROMPT ${Math.min(session.index + 1, PROMPTS_PER_DIVE)} OF ${PROMPTS_PER_DIVE}${session.replay ? ' · REPLAY' : ''}`;
}

async function runPrompt() {
  const s = session!;
  const p = s.current!;
  scene.lines = [];
  scene.follow = s.depth;
  setHud(s.depth);
  $('#tag').className = 'tag hidden';
  show('#result', false);
  $('#prompt-eyebrow').textContent = `PROMPT ${s.index + 1} OF ${PROMPTS_PER_DIVE}`;
  $('#prompt-text').textContent = p.prompt;
  $('#prompt').classList.remove('away');
  show('#prompt');

  show('#pill');
  for (const n of [3, 2, 1]) { $('#pill-n').textContent = `${n}…`; await wait(650); if (session !== s) return; }
  show('#pill', false);

  const input = $('#answer') as HTMLInputElement;
  input.value = '';
  setMsg('');
  show('#bar');
  $('#bar').classList.remove('down', 'urgent');
  input.focus();
  deadline = performance.now() + SECONDS_PER_PROMPT * 1000;
  answering = true;
  requestAnimationFrame(tick);
}

function tick(now: number) {
  if (!answering || !session) return;
  const left = Math.max(0, (deadline - now) / 1000);
  const frac = left / SECONDS_PER_PROMPT;
  $('#ring-n').textContent = String(Math.ceil(left));
  const C = 2 * Math.PI * 20;
  const ring = $('#ring-fg') as unknown as SVGCircleElement;
  ring.style.strokeDasharray = `${C}`;
  ring.style.strokeDashoffset = `${C * (1 - frac)}`;
  $('#drain').style.transform = `scaleX(${frac})`;
  $('#bar').classList.toggle('urgent', left <= 5);
  if (left <= 0) {
    answering = false;
    const base = session.depth;
    session.timeout();
    persistLive();
    void land(null, base);
    return;
  }
  requestAnimationFrame(tick);
}

function setMsg(html: string, kind: 'reject' | 'near' | '' = '') {
  const m = $('#msg');
  m.className = `msg ${kind}`;
  m.innerHTML = html;
}

$('#bar').onsubmit = (e) => {
  e.preventDefault();
  if (!answering || !session) return;
  const input = $('#answer') as HTMLInputElement;
  const raw = input.value.trim();
  if (!raw) return;
  const base = session.depth;
  const out = session.submit(raw);
  if (out.kind === 'accepted') {
    answering = false;
    sound.ping();
    persistLive();
    void land(out.answer, base);
  } else if (out.kind === 'confirm') {
    setMsg(`"${esc(raw)}" → "<b>${esc(out.suggestion.text)}</b>" · submit again to confirm · or edit`, 'near');
    input.value = out.suggestion.text;
    input.select();
  } else {
    setMsg(`"${esc(raw)}": no echo, try again`, 'reject');
    const bar = $('#bar');
    bar.classList.remove('shake'); void bar.offsetWidth; bar.classList.add('shake');
  }
};

function persistLive() {
  if (!session || session.replay) return;
  progress.saveLive(session.done ? null : { dive: session.dive, results: session.results });
}

// ---------- the signature moment: the answer sinks ----------
async function land(a: Answer | null, base: number) {
  const s = session!;
  ($('#answer') as HTMLInputElement).blur();
  $('#bar').classList.add('down');
  $('#prompt').classList.add('away');
  setMsg('');

  if (!a) {
    sound.thud();
    await wait(380);
    show('#bar', false); show('#prompt', false);
    setHud(s.depth);
    showResult(null, null);
    return;
  }

  const tier = TIER_BY_NAME[a.tier];
  const target = base + tier.depth;
  scene.lines = TIERS.map((t) => ({ depth: base + t.depth, label: `${t.name.toUpperCase()} · ${t.points}`, color: t.color, state: 'idle' as const }));

  const tag = $('#tag');
  $('#tag-text').textContent = a.text.toUpperCase();
  tag.style.setProperty('--tc', '#FF6B5A');
  tag.style.transform = 'translate(-50%, 0)';
  tag.className = 'tag drop';
  await wait(460);
  show('#bar', false); show('#prompt', false);
  await sink(base, target, tag);

  scene.lines.forEach((L) => (L.state = L.depth === target ? 'lit' : 'dim'));
  tag.style.setProperty('--tc', tier.color);
  tag.classList.add('landed');
  sound.chime(TIERS.indexOf(tier));
  setHud(target);
  await wait(700);
  showResult(a, tier);
}

/**
 * A "lead" point eases from base to target; the tag chases it on a slightly
 * under-damped spring (soft overshoot + settle), and the camera chases the tag
 * on its own critically-damped spring. Result: organic, never mechanical.
 */
function sink(base: number, target: number, tag: HTMLElement): Promise<void> {
  if (reduceMotion()) {
    scene.you = target; scene.follow = target; scene.cam = target;
    tag.style.transform = 'translate(-50%, 0)';
    return Promise.resolve();
  }
  const dist = target - base;
  const leadDur = 900 + Math.sqrt(dist) * 55; // 100m ≈ 1.5s, 1000m ≈ 2.6s
  const w = 6.5, zeta = 0.62;
  let x = base, v = 0, last = performance.now(), t0 = last, lastBubble = 0;
  const crossed = new Set<number>();
  return new Promise((done) => {
    const step = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const k = Math.min(1, (now - t0) / leadDur);
      const lead = base + dist * (0.5 - 0.5 * Math.cos(Math.PI * k));
      v += (w * w * (lead - x) - 2 * zeta * w * v) * dt;
      x += v * dt;

      scene.you = x;
      scene.follow = x;
      setHud(Math.min(Math.max(x, base), target));

      // tag drifts on screen as the camera lags, sways like something sinking through water
      const speed = Math.min(1, Math.abs(v) / 500);
      const y = scene.screenY(x) - scene.anchorY;
      const sway = Math.sin((now - t0) / 260) * 10 * (0.25 + speed);
      const tilt = Math.sin((now - t0) / 340) * 5 * (0.3 + speed);
      tag.style.transform = `translate(calc(-50% + ${sway.toFixed(1)}px), ${y.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;

      if (now - lastBubble > 70) {
        lastBubble = now;
        const r = tag.getBoundingClientRect();
        scene.burst(r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.6, r.top, speed > 0.2 ? 2 : 1);
      }
      for (const L of scene.lines) {
        if (L.depth < target && x >= L.depth && !crossed.has(L.depth)) {
          crossed.add(L.depth);
          L.state = 'passed';
          L.pulseAt = now;
          sound.bubble();
        }
      }
      const settled = k >= 1 && Math.abs(x - target) < 0.6 && Math.abs(v) < 4;
      if (!settled) { requestAnimationFrame(step); return; }
      scene.you = target; scene.follow = target;
      // ease the tag back to centre/upright
      tag.style.transition = 'transform .35s ease-out';
      tag.style.transform = 'translate(-50%, 0) rotate(0deg)';
      setTimeout(() => (tag.style.transition = ''), 380);
      done();
    };
    requestAnimationFrame(step);
  });
}

function showResult(a: Answer | null, tier: Tier | null) {
  const s = session!;
  const r = $('#result');
  r.style.setProperty('--tc', tier ? tier.color : '#7FA595');
  r.style.setProperty('--tg', tier ? tier.glow : 'rgba(127,165,149,.3)');
  r.classList.toggle('timeout', !tier);
  r.innerHTML = (tier && a
    ? `<div class="creature-wrap">${creatureSVG(tier.name, 6)}</div>
       <div class="tier-name">${tier.name.toUpperCase()}</div>
       <div class="your">“${esc(a.text)}”</div>
       <div class="pts">+${tier.points} PTS · sink ${tier.depth}m</div>
       <p class="flavor">${tier.flavor}</p>`
    : `<div class="creature-wrap">${creatureSVG('Timeout', 6)}</div>
       <div class="tier-name">NO SIGNAL</div>
       <div class="pts">+0 PTS</div>
       <p class="flavor">the clock ran out before the ping.</p>`)
    + `<button class="btn primary" id="next">${s.done ? 'SURFACE ▲' : 'DESCEND ▼'}</button>`;
  show('#result');
  r.classList.remove('pop'); void r.offsetWidth; r.classList.add('pop');
  const btn = $('#next');
  btn.focus({ preventScroll: true });
  btn.onclick = () => (s.done ? void finishDive() : void runPrompt());
}

// ---------- end of dive ----------
async function finishDive() {
  const s = session!;
  const record: DiveRecord = {
    dive: s.dive, score: s.score, depth: s.depth, results: s.results,
    playedAt: new Date().toISOString(), replay: s.replay,
  };
  if (!s.replay) {
    await store.save(record);
    progress.nextDive = Math.max(progress.nextDive, s.dive + 1);
    progress.saveLive(null);
  }
  const past = firstTimeScores(await store.personal(), s.dive);

  ['#hud', '#result'].forEach((x) => show(x, false));
  $('#tag').className = 'tag hidden';
  scene.lines = [];
  const end = $('#end');
  end.innerHTML = endScreenHTML({ session: s, pastScores: past });
  end.scrollTop = 0;
  show('#end');
  countUp($('#end-score'), s.score);

  bindRecap(end, s.prompts, s.dive);
  $('#copy').onclick = async () => {
    const url = location.href.split('#')[0].split('?')[0];
    const ok = await copyText(shareText(s.dive, s.score, s.results, url));
    $('#copy').textContent = ok ? 'COPIED ✓' : 'COPY FAILED';
    setTimeout(() => ($('#copy').textContent = 'COPY RESULT'), 1800);
  };
  $('#next-dive').onclick = () => {
    const next = progress.nextDive;
    if (next > diveCount(bank)) { goStart(); return; }
    sound.ping();
    startDive(next, false);
  };
  $('#end-log').onclick = () => void openLog();
}

function countUp(el: HTMLElement, to: number) {
  if (reduceMotion()) { el.textContent = String(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- dive log ----------
async function openLog() {
  if (!bank) return;
  // answers are never revealed while a dive is in progress
  if (session && !session.done) { toast('Finish your dive first. The log reveals answers.'); return; }
  const records = (await store.personal()).filter((r) => !r.replay);
  const log = $('#log');
  const replay = (n: number) => {
    answering = false;
    ['#end', '#result', '#log'].forEach((x) => show(x, false));
    startDive(n, true);
  };
  const renderList = () => {
    log.innerHTML = logScreenHTML(records, progress.nextDive, diveCount(bank));
    log.scrollTop = 0;
    $('#log-back').onclick = () => show('#log', false);
    log.querySelectorAll<HTMLButtonElement>('[data-replay]').forEach((b) => (b.onclick = () => replay(Number(b.dataset.replay))));
    log.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((b) => (b.onclick = () => renderDetail(Number(b.dataset.open))));
  };
  const renderDetail = (n: number) => {
    const rec = records.find((r) => r.dive === n);
    if (!rec) return;
    const prompts = rec.results.map((r) => bank.prompts[r.promptId]).filter(Boolean);
    log.innerHTML = logDetailHTML(rec, prompts);
    log.scrollTop = 0;
    $('#detail-back').onclick = renderList;
    log.querySelector<HTMLButtonElement>('[data-replay]')!.onclick = () => replay(n);
    bindRecap(log, prompts, n);
  };
  renderList();
  show('#log');
}

// ---------- boot ----------
goStart();
loadBank()
  .then((b) => { bank = b; goStart(); })
  .catch(() => {
    $('#begin').textContent = 'BANK MISSING';
    $('#dive-no').textContent = 'run: npm run build-dives';
  });
