// Original pixel-art sprites rendered as crisp SVG <rect> grids.
import type { TierName } from '../core/tiers';

type Palette = Record<string, string>;

function pixelSVG(rows: string[], pal: Palette, scale = 4, cls = ''): string {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  let rects = '';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = pal[ch];
      if (c) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    });
  });
  return `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

const SPRITES: Record<TierName | 'Timeout', string[]> = {
  Plankton: [
    '...aaa...',
    '..a.b.a..',
    '.a.bcb.a.',
    'a.b...b.a',
    'abc.c.cba',
    'a.b...b.a',
    '.a.bcb.a.',
    '..a.b.a..',
    '...aaa...',
  ],
  'Too Clever': [
    'a.........a',
    'aa.......aa',
    '.ab.d.d.ba.',
    '..abbbbba..',
    '.bbbbbbbbb.',
    'bbabbbbbabb',
    '.b.b...b.b.',
    'b...b.b...b',
  ],
  Schooler: [
    '.....aaaa....',
    '...aaaaaaa..a',
    '..aadaaaaaaaa',
    '.aaaaabababaa',
    '..aaaaaaaaaaa',
    '...aaaaaaa..a',
    '.....aaaa....',
  ],
  Rare: [
    '....aa....',
    '...aaaa...',
    '..aaaaaa..',
    '..abaaba..',
    '..aaaaaa..',
    '..adaada..',
    '..aaaaaa..',
    '.a.a..a.a.',
    'a..a..a..a',
    'a.a....a.a',
    '.a......a.',
  ],
  'Deep Cut': [
    '......cc......',
    '.......a......',
    '........a.....',
    '...aaaaaaa....',
    '.aaaaaaaaaa..a',
    'aadaaaaaaaaaaa',
    'aaaaaaaaaaa.ba',
    'cacacaaaaa...a',
    '.aaaaaaa......',
  ],
  'Golden Krill': [
    'c..............',
    '.c....aaaa.....',
    '..c.aaaaaaaa...',
    '...adaaaaaaaaa.',
    '...aaaaaaaaaaaa',
    '....b.b.b.b.aba',
    '...b.b.b.b...ab',
    '..............a',
  ],
  Timeout: [
    '..aaaaa..',
    '.a.....a.',
    'a...b...a',
    'a...b...a',
    'a...bbb.a',
    'a.......a',
    '.a.....a.',
    '..aaaaa..',
  ],
};

const SHADE: Record<TierName | 'Timeout', Palette> = {
  Plankton: { a: '#A9C2CF', b: '#6F8B99', c: '#E6FFF2' },
  'Too Clever': { a: '#FFB347', b: '#E2852A', d: '#04100C' },
  Schooler: { a: '#7CFFB2', b: '#3FBF7E', d: '#04100C' },
  Rare: { a: '#FF6B5A', b: '#FFB3A8', d: '#04100C' },
  'Deep Cut': { a: '#B48CFF', b: '#7A55C9', c: '#FFF3B0', d: '#FFF3B0' },
  'Golden Krill': { a: '#FFD24A', b: '#FFF0A8', c: '#FFE88A', d: '#04100C' },
  Timeout: { a: '#5F7A70', b: '#8FA89E' },
};

export const creatureSVG = (tier: TierName | 'Timeout', scale = 5) =>
  pixelSVG(SPRITES[tier], SHADE[tier], scale, 'creature');

export const krillLogoSVG = (scale = 5) =>
  pixelSVG(SPRITES['Golden Krill'], SHADE['Golden Krill'], scale, 'logo-krill');

// UI glyphs
export const ICON = {
  menu: pixelSVG(['aaaaaaa', '.......', 'aaaaaaa', '.......', 'aaaaaaa'], { a: 'currentColor' }, 3),
  soundOn: pixelSVG(['...a.....a', '..aa..a..a', 'aaaa...a.a', 'aaaa...a.a', 'aaaa...a.a', '..aa..a..a', '...a.....a'], { a: 'currentColor' }, 3),
  soundOff: pixelSVG(['...a......', '..aa.a...a', 'aaaa..a.a.', 'aaaa...a..', 'aaaa..a.a.', '..aa.a...a', '...a......'], { a: 'currentColor' }, 3),
  gear: pixelSVG(['..a.a.a..', '.aaaaaaa.', 'aaa...aaa', '.aa...aa.', 'aaa...aaa', '.aaaaaaa.', '..a.a.a..'], { a: 'currentColor' }, 3),
};
