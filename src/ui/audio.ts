// Tiny Web Audio synth — no audio files. Muted by default.

class Sound {
  private ctx: AudioContext | null = null;
  enabled = localStorage.getItem('gk.sound') === 'on';

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('gk.sound', this.enabled ? 'on' : 'off');
    if (this.enabled) this.ac();
    return this.enabled;
  }

  private ac(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, endFreq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    const ac = this.ac();
    const t0 = ac.currentTime + start;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** soft sonar ping on submit */
  ping() {
    if (!this.enabled) return;
    this.tone(1320, 1180, 0, 0.9, 0.12);
    this.tone(1320, 1180, 0.22, 0.7, 0.04);
  }

  /** small bubble blip as the answer passes a tier line */
  bubble() {
    if (!this.enabled) return;
    const f = 380 + Math.random() * 260;
    this.tone(f, f * 2.2, 0, 0.09, 0.07);
  }

  /** chime on tier reveal — brighter for rarer tiers */
  chime(rank: number) {
    if (!this.enabled) return;
    const base = 523.25 * Math.pow(2, rank / 12);
    [0, 4, 7, rank >= 4 ? 12 : 7].forEach((semi, i) =>
      this.tone(base * Math.pow(2, semi / 12), base * Math.pow(2, semi / 12), i * 0.09, 0.8, 0.07, 'triangle'),
    );
  }

  thud() {
    if (!this.enabled) return;
    this.tone(160, 70, 0, 0.5, 0.12, 'sine');
  }
}

export const sound = new Sound();
