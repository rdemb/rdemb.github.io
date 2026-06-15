/*
  D-LOGIC ATLAS — globus (globe.js)  [wersja 2: realistyczna Ziemia]
  =================================================================
  Recznie zbudowany globus 3D na ZWENDOROWANYM three.js 0.160 (offline).
  - proceduralna Ziemia (earth.js): tekstura dzienna + specular oceanow + chmury,
    swiatlo-slonce => terminator dzien/noc, emissive lift => widoczny lad noca,
  - emoji-markery per wezel z poswiata w kolorze kategorii + LOD (zoom),
  - kontury 50m, atmosfera fresnel, gwiazdy, bloom,
  - KLIK/PRZECIAGNIECIE zatrzymuje auto-rotacje; toggle ▶/⏸; dbl-klik = reset.
  Import 'three' rozwiazuje import map strony. Tekstury wyrownane do latLngToVec3.
*/
import * as THREE from 'three';
import { buildEarth } from './earth.js';

const DEG = Math.PI / 180;
const R = 100;
const LOD_NEAR = 350;                     // camDist < => pokazuj emoji (inaczej kropki)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function latLngToVec3(lat, lng, r = R) {
  const phi = (90 - lat) * DEG, theta = (lng + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const ATM_VERT = `varying vec3 vNormal;
void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ATM_FRAG = `varying vec3 vNormal; uniform vec3 c;
void main(){ float i = pow(0.70 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c,1.0) * clamp(i,0.0,1.0); }`;

// --- cache tekstur emoji / poswiaty (wspoldzielone) ---
const _emojiCache = {};
function emojiTexture(emoji, size = 128) {
  if (_emojiCache[emoji]) return _emojiCache[emoji];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.font = `${Math.floor(size * 0.74)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, size / 2, size * 0.54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (_emojiCache[emoji] = t);
}
let _haloTex = null;
function haloTexture() {
  if (_haloTex) return _haloTex;
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d'); const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  return (_haloTex = new THREE.CanvasTexture(c));
}

export class Globe {
  constructor(canvas) {
    this.canvas = canvas;
    this.onHover = null; this.onSelect = null; this.onRotateChange = null;
    this.autoRotate = true;
    this._rot = { x: 0.22, y: -0.6 }; this._vel = { x: 0, y: 0 }; this._target = null;
    this._drag = null; this._moved = 0;
    this.nodeItems = []; this.chokeItems = []; this.bankItems = [];
    this.colorMode = 'category'; this._catFilter = null; this._selId = null;
    this._halos = []; this._glyphs = []; this._pick = []; this._lodNear = true; this._cloudDrift = 0;
  }

  init() {
    const c = this.canvas;
    const w = c.clientWidth || c.parentElement.clientWidth || 800;
    const h = c.clientHeight || c.parentElement.clientHeight || 600;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, w / h, 1, 6000);
    this.camera.position.set(0, 0, 300);
    this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // swiatlo: slonce (kierunkowe, stale w scenie => terminator wedruje przy obrocie) + ambient
    this._sun = new THREE.DirectionalLight(0xfff4e2, 1.25); this._sun.position.set(-220, 90, 160); this.scene.add(this._sun);
    this.scene.add(new THREE.AmbientLight(0x32445a, 0.34));
    this.scene.add(new THREE.HemisphereLight(0x2a3c4e, 0x05070a, 0.22));

    this.world = new THREE.Group(); this.scene.add(this.world);

    // rdzen Ziemi (na razie ciemny ocean; tekstury doleca z buildEarth)
    this._earthMat = new THREE.MeshPhongMaterial({ color: 0x0a1a2c, specular: 0x2a4a66, shininess: 16, emissive: 0x0a141f, emissiveIntensity: 0.45 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), this._earthMat); this.world.add(core);

    // chmury (osobna grupa => dryf wzgledem globu)
    this._cloudMat = new THREE.MeshPhongMaterial({ color: 0xe6edf6, transparent: true, opacity: 0.0, depthWrite: false, specular: 0x000000 });
    this._clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), this._cloudMat);
    this._cloudGroup = new THREE.Group(); this._cloudGroup.add(this._clouds); this.scene.add(this._cloudGroup);

    // atmosfera (niebieski rim = realizm)
    const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 64, 48), new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0x3f86c4) } }, vertexShader: ATM_VERT, fragmentShader: ATM_FRAG,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
    }));
    this.scene.add(atm);

    this._addStars();
    this.layers = { nodes: new THREE.Group(), choke: new THREE.Group(), bank: new THREE.Group(), arcs: new THREE.Group(), coast: new THREE.Group() };
    for (const k in this.layers) this.world.add(this.layers[k]);

    this._raycaster = new THREE.Raycaster(); this._pointer = new THREE.Vector2(-2, -2);
    this._bindInput();
    buildEarth().then((tex) => this._applyEarth(tex)).catch(() => {});
    this._animate(); window.addEventListener('resize', () => this.resize());
    return this;
  }

  _applyEarth(tex) {
    if (!tex || !tex.hasGeo) return;
    this._earthMat.map = tex.mapTex; this._earthMat.specularMap = tex.specTex;
    // emissive BIAŁE i słabe (0.13) — utrzymuje barwę lądu noca, NIE wypłukuje jej na szaro
    this._earthMat.emissiveMap = tex.mapTex; this._earthMat.emissive = new THREE.Color(0xffffff); this._earthMat.emissiveIntensity = 0.13;
    this._earthMat.specular = new THREE.Color(0x1e303d); this._earthMat.shininess = 11;
    this._earthMat.color = new THREE.Color(0xffffff); this._earthMat.needsUpdate = true;
    this._cloudMat.alphaMap = tex.cloudTex; this._cloudMat.opacity = 0.5; this._cloudMat.needsUpdate = true;
    if (tex.geojson) this._buildOutlines(tex.geojson);  // kontury z TEGO SAMEGO źródła = idealne wyrównanie
  }

  _addStars() {
    const n = 1800, arr = []; let s = 9301;
    const rnd = () => { s = (s * 233280 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = 1900 + rnd() * 1600, k = Math.sqrt(1 - u * u); arr.push(r * k * Math.cos(t), r * u, r * k * Math.sin(t)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x55607a, size: 1.7, sizeAttenuation: false })));
  }

  // kontury + granice z TEGO SAMEGO geojson co tekstura (110m) => idealne wyrownanie (koniec rozjazdu)
  _buildOutlines(gj) {
    const seg = [];
    const addRing = (ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        if (Math.abs(ring[i][0] - ring[i + 1][0]) > 180) continue;           // pomin antymerydian
        const a = latLngToVec3(ring[i][1], ring[i][0], R * 1.0045);
        const b = latLngToVec3(ring[i + 1][1], ring[i + 1][0], R * 1.0045);
        seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    };
    for (const f of (gj.features || [])) { const g = f.geometry; if (!g) continue; const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; for (const poly of polys) for (const ring of poly) addRing(ring); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    this.layers.coast.clear();
    this.layers.coast.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x8fb0c2, transparent: true, opacity: 0.3 })));
  }

  // ---- markery: emoji + poswiata ----
  setData({ nodes, chokepoints, banks }) {
    this.nodeItems = nodes; this.chokeItems = chokepoints; this.bankItems = banks;
    this.layers.nodes.clear(); this.layers.choke.clear(); this.layers.bank.clear();
    this._halos = []; this._glyphs = []; this._pick = [];
    const halo = haloTexture();
    const addMarker = (item, group, r, glyphScale, haloColor, isNode) => {
      const pos = latLngToVec3(item.lat, item.lng, r); item._pos = pos;
      const hMat = new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(haloColor), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 });
      const hSpr = new THREE.Sprite(hMat); hSpr.position.copy(pos); hSpr.userData.item = item; hSpr.userData.kind = isNode ? 'node' : (group === this.layers.choke ? 'choke' : 'bank');
      const gMat = new THREE.SpriteMaterial({ map: emojiTexture(item.icon || '•'), transparent: true, depthWrite: false });
      const gSpr = new THREE.Sprite(gMat); gSpr.position.copy(pos);
      item._base = glyphScale; item._halo = hSpr; item._glyph = gSpr;
      group.add(hSpr); group.add(gSpr);
      this._pick.push(hSpr);
      if (isNode) { this._halos.push(hSpr); this._glyphs.push(gSpr); }
      else { this._halos.push(hSpr); this._glyphs.push(gSpr); }
    };
    for (const n of nodes) addMarker(n, this.layers.nodes, R * 1.02, 2.6 + Math.sqrt(n.share_pct || 0) * 1.05, n.color || '#E0E3E8', true);
    for (const cp of chokepoints) { cp.icon = '⚠️'; addMarker(cp, this.layers.choke, R * 1.03, 5.2, '#E8675A', false); }
    for (const b of banks) { b.icon = '🏛️'; addMarker(b, this.layers.bank, R * 1.03, 4.6, '#9BD17A', false); }
    this._applyLOD(true);
  }

  _applyLOD(force) {
    const near = this.camera.position.length() < LOD_NEAR;
    if (!force && near === this._lodNear) return;
    this._lodNear = near;
    const setOne = (item, on) => {
      const sel = this._selId && item.id === this._selId;
      const hs = (item._base) * (sel ? 1.95 : 1) * 1.3;
      const gs = (item._base) * (sel ? 1.95 : 1);
      item._halo.visible = on; item._halo.scale.set(hs, hs, 1);
      item._glyph.visible = on && (near || sel); item._glyph.scale.set(gs, gs, 1);
    };
    for (const n of this.nodeItems) setOne(n, !this._catFilter || this._catFilter.has(n.cat));
    for (const cp of this.chokeItems) setOne(cp, this.layers.choke.visible);
    for (const b of this.bankItems) setOne(b, this.layers.bank.visible);
  }

  setLayerVisible(key, v) { if (this.layers[key]) this.layers[key].visible = v; if (key === 'choke' || key === 'bank') this._applyLOD(true); }
  setCategoryFilter(set) { this._catFilter = set; this._applyLOD(true); }
  setColorMode(mode) {
    this.colorMode = mode;
    for (const n of this.nodeItems) n._halo.material.color.set(mode === 'fragility' ? (n.fragColor || n.color) : n.color);
  }
  highlight(id) { this._selId = id; this._applyLOD(true); }

  // ---- luki kaskady ----
  drawArcs(arcs) {
    this.clearArcs();
    for (const a of arcs) {
      const p0 = latLngToVec3(a.from.lat, a.from.lng, R * 1.02), p2 = latLngToVec3(a.to.lat, a.to.lng, R * 1.02);
      const dist = p0.distanceTo(p2);
      const mid = p0.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.03 + dist / R * 0.3));
      const pts = new THREE.QuadraticBezierCurve3(p0, mid, p2).getPoints(50);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(a.color || '#E8B23A'), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
      g.setDrawRange(0, 0); line.userData = { n: pts.length, t: 0 }; this.layers.arcs.add(line);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.color || '#E8B23A') }));
      dot.position.copy(p2); this.layers.arcs.add(dot);
    }
  }
  clearArcs() { const g = this.layers.arcs; while (g.children.length) { const o = g.children.pop(); o.geometry?.dispose(); o.material?.dispose(); } }

  // ---- rotacja: stop na interakcji ----
  setAutoRotate(v) { this.autoRotate = v; if (this.onRotateChange) this.onRotateChange(v); }
  toggleRotate() { this.setAutoRotate(!this.autoRotate); }

  _bindInput() {
    const el = this.renderer.domElement; el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => { this._drag = { x: e.clientX, y: e.clientY }; this._moved = 0; this._target = null; this.setAutoRotate(false); el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this._pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (this._drag) { const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y; this._moved += Math.abs(dx) + Math.abs(dy); this._rot.y += dx * 0.005; this._rot.x = clamp(this._rot.x + dy * 0.005, -1.3, 1.3); this._vel.y = dx * 0.005; this._vel.x = dy * 0.005; this._drag = { x: e.clientX, y: e.clientY }; }
    });
    el.addEventListener('pointerup', () => { if (this._drag && this._moved < 6) this._click(); this._drag = null; });
    el.addEventListener('pointerleave', () => { this._drag = null; this._pointer.set(-2, -2); });
    el.addEventListener('dblclick', () => { this._target = { x: 0.22, y: this._rot.y }; this.setAutoRotate(true); });
    el.addEventListener('wheel', (e) => { e.preventDefault(); const d = this.camera.position.length() * (1 + Math.sign(e.deltaY) * 0.08); this.camera.position.setLength(clamp(d, 135, 520)); this._applyLOD(); }, { passive: false });
  }

  _pickHit() {
    this._raycaster.setFromCamera(this._pointer, this.camera);
    this._raycaster.params.Sprite = { threshold: 0 };
    let best = null;
    for (const spr of this._pick) {
      if (!spr.visible) continue;
      const it = spr.userData.item;
      if (spr.userData.kind === 'node' && this._catFilter && !this._catFilter.has(it.cat)) continue;
      const hit = this._raycaster.intersectObject(spr, false);
      if (hit.length && (!best || hit[0].distance < best.dist)) best = { type: spr.userData.kind, item: it, dist: hit[0].distance };
    }
    return best;
  }
  _click() { const p = this._pickHit(); if (this.onSelect) this.onSelect(p); }

  focus(lat, lng) { this._target = { x: clamp(lat * DEG, -1.2, 1.2), y: -(lng + 180) * DEG + Math.PI }; this.setAutoRotate(false); }
  resize() { const c = this.canvas, w = c.parentElement.clientWidth, h = c.parentElement.clientHeight; if (!w || !h) return; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false); }

  _animate() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      if (this._target) {
        this._rot.y += (this._target.y - this._rot.y) * 0.08; this._rot.x += (this._target.x - this._rot.x) * 0.08;
        if (Math.abs(this._target.y - this._rot.y) < 0.002 && Math.abs(this._target.x - this._rot.x) < 0.002) this._target = null;
      } else if (!this._drag) {
        this._rot.y += this._vel.y; this._rot.x = clamp(this._rot.x + this._vel.x, -1.3, 1.3); this._vel.x *= 0.92; this._vel.y *= 0.92;
        if (this.autoRotate && Math.abs(this._vel.y) < 0.0006) this._rot.y += 0.0008;
      }
      this.world.rotation.set(this._rot.x, this._rot.y, 0);
      this._cloudDrift += 0.0003; this._cloudGroup.rotation.set(this._rot.x, this._rot.y + this._cloudDrift, 0);
      for (const o of this.layers.arcs.children) if (o.userData && o.userData.n) { o.userData.t = Math.min(o.userData.n, o.userData.t + 1.7); o.geometry.setDrawRange(0, Math.floor(o.userData.t)); }
      if (!this._drag) { const p = this._pickHit(); const id = p ? (p.item.id || p.item.code) : -1; if (id !== this._hoverId) { this._hoverId = id; if (this.onHover) this.onHover(p); this.canvas.style.cursor = p ? 'pointer' : 'grab'; } }
      if (this._composer) this._composer.render(); else this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  async enableBloom() {
    try {
      const base = '/vendor/three-0.160/examples/jsm/postprocessing/';
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import(base + 'EffectComposer.js'), import(base + 'RenderPass.js'), import(base + 'UnrealBloomPass.js'), import(base + 'OutputPass.js')]);
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      const comp = new EffectComposer(this.renderer);
      comp.addPass(new RenderPass(this.scene, this.camera));
      comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.5, 0.32));
      comp.addPass(new OutputPass());
      this._composer = comp;
      window.addEventListener('resize', () => comp.setSize(this.canvas.clientWidth, this.canvas.clientHeight));
      return true;
    } catch (e) { return false; }
  }
}
export default Globe;
