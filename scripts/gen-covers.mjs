// Generator okładek bloga: jeden szablon marki D-LOGIC -> PNG per KLUCZ wpisu.
// Branded poster (dark + złoto + siatka + generatywna konstelacja węzłów seedowana kluczem).
// Bez tytułu na grafice: neutralny językowo (jedna okładka na klucz pl/en/de) i bez dublowania H1.
// Uruchom z katalogu repo:  node scripts/gen-covers.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BLOG = 'src/content/blog/pl';
const OUT = 'public/blog/covers';
fs.mkdirSync(OUT, { recursive: true });

function frontmatter(file) {
  const s = fs.readFileSync(file, 'utf8');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const o = {};
  if (m) for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (mm) o[mm[1]] = mm[2];
  }
  return o;
}

function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function motif(seed) {
  const rnd = mulberry32(seed);
  const cx = 770, cy = 315, sx = 330, sy = 230;
  const n = 7 + Math.floor(rnd() * 4);
  const nodes = [];
  for (let i = 0; i < n; i++) nodes.push({ x: cx + (rnd() * 2 - 1) * sx, y: cy + (rnd() * 2 - 1) * sy, r: 3 + rnd() * 7 });
  let lines = '';
  for (let i = 0; i < n; i++) {
    const a = nodes[i], b = nodes[(i + 1 + Math.floor(rnd() * 2)) % n];
    lines += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#E8B23A" stroke-opacity="0.32" stroke-width="1.4"/>`;
  }
  const dots = nodes.map(nd => `<circle cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${nd.r.toFixed(1)}" fill="#E8B23A" fill-opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`).join('');
  return lines + dots;
}

function svg(key, kind) {
  const tag = { project: 'project', reflection: 'reflection', trading: 'trading' }[kind] || 'note';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="g" cx="64%" cy="42%" r="56%"><stop offset="0" stop-color="#E8B23A" stop-opacity="0.13"/><stop offset="1" stop-color="#E8B23A" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#E7E9EC" stroke-opacity="0.04" stroke-width="1"/></pattern>
    <style>.s{font-family:'DejaVu Sans','Liberation Sans',Arial,sans-serif}.m{font-family:'DejaVu Sans Mono','Liberation Mono',monospace}</style>
  </defs>
  <rect width="1200" height="630" fill="#0C0E12"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g>${motif(hash(key))}</g>
  <rect x="1" y="1" width="1198" height="628" fill="none" stroke="#23272E" stroke-width="2"/>
  <text x="64" y="96" class="m" font-size="24" letter-spacing="3" fill="#E8B23A">&#9670; D-LOGIC</text>
  <text x="64" y="128" class="m" font-size="15" letter-spacing="3" fill="#9AA1AB">studio</text>
  <text x="64" y="546" class="m" font-size="15" letter-spacing="1.5" fill="#9AA1AB">${tag}</text>
  <text x="1136" y="546" text-anchor="end" class="m" font-size="15" fill="#9AA1AB">rdemb.github.io</text>
</svg>`;
}

const files = fs.readdirSync(BLOG).filter(f => f.endsWith('.md'));
const seen = new Set();
for (const f of files) {
  const d = frontmatter(path.join(BLOG, f));
  if (!d.key || seen.has(d.key)) continue;
  seen.add(d.key);
  await sharp(Buffer.from(svg(d.key, d.kind))).png().toFile(path.join(OUT, d.key + '.png'));
  console.log('cover', d.key, '(' + (d.kind || '?') + ')');
}
console.log('TOTAL', seen.size, 'okładek');
