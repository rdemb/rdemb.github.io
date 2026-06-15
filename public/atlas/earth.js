/*
  D-LOGIC ATLAS — Ziemia v3 (earth.js)
  ====================================
  Realne mapy Ziemi (klasyczny zestaw three.js, zwendorowany do /atlas/textures/):
  dzienna barwa (atmos), połysk oceanów (specular), relief (normal), chmury.
  Równoodległościowe 2048×1024 — wyrównane do latLngToVec3 (u=(lng+180)/360,
  v=(90-lat)/180), zweryfikowane na siatce SphereGeometry. Geojson granic dociągany
  osobno (globus rysuje z niego subtelne kontury). Zero generowania per-piksel.
*/
import * as THREE from 'three';

const TEX = '/atlas/textures/';
const COUNTRY_URLS = [
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson',
  'https://cdn.jsdelivr.net/npm/world-geojson@1.1.0/countries.geo.json',
];

function loadTex(url, srgb) {
  return new Promise((res) => {
    new THREE.TextureLoader().load(
      url,
      (t) => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; res(t); },
      undefined,
      () => res(null),
    );
  });
}

async function loadGeo() {
  for (const url of COUNTRY_URLS) {
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(to);
      if (r.ok) return await r.json();
    } catch (e) {}
  }
  return null;
}

export async function buildEarth() {
  const [dayTex, specTex, normalTex, cloudTex, geojson] = await Promise.all([
    loadTex(TEX + 'earth_atmos_2048.jpg', true),
    loadTex(TEX + 'earth_specular_2048.jpg', false),
    loadTex(TEX + 'earth_normal_2048.jpg', false),
    loadTex(TEX + 'earth_clouds_1024.png', true),
    loadGeo(),
  ]);
  return { dayTex, specTex, normalTex, cloudTex, geojson, ok: !!dayTex };
}

export default buildEarth;
