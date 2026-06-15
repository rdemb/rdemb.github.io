/*
  D-LOGIC ATLAS — proceduralna Ziemia (earth.js)
  ==============================================
  Buduje tekstury Ziemi na canvasie z GeoJSON granic panstw (jsdelivr, CORS).
  Rownoodleglosciowa projekcja wyrownana DOKLADNIE do latLngToVec3 globusa:
    x_px = (lng+180)/360 * W ,  y_px = (90-lat)/180 * H
  co odpowiada UV sfery three.js (u=(lng+180)/360, v=(90-lat)/180, flipY).
  Zwraca: mapa dzienna, mapa specular (polysk oceanow), mapa chmur (fBm).
  Wszystko offline-procedurane (poza jednorazowym GeoJSON; bez niego = czysty ocean+siatka).
*/
import * as THREE from 'three';

const COUNTRY_URLS = [
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson',
  'https://cdn.jsdelivr.net/npm/world-geojson@1.1.0/countries.geo.json',
];

// --- proste, deterministyczne value-noise + fBm (do chmur i ziarna ladu) ---
function makeNoise(seed) {
  const p = new Uint8Array(512);
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1 ? -x : x) + (h & 2 ? -y : y));
  function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = p[X] + Y, b = p[X + 1] + Y;
    return lerp(lerp(grad(p[a], x, y), grad(p[b], x - 1, y), u),
      lerp(grad(p[a + 1], x, y - 1), grad(p[b + 1], x - 1, y - 1), u), v) * 0.5 + 0.5;
  }
  return (x, y, oct = 4, lac = 2, gain = 0.5) => {
    let amp = 1, freq = 1, sumv = 0, norm = 0;
    for (let o = 0; o < oct; o++) { sumv += amp * noise(x * freq, y * freq); norm += amp; amp *= gain; freq *= lac; }
    return sumv / norm;
  };
}

const px = (lng, W) => ((lng + 180) / 360) * W;
const py = (lat, H) => ((90 - lat) / 180) * H;

// tonacja ladu wg szerokosci geograficznej (ciemna, „command-center", realistyczna)
function landTone(lat, j) {
  const a = Math.abs(lat);
  let base;
  if (a > 62) base = [205, 214, 222];                 // lod / Antarktyda / Grenlandia
  else if (a > 48) base = [34, 42, 40];               // tajga/chlod
  else if (a > 34) base = [44, 46, 33];               // umiarkowany / oliwka
  else if (a > 20) base = [54, 48, 33];               // pas pustyn / khaki
  else base = [28, 44, 33];                            // tropik / zielen
  const k = (j - 0.5) * 14;                            // subtelny jitter per polygon
  return `rgb(${base[0] + k | 0},${base[1] + k | 0},${base[2] + k | 0})`;
}

function ringPath(ctx, ring, W, H) {
  let prev = null;
  for (let i = 0; i < ring.length; i++) {
    const x = px(ring[i][0], W), y = py(ring[i][1], H);
    if (prev && Math.abs(ring[i][0] - prev) > 180) ctx.moveTo(x, y);   // przerwij na antymerydianie
    else if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    prev = ring[i][0];
  }
}

export async function buildEarth(W = 4096, H = 2048) {
  let gj = null;
  for (const url of COUNTRY_URLS) {
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(to);
      if (r.ok) { gj = await r.json(); break; }
    } catch (e) { /* offline */ }
  }

  // ---- MAPA DZIENNA ----
  const map = document.createElement('canvas'); map.width = W; map.height = H;
  const m = map.getContext('2d');
  // ocean: gradient glebi (bieguny ciemniejsze) + delikatne pasy
  const og = m.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, '#05101c'); og.addColorStop(0.5, '#0a1e33'); og.addColorStop(1, '#05101c');
  m.fillStyle = og; m.fillRect(0, 0, W, H);
  const fbm = makeNoise(1337);
  // subtelna faktura oceanu
  const oimg = m.getImageData(0, 0, W, H); const od = oimg.data;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 2) {
    const n = fbm(x / 260, y / 260, 3) - 0.5; const i = (y * W + x) * 4;
    od[i] += n * 8; od[i + 1] += n * 10; od[i + 2] += n * 14;
    od[i + 4] = od[i]; od[i + 5] = od[i + 1]; od[i + 6] = od[i + 2];
  }
  m.putImageData(oimg, 0, 0);

  // ---- SPECULAR (ocean jasny = polysk, lad ciemny) ----
  const spec = document.createElement('canvas'); spec.width = W; spec.height = H;
  const sp = spec.getContext('2d');
  sp.fillStyle = '#9aa6b4'; sp.fillRect(0, 0, W, H);   // ocean polyskliwy

  const drawPolys = (geom, fillEach, idx) => {
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : null;
    if (!polys) return;
    for (const poly of polys) {
      // lad na mapie
      m.beginPath(); for (const ring of poly) ringPath(m, ring, W, H); m.closePath();
      const lat = poly[0] && poly[0][0] ? poly[0][0][1] : 0;
      m.fillStyle = fillEach(lat, ((idx * 2654435761) % 1000) / 1000); m.fill();
      m.lineWidth = 1.1; m.strokeStyle = 'rgba(232,178,58,0.16)'; m.stroke();   // granice (subtelny amber)
      // lad na specular (ciemny = matowy)
      sp.beginPath(); for (const ring of poly) ringPath(sp, ring, W, H); sp.closePath();
      sp.fillStyle = '#171c22'; sp.fill();
    }
  };

  if (gj && gj.features) {
    gj.features.forEach((f, idx) => { if (f.geometry) drawPolys(f.geometry, landTone, idx); });
  }

  // graticule (po wszystkim, delikatne)
  m.strokeStyle = 'rgba(150,170,190,0.07)'; m.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) { m.beginPath(); m.moveTo(0, py(lat, H)); m.lineTo(W, py(lat, H)); m.stroke(); }
  for (let lng = -150; lng <= 150; lng += 30) { m.beginPath(); m.moveTo(px(lng, W), 0); m.lineTo(px(lng, W), H); m.stroke(); }

  // ---- CHMURY (fBm, rzadkie, miekkie) ----
  const CW = 2048, CH = 1024;
  const clouds = document.createElement('canvas'); clouds.width = CW; clouds.height = CH;
  const cc = clouds.getContext('2d');
  const cimg = cc.createImageData(CW, CH); const cd = cimg.data;
  const cf = makeNoise(7777);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    let v = cf(x / 200, y / 200, 5, 2.1, 0.55);
    v = Math.max(0, (v - 0.52) / 0.48);                 // prog: rzadkie chmury
    const a = Math.pow(v, 1.4) * 235;
    const i = (y * CW + x) * 4; cd[i] = cd[i + 1] = cd[i + 2] = 240; cd[i + 3] = a;
  }
  cc.putImageData(cimg, 0, 0);

  const mk = (cv, aniso = true) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = aniso ? 8 : 1; t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { mapTex: mk(map), specTex: mk(spec, false), cloudTex: mk(clouds), hasGeo: !!(gj && gj.features) };
}

export default buildEarth;
