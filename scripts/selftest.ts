// npm test — plays every dive through the real game logic and checks matching.
import { readFileSync } from 'node:fs';
import { DiveSession, rarestAnswers, type Bank } from '../src/core/dive';
import { LocalScoreStore, Progress, type KV } from '../src/core/history';
import { shareText, betterThan } from '../src/core/stats';
import type { Prompt } from '../src/core/matching';

const q: Prompt[] = JSON.parse(readFileSync('data/questions.json', 'utf8'));
const bank: Bank = { prompts: Object.fromEntries(q.map((p) => [p.id, p])), dives: JSON.parse(readFileSync('data/dives.json', 'utf8')) };
const mem = new Map<string, string>();
const kv: KV = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
const store = new LocalScoreStore(kv), prog = new Progress(kv);

let bad = 0, checked = 0;
for (const n of Object.keys(bank.dives).map(Number)) {
  const s = new DiveSession(n, bank);
  s.prompts.forEach((p, idx) => {
    // every answer text and alias must be accepted as exactly that answer
    for (const a of p.answers) for (const f of [a.text, ...(a.aliases ?? [])]) {
      const t = new DiveSession(n, bank, true, Array.from({ length: idx }, () => ({ promptId: '', answer: null, tier: null, points: 0 })));
      const r = t.submit(f);
      checked++;
      if (r.kind !== 'accepted' || r.answer.text !== a.text) {
        bad++;
        if (bad <= 15) console.log(`  ✖ [${p.id}] "${f}" → ${r.kind} ${'answer' in r ? r.answer.text : 'suggestion' in r ? r.suggestion.text : ''}`);
      }
    }
    if (Math.random() < 0.15) s.timeout();
    else s.submit(p.answers[Math.floor(Math.random() * p.answers.length)].text);
  });
  await store.save({ dive: n, score: s.score, depth: s.depth, results: s.results, playedAt: new Date().toISOString(), replay: false });
  prog.nextDive = n + 1;
}
const recs = await store.personal();
console.log(`${checked} answer forms checked · ${bad} failures`);
console.log(`simulated scores: ${recs.map((r) => r.score).join(' ')} · 300 beats ${betterThan(300, recs.map((r) => r.score))}%`);
console.log(shareText(1, recs[0].score, recs[0].results, 'https://example.com'));
console.log('rarest for dive #1, prompt 1:', rarestAnswers(new DiveSession(1, bank).prompts[0]).map((a) => `${a.text} (${a.tier})`).join(', '));
if (bad) process.exit(1);
