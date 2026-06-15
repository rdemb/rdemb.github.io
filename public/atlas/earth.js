/*
  D-LOGIC ATLAS — proceduralna Ziemia v2 (earth.js)
  =================================================
  Per-pikselowe BIOMY na masce lądu z GeoJSON granic (jsdelivr, CORS):
  tropik=głęboka zieleń, pas pustyń=piaskowy tan (struktura!), las umiarkowany,
  tajga, lód na biegunach; relief fBm modeluje jasność (góry/niziny).
  Projekcja równoodległościowa wyrównana do latLngToVec3 (u=(lng+180)/360, v=(90-lat)/180).
  Zwraca: mapa dzienna, specular oceanów, chmury, ORAZ geojson (globus rysuje
  z niego idealnie wyrównane kontury+granice — koniec rozjazdu warstw).
*/
import * as THREE from 'three';

const COUNTRY_URLS = [
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson',
  'https://cdn.jsdelivr.net/npm/world-geojson@1.1.0/countries.geo.json',
];

function makeNoise(seed) {
  const p = new Uint8Array(512); let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1 ? -x : x) + (h & 2 ? -y : y));
  function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y); const a = p[X] + Y, b = p[X + 1] + Y;
    return lerp(lerp(grad(p[a], x, y), grad(p[b], x - 1, y), u), lerp(grad(p[a + 1], x, y - 1), grad(p[b + 1], x - 1, y - 1), u), v) * 0.5 + 0.5;
  }
  return (x, y, oct = 4, lac = 2, gain = 0.5) => { let amp = 1, freq = 1, sv = 0, nr = 0; for (let o = 0; o < oct; o++) { sv += amp * noise(x * freq, y * freq); nr += amp; amp *= gain; freq *= lac; } return sv / nr; };
}

const px = (lng, W) => ((lng + 180) / 360) * W;
const py = (lat, H) => ((90 - lat) / 180) * H;
function ringPath(ctx, ring, W, H) {
  let prev = null;
  for (let i = 0; i < ring.length; i++) { const x = px(ring[i][0], W), y = py(ring[i][1], H);
    if (prev != null && Math.abs(ring[i][0] - prev) > 180) ctx.moveTo(x, y); else if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); prev = ring[i][0]; }
}
function fillGeo(ctx, gj, W, H) {
  for (const f of (gj.features || [])) { const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null; if (!polys) continue;
    ctx.beginPath(); for (const poly of polys) for (const ring of poly) ringPath(ctx, ring, W, H); ctx.fill(); }
}

// biom per piksel: szerokość + wilgotność (m) + relief (r) -> kolor [r,g,b]
function biome(lat, m, r) {
  const a = Math.abs(lat);
  if (a > 66) { const v = 0.80 + r * 0.30; return [196 * v, 206 * v, 215 * v]; } // lód/tundra jasna
  // pas pustynny (Sahara/Arabia/Australia ~14-32°), słabszy 8-14 i 32-40
  let belt = 0;
  if (a >= 14 && a <= 32) belt = 1; else if (a > 32 && a < 40) belt = (40 - a) / 8; else if (a >= 8 && a < 14) belt = (a - 8) / 6;
  const dry = Math.min(1, Math.max(0, belt * (1 - m * 1.55)));
  let veg;
  if (a < 13) veg = [24, 52, 31]; else if (a < 30) veg = [40, 58, 34]; else if (a < 48) veg = [43, 60, 41]; else if (a < 58) veg = [42, 53, 43]; else veg = [70, 74, 64];
  const sand = [122, 101, 63];
  const col = [veg[0] + (sand[0] - veg[0]) * dry, veg[1] + (sand[1] - veg[1]) * dry, veg[2] + (sand[2] - veg[2]) * dry];
  const v = 0.78 + r * 0.40;
  return [col[0] * v, col[1] * v, col[2] * v];
}

export async function buildEarth(W = 2048, H = 1024) {
  let gj = null;
  for (const url of COUNTRY_URLS) {
    try { const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000); const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(to); if (r.ok) { gj = await r.json(); break; } } catch (e) {}
  }

  // maska lądu
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const mk = mask.getContext('2d');
  mk.fillStyle = '#000'; mk.fillRect(0, 0, W, H);
  if (gj) { mk.fillStyle = '#fff'; fillGeo(mk, gj, W, H); }
  const kd = mk.getImageData(0, 0, W, H).data;

  // mapa: ocean gradient
  const map = document.createElement('canvas'); map.width = W; map.height = H; const m = map.getContext('2d');
  const og = m.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, '#05101c'); og.addColorStop(0.35, '#0a2034'); og.addColorStop(0.5, '#0c2740'); og.addColorStop(0.65, '#0a2034'); og.addColorStop(1, '#05101c');
  m.fillStyle = og; m.fillRect(0, 0, W, H);
  const img = m.getImageData(0, 0, W, H); const md = img.data;

  // siatki szumu: wilgotność + relief (taniej niż fBm per piksel)
  const NW = 512, NH = 256; const moist = new Float32Array(NW * NH), relief = new Float32Array(NW * NH);
  const fm = makeNoise(20260615), fr = makeNoise(424242);
  for (let gy = 0; gy < NH; gy++) for (let gx = 0; gx < NW; gx++) { const i = gy * NW + gx; moist[i] = fm(gx / 46, gy / 46, 4); relief[i] = fr(gx / 30, gy / 30, 5, 2.1, 0.55); }

  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180; const gy = (y * NH / H) | 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (kd[i] > 128) { const gi = gy * NW + ((x * NW / W) | 0); const c = biome(lat, moist[gi], relief[gi]); md[i] = c[0]; md[i + 1] = c[1]; md[i + 2] = c[2]; }
      else { const n = (relief[gy * NW + ((x * NW / W) | 0)] - 0.5) * 10; md[i] += n; md[i + 1] += n * 1.1; md[i + 2] += n * 1.3; }
    }
  }
  m.putImageData(img, 0, 0);

  // specular: ocean połysk, ląd matowy
  const spec = document.createElement('canvas'); spec.width = W; spec.height = H; const sp = spec.getContext('2d');
  sp.fillStyle = '#8f9bab'; sp.fillRect(0, 0, W, H); if (gj) { sp.fillStyle = '#12161c'; fillGeo(sp, gj, W, H); }

  // chmury fBm (rzadkie, miękkie)
  const CW = 1024, CH = 512; const clouds = document.createElement('canvas'); clouds.width = CW; clouds.height = CH; const cc = clouds.getContext('2d');
  const ci = cc.createImageData(CW, CH); const cd = ci.data; const cf = makeNoise(7777);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { let v = cf(x / 95, y / 95, 5, 2.1, 0.55); v = Math.max(0, (v - 0.54) / 0.46); const a = Math.pow(v, 1.5) * 225; const i = (y * CW + x) * 4; cd[i] = cd[i + 1] = cd[i + 2] = 240; cd[i + 3] = a; }
  cc.putImageData(ci, 0, 0);

  const mkT = (cv, aniso = 8) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = aniso; t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { mapTex: mkT(map), specTex: mkT(spec, 2), cloudTex: mkT(clouds), hasGeo: !!gj, geojson: gj };
}

export default buildEarth;
