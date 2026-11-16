import { defineConfig, type Plugin } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';

// Ship /data/questions.json + /data/dives.json with the build (fetched at runtime,
// so the big bank stays out of the JS bundle). Vite's dev server serves them from the root.
const copyBank = (): Plugin => ({
  name: 'copy-bank',
  apply: 'build',
  closeBundle() {
    mkdirSync('dist/data', { recursive: true });
    for (const f of ['questions.json', 'dives.json']) cpSync(`data/${f}`, `dist/data/${f}`);
  },
});

// base './' so the build works on GitHub Pages sub-paths and Vercel alike
export default defineConfig({ base: './', plugins: [copyBank()] });
