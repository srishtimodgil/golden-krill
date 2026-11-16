// Side-view ocean rendered as chunky pixel art on a low-res canvas,
// plus a crisp overlay canvas for the depth gauge, tier lines and depth facts.

const PX = 3;            // css px per art pixel
export const PPM = 0.75; // css px per metre of depth

export interface TierLine {
  depth: number;
  label: string;
  color: string;
  state: 'idle' | 'passed' | 'lit' | 'dim';
  /** performance.now() when the answer crossed this line (for a glow pulse) */
  pulseAt?: number;
}

export interface DepthMarker { depth: number; text: string; side: 'L' | 'R'; zone?: boolean }

// Real ocean facts (approximate, rounded).
export const DEPTH_MARKERS: DepthMarker[] = [
  { depth: 10, text: 'pressure doubles · 2 atmospheres', side: 'R' },
  { depth: 20, text: 'reds have faded to brown', side: 'L' },
  { depth: 40, text: 'recreational scuba limit · 40m', side: 'R' },
  { depth: 100, text: 'light begins to fade fast', side: 'L' },
  { depth: 200, text: 'THE TWILIGHT ZONE', side: 'R', zone: true },
  { depth: 214, text: 'deepest no-limits freedive · 214m', side: 'L' },
  { depth: 332, text: 'deepest scuba dive on record · 332m', side: 'R' },
  { depth: 500, text: 'emperor penguins dive past here', side: 'L' },
  { depth: 700, text: 'vampire squid drift 600–900m', side: 'R' },
  { depth: 1000, text: 'THE MIDNIGHT ZONE', side: 'L', zone: true },
  { depth: 1050, text: 'no sunlight at all · ~100 atmospheres', side: 'R' },
  { depth: 1300, text: 'anglerfish territory', side: 'L' },
  { depth: 2000, text: 'sperm whales hunt squid down here', side: 'R' },
  { depth: 2500, text: 'hydrothermal vents & tube worms', side: 'L' },
  { depth: 2992, text: "Cuvier's beaked whale record · 2,992m", side: 'R' },
  { depth: 3700, text: 'average depth of the ocean · ~3,700m', side: 'L' },
  { depth: 3800, text: 'the Titanic rests here · 3,800m', side: 'R' },
  { depth: 4000, text: 'THE ABYSSAL ZONE', side: 'L', zone: true },
  { depth: 4791, text: 'wreck of the Bismarck · ~4,790m', side: 'R' },
  { depth: 6000, text: 'THE HADAL ZONE', side: 'L', zone: true },
  { depth: 6900, text: 'trench floor? still ~4km further down', side: 'R' },
];

type RGB = [number, number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function hash(n: number) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x: number) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); }

const WATER: [number, RGB][] = [
  [0, [34, 122, 118]], [120, [14, 72, 74]], [450, [6, 38, 42]], [1200, [3, 18, 20]], [3000, [1, 7, 8]], [7000, [0, 2, 3]],
];
function waterAt(d: number): RGB {
  for (let i = 1; i < WATER.length; i++) {
    if (d <= WATER[i][0]) {
      const [d0, c0] = WATER[i - 1], [d1, c1] = WATER[i];
      return mix(c0, c1, (d - d0) / (d1 - d0));
    }
  }
  return WATER[WATER.length - 1][1];
}
const quant = (c: RGB): RGB => [Math.round(c[0] / 3) * 3, Math.round(c[1] / 3) * 3, Math.round(c[2] / 3) * 3];

export class Scene {
  cam = 0;
  private camV = 0;
  you = 0;
  /** depth the camera should follow (smoothly); null = hold */
  follow: number | null = null;
  lines: TierLine[] = [];
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  private ctx: CanvasRenderingContext2D;
  private octx: CanvasRenderingContext2D;
  private W = 0; private H = 0; private w = 0; private h = 0; private dpr = 1;
  private t = 0; private last = 0;
  private bubbles: { x: number; y: number; vy: number; s: number }[] = [];
  private bubbleTimer = 0;
  private schools = Array.from({ length: 9 }, (_, i) => ({
    depth: 30 + i * 110 + hash(i) * 60, x: hash(i + 9) * 400, vx: (hash(i + 3) > 0.5 ? 1 : -1) * (6 + hash(i + 5) * 8), n: 5 + Math.floor(hash(i + 7) * 8), seed: i,
  }));
  private specks = Array.from({ length: 420 }, (_, i) => ({ x: hash(i * 3.1), depth: 250 + hash(i * 7.7) * 7600, ph: hash(i) * 6.28, hue: hash(i * 1.3) }));
  private kelp = Array.from({ length: 22 }, (_, i) => ({ depth: 55 + i * 13 + hash(i) * 8, side: i % 2, len: 14 + hash(i + 2) * 26, ph: hash(i) * 6 }));

  constructor(private canvas: HTMLCanvasElement, private overlay: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.octx = overlay.getContext('2d')!;
    addEventListener('resize', () => this.resize());
    this.resize();
    requestAnimationFrame((n) => this.frame(n));
  }

  get anchorY() { return Math.round(this.H * 0.4); }
  screenY(depth: number) { return this.anchorY + (depth - this.cam) * PPM; }
  private depthAt(cssY: number) { return this.cam + (cssY - this.anchorY) / PPM; }

  private resize() {
    this.W = innerWidth; this.H = innerHeight; this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = Math.ceil(this.W / PX); this.h = Math.ceil(this.H / PX) + 2;
    this.canvas.width = this.w; this.canvas.height = this.h;
    this.canvas.style.height = `${this.h * PX}px`;
    this.canvas.style.width = `${this.w * PX}px`;
    this.overlay.width = this.W * this.dpr; this.overlay.height = this.H * this.dpr;
    this.ctx.imageSmoothingEnabled = false;
  }

  private frame(now: number) {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    if (!this.reduced) this.t += dt;
    if (this.follow !== null) {
      if (this.reduced) { this.cam = this.follow; this.camV = 0; }
      else {
        // critically damped spring: smooth start, no overshoot, no jitter
        const w = 4.2;
        this.camV += (w * w * (this.follow - this.cam) - 2 * w * this.camV) * dt;
        this.cam += this.camV * dt;
      }
    }
    // render the pixel world on a whole-art-pixel grid, then shift the canvas by the
    // sub-pixel remainder so scrolling is perfectly smooth instead of stepping 3px at a time
    const realCam = this.cam;
    const grid = PX / PPM;
    const snapped = Math.floor(realCam / grid) * grid;
    this.cam = snapped;
    this.drawWorld(dt);
    this.cam = realCam;
    this.canvas.style.transform = `translate3d(0, ${(-(realCam - snapped) * PPM).toFixed(2)}px, 0)`;
    this.drawOverlay(now);
    requestAnimationFrame((n) => this.frame(n));
  }

  // ---------------- pixel world ----------------
  private wallWidth(d: number, side: number): number {
    if (d < 45) return 0;
    const s = side * 97.3;
    const kelpZone = 3 + noise(d * 0.03 + s) * 6;
    const spikes = (() => {
      const p = d / 140 + s;
      const i = Math.floor(p), f = p - i;
      const tri = 1 - Math.abs(2 * f - 1);
      return 6 + noise(d * 0.01 + s) * 10 + Math.pow(tri, 2.4) * hash(i + side) * 34;
    })();
    const trench = 26 + noise(d * 0.02 + s) * 10 + clamp((d - 2500) / 4000) * this.w * 0.12;
    if (d < 350) return lerp(0, kelpZone, clamp((d - 45) / 40));
    if (d < 2500) return lerp(kelpZone, spikes, clamp((d - 350) / 200));
    return lerp(spikes, trench, clamp((d - 2500) / 500));
  }

  private drawWorld(dt: number) {
    const { ctx, w, h } = this;
    const surfY = this.screenY(0) / PX;

    for (let y = 0; y < h; y++) {
      const d = this.depthAt(y * PX + PX / 2);
      if (d < 0) {
        const k = clamp(y / Math.max(1, surfY));
        ctx.fillStyle = rgb(quant(mix([86, 150, 178], [196, 224, 214], k)));
        ctx.fillRect(0, y, w, 1);
        continue;
      }
      const water = quant(waterAt(d));
      ctx.fillStyle = rgb(water);
      ctx.fillRect(0, y, w, 1);
      const rock = quant(mix(water, [0, 0, 0], 0.55));
      const lw = Math.round(this.wallWidth(d, 0)), rw = Math.round(this.wallWidth(d, 1));
      if (lw || rw) {
        ctx.fillStyle = rgb(rock);
        if (lw) ctx.fillRect(0, y, lw, 1);
        if (rw) ctx.fillRect(w - rw, y, rw, 1);
        // rim highlight
        ctx.fillStyle = rgb(mix(rock, water, 0.5));
        if (lw) ctx.fillRect(lw, y, 1, 1);
        if (rw) ctx.fillRect(w - rw - 1, y, 1, 1);
      }
    }

    if (surfY > -60) this.drawSky(surfY);
    this.drawRays(surfY);
    this.drawKelp();
    this.drawFish(dt);
    this.drawSpecks();
    this.drawSub(surfY);
    this.drawBubbles(dt, surfY);
    if (surfY > -10 && surfY < h + 5) this.drawWaterline(surfY);
  }

  private drawSky(surfY: number) {
    const { ctx, w } = this;
    // sun
    const sx = Math.round(w * 0.8), sy = Math.round(surfY - Math.min(46, surfY * 0.6));
    for (let r = 14; r > 6; r -= 3) { ctx.fillStyle = `rgba(255,236,170,${0.08 + (14 - r) * 0.02})`; this.disc(sx, sy, r); }
    ctx.fillStyle = '#FFF1B8'; this.disc(sx, sy, 6);
    ctx.fillStyle = '#FFE58A'; this.disc(sx + 1, sy + 1, 4);
    // clouds
    ctx.fillStyle = 'rgba(240,250,246,.9)';
    for (let i = 0; i < 4; i++) {
      const cx = ((hash(i) * w + this.t * (1.5 + i * 0.6)) % (w + 60)) - 30;
      const cy = Math.round(surfY * (0.15 + hash(i + 4) * 0.45));
      const cw = 12 + Math.round(hash(i + 8) * 14);
      ctx.fillRect(Math.round(cx), cy, cw, 3);
      ctx.fillRect(Math.round(cx) + 3, cy - 2, cw - 7, 2);
      ctx.fillRect(Math.round(cx) + 6, cy - 4, Math.max(3, cw - 14), 2);
    }
    // support barge with crane (original design)
    const bx = Math.round(w * 0.22) - 16, by = Math.round(surfY);
    const bob = Math.round(Math.sin(this.t * 1.6));
    ctx.fillStyle = '#26363A'; ctx.fillRect(bx, by - 4 + bob, 34, 4);
    ctx.fillStyle = '#3B5257'; ctx.fillRect(bx + 2, by - 5 + bob, 30, 1);
    ctx.fillStyle = '#D9E4DD'; ctx.fillRect(bx + 4, by - 10 + bob, 9, 5);
    ctx.fillStyle = '#FFB347'; ctx.fillRect(bx + 6, by - 8 + bob, 2, 2); ctx.fillRect(bx + 9, by - 8 + bob, 2, 2);
    ctx.fillStyle = '#E0A93A';
    ctx.fillRect(bx + 22, by - 16 + bob, 2, 11);            // mast
    for (let i = 0; i < 9; i++) ctx.fillRect(bx + 22 - i, by - 16 + bob - Math.floor(i / 3), 1, 1); // boom
  }

  private disc(cx: number, cy: number, r: number) {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      this.ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
    }
  }

  private drawWaterline(surfY: number) {
    const { ctx, w } = this;
    for (let x = 0; x < w; x++) {
      const o = Math.round(Math.sin(x * 0.18 + this.t * 2.2) * 1.2 + Math.sin(x * 0.07 - this.t) * 0.8);
      ctx.fillStyle = 'rgba(210,245,235,.85)'; ctx.fillRect(x, Math.round(surfY) + o, 1, 1);
      ctx.fillStyle = 'rgba(120,200,190,.5)'; ctx.fillRect(x, Math.round(surfY) + o + 1, 1, 1);
    }
  }

  private drawRays(surfY: number) {
    if (surfY < -80 || surfY > this.h) return;
    const { ctx, w } = this;
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const x0 = w * (0.1 + i * 0.2) + Math.sin(this.t * 0.4 + i) * 6;
      const g = ctx.createLinearGradient(0, surfY, 0, surfY + 90);
      g.addColorStop(0, 'rgba(200,255,235,.13)'); g.addColorStop(1, 'rgba(200,255,235,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, surfY); ctx.lineTo(x0 + 8, surfY);
      ctx.lineTo(x0 + 30, surfY + 90); ctx.lineTo(x0 + 14, surfY + 90);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawKelp() {
    const { ctx, w } = this;
    for (const k of this.kelp) {
      const by = this.screenY(k.depth) / PX;
      if (by < -60 || by > this.h + 10) continue;
      const wall = this.wallWidth(k.depth, k.side);
      const bx = k.side === 0 ? wall + 1 : w - wall - 2;
      for (let s = 0; s < k.len; s++) {
        const sway = Math.round(Math.sin(this.t * 1.1 + s * 0.25 + k.ph) * s * 0.12);
        const x = bx + sway, y = Math.round(by - s);
        ctx.fillStyle = s % 5 === 0 ? '#4F9A4C' : '#2E6B3A';
        ctx.fillRect(x, y, 1, 1);
        if (s % 4 === 2) { ctx.fillStyle = '#3F8A45'; ctx.fillRect(x + (s % 8 === 2 ? 1 : -1), y, 1, 1); }
      }
    }
  }

  private drawFish(dt: number) {
    const { ctx, w } = this;
    for (const sc of this.schools) {
      sc.x += sc.vx * dt * (this.reduced ? 0 : 1);
      const cy = this.screenY(sc.depth) / PX;
      if (cy < -20 || cy > this.h + 20) continue;
      const col = rgb(mix(waterAt(sc.depth), [0, 0, 0], 0.45), 0.9);
      ctx.fillStyle = col;
      for (let i = 0; i < sc.n; i++) {
        const fx = (((sc.x + hash(sc.seed * 10 + i) * 40) % (w + 60)) + w + 60) % (w + 60) - 30;
        const fy = Math.round(cy + (hash(sc.seed * 20 + i) - 0.5) * 18 + Math.sin(this.t * 2 + i) * 0.8);
        const dir = sc.vx > 0 ? 1 : -1;
        const x = Math.round(fx);
        ctx.fillRect(x, fy, 3, 2);
        ctx.fillRect(x - dir * 1 + (dir < 0 ? 3 : 0) - (dir < 0 ? 0 : 0), fy, 1, 1);
        ctx.fillRect(dir > 0 ? x - 1 : x + 3, fy + 1, 1, 1);
      }
    }
  }

  private drawSpecks() {
    const { ctx, w } = this;
    for (const s of this.specks) {
      const y = this.screenY(s.depth) / PX;
      if (y < 0 || y > this.h) continue;
      const dark = clamp((s.depth - 300) / 1800);
      const a = dark * (0.45 + 0.55 * Math.sin(this.t * 1.7 + s.ph * 3));
      if (a <= 0.03) continue;
      const c = s.hue < 0.6 ? '124,255,178' : s.hue < 0.85 ? '120,230,255' : '255,210,74';
      const x = Math.round(s.x * w);
      ctx.fillStyle = `rgba(${c},${a * 0.25})`; ctx.fillRect(x - 1, Math.round(y) - 1, 3, 3);
      ctx.fillStyle = `rgba(${c},${a})`; ctx.fillRect(x, Math.round(y), 1, 1);
    }
  }

  /** the bathysphere — the player's vessel */
  private drawSub(surfY: number) {
    const { ctx } = this;
    const x = Math.round(this.w * 0.22);
    const y = Math.round(this.screenY(this.you) / PX + 10 + Math.sin(this.t * 1.4) * 1.2);
    // cable
    ctx.fillStyle = 'rgba(200,210,200,.55)';
    const top = Math.max(0, Math.round(surfY) - 16);
    ctx.fillRect(x, top, 1, Math.max(0, y - 8 - top));
    // headlamp beam (more visible as it gets darker)
    const dark = clamp(this.you / 900, 0.15, 1);
    const g = ctx.createLinearGradient(x + 6, 0, x + 60, 0);
    g.addColorStop(0, `rgba(255,220,140,${0.28 * dark})`); g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x + 6, y - 1); ctx.lineTo(x + 60, y - 12); ctx.lineTo(x + 60, y + 12); ctx.lineTo(x + 6, y + 2); ctx.fill();
    // hull
    ctx.fillStyle = '#5E4A2A'; this.disc(x, y, 8);
    ctx.fillStyle = '#B08A4A'; this.disc(x, y, 7);
    ctx.fillStyle = '#D4AE68'; ctx.fillRect(x - 5, y - 5, 3, 2); ctx.fillRect(x - 6, y - 3, 2, 2);
    // rivets
    ctx.fillStyle = '#5E4A2A';
    [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [4, -4], [-4, 4]].forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 1, 1));
    // porthole
    ctx.fillStyle = '#2B2216'; this.disc(x + 2, y, 3);
    ctx.fillStyle = '#FFD24A'; this.disc(x + 2, y, 2);
    ctx.fillStyle = '#FFF4C2'; ctx.fillRect(x + 1, y - 1, 1, 1);
    // top hatch & lamp
    ctx.fillStyle = '#7A6034'; ctx.fillRect(x - 2, y - 9, 5, 2);
    ctx.fillStyle = '#FFB347'; ctx.fillRect(x + 7, y - 1, 2, 2);
  }

  private drawBubbles(dt: number, surfY: number) {
    const { ctx } = this;
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0 && !this.reduced) {
      this.bubbleTimer = 0.25 + Math.random() * 0.35;
      const x = Math.round(this.w * 0.22) + (Math.random() * 6 - 3);
      this.bubbles.push({ x, y: this.screenY(this.you) / PX + 2, vy: 10 + Math.random() * 10, s: Math.random() < 0.3 ? 2 : 1 });
      if (Math.random() < 0.6) this.bubbles.push({ x: Math.random() * this.w, y: this.h + 2, vy: 8 + Math.random() * 12, s: 1 });
    }
    ctx.fillStyle = 'rgba(200,255,240,.55)';
    this.bubbles = this.bubbles.filter((b) => {
      b.y -= b.vy * dt;
      b.x += Math.sin(b.y * 0.3) * 0.15;
      if (b.y < Math.max(0, surfY + 1)) return false;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s);
      return true;
    });
  }

  /** emit bubbles at a css-pixel position (used for the sinking answer's trail) */
  burst(cssX: number, cssY: number, n = 3) {
    if (this.reduced) return;
    for (let i = 0; i < n; i++) {
      this.bubbles.push({ x: cssX / PX + (Math.random() * 10 - 5), y: cssY / PX + Math.random() * 3, vy: 14 + Math.random() * 16, s: Math.random() < 0.35 ? 2 : 1 });
    }
  }

  // ---------------- crisp overlay ----------------
  private drawOverlay(now: number) {
    const c = this.octx, W = this.W, H = this.H;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const gx = W - 46;

    // depth facts
    for (const m of DEPTH_MARKERS) {
      const y = this.screenY(m.depth);
      if (y < -20 || y > H + 20) continue;
      const a = clamp(1.25 - Math.abs(y - this.anchorY) / (H * 0.42));
      if (a <= 0) continue;
      c.save();
      c.globalAlpha = a;
      c.textBaseline = 'middle';
      c.textAlign = m.side === 'L' ? 'left' : 'right';
      const x = m.side === 'L' ? 14 : gx - 10;
      if (m.zone) {
        c.font = '13px Silkscreen, monospace';
        (c as any).letterSpacing = '3px';
        c.fillStyle = '#7CFFB2'; c.shadowColor = 'rgba(124,255,178,.7)'; c.shadowBlur = 10;
      } else {
        c.font = '11px "IBM Plex Mono", monospace';
        (c as any).letterSpacing = '1px';
        c.fillStyle = '#B5D3C4';
      }
      c.fillText(m.zone ? m.text : `— ${m.text}`, x, y);
      c.restore();
    }

    // tier lines
    for (const L of this.lines) {
      const y = Math.round(this.screenY(L.depth)) + 0.5;
      if (y < -10 || y > H + 10) continue;
      c.save();
      c.setLineDash(L.state === 'lit' ? [6, 4] : [2, 5]);
      c.lineWidth = L.state === 'lit' ? 2 : 1;
      c.strokeStyle = L.state === 'idle' ? 'rgba(127,165,149,.45)' : L.state === 'dim' ? 'rgba(127,165,149,.18)' : L.color;
      c.globalAlpha = L.state === 'passed' ? 0.6 : 1;
      const pulse = L.pulseAt ? Math.max(0, 1 - (now - L.pulseAt) / 600) : 0;
      if (L.state === 'lit') { c.shadowColor = L.color; c.shadowBlur = 12 + 6 * Math.sin(now / 260); }
      else if (pulse > 0) { c.globalAlpha = 0.6 + 0.4 * pulse; c.lineWidth = 1 + pulse * 1.5; c.shadowColor = L.color; c.shadowBlur = 14 * pulse; }
      c.beginPath(); c.moveTo(12, y); c.lineTo(gx - 6, y); c.stroke();
      c.setLineDash([]);
      c.font = '10px Silkscreen, monospace';
      (c as any).letterSpacing = '2px';
      c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillStyle = L.state === 'idle' || L.state === 'dim' ? 'rgba(181,211,196,.6)' : L.color;
      c.fillText(L.label, gx - 8, y - 4);
      c.restore();
    }

    // depth gauge
    c.fillStyle = 'rgba(4,16,12,.55)'; c.fillRect(gx, 0, 46, H);
    c.fillStyle = 'rgba(124,255,178,.35)'; c.fillRect(gx, 0, 1, H);
    const top = this.depthAt(0), bot = this.depthAt(H);
    c.font = '9px "IBM Plex Mono", monospace';
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let m = Math.max(0, Math.floor(top / 25) * 25); m <= bot; m += 25) {
      const y = Math.round(this.screenY(m)) + 0.5;
      const major = m % 100 === 0;
      c.fillStyle = major ? 'rgba(124,255,178,.8)' : 'rgba(124,255,178,.35)';
      c.fillRect(gx + 1, y, major ? 10 : 5, 1);
      if (major) { c.fillStyle = 'rgba(181,211,196,.75)'; c.fillText(`${m}m`, W - 4, y); }
    }
    // YOU marker
    const yy = Math.round(this.screenY(this.you) + 10 * PX);
    c.fillStyle = '#FF6B5A';
    c.shadowColor = 'rgba(255,107,90,.8)'; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(gx - 1, yy); c.lineTo(gx + 7, yy - 6); c.lineTo(gx + 7, yy + 6); c.fill();
    c.fillRect(gx + 8, yy - 7, 36, 14);
    c.shadowBlur = 0;
    c.fillStyle = '#04100C'; c.font = '10px Silkscreen, monospace'; c.textAlign = 'center';
    c.fillText('YOU', gx + 26, yy + 1);
  }
}
