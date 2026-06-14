/*
  D-LOGIC ATLAS — globus (globe.js)
  =================================
  Recznie zbudowany globus 3D na ZWENDOROWANYM three.js 0.160 (zero CDN).
  Atmosfera fresnel, instancjonowane punkty (zloza/chokepointy/banki),
  luki wielkokolowe (kaskada), rotacja z bezwladnoscia, opcjonalny bloom.
  Kontury kontynentow doczytywane progresywnie (gdy jest siec) — fallback: siatka.

  Import 'three' rozwiazuje import map w stronie atlas.astro:
    { "three": "/vendor/three-0.160/build/three.module.js" }
*/
import * as THREE from 'three';

const DEG = Math.PI / 180;
const R = 100;                          // promien globusa
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// lat/lng -> punkt na sferze (konwencja three-globe)
export function latLngToVec3(lat, lng, r = R) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

const ATM_VERT = `varying vec3 vNormal;
void main(){ vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ATM_FRAG = `varying vec3 vNormal; uniform vec3 c;
void main(){ float i = pow(0.72 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.0);
  gl_FragColor = vec4(c, 1.0) * clamp(i, 0.0, 1.0); }`;

export class Globe {
  constructor(canvas) {
    this.canvas = canvas;
    this.onHover = null; this.onSelect = null;
    this.autoRotate = true;
    this._rot = { x: 0.18, y: -0.6 };       // pochylenie + obrot
    this._vel = { x: 0, y: 0 };
    this._drag = null; this._moved = 0;
    this.nodeItems = []; this.chokeItems = []; this.bankItems = [];
    this.colorMode = 'category';
    this._catFilter = null;                  // null = wszystko widoczne
    this._raf = null; this._hoverId = -1;
  }

  init() {
    const c = this.canvas;
    const w = c.clientWidth || c.parentElement.clientWidth || 800;
    const h = c.clientHeight || c.parentElement.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 1, 4000);
    this.camera.position.set(0, 0, 320);
    this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);

    this.world = new THREE.Group();           // grupa obracana
    this.scene.add(this.world);

    // --- rdzen globusa ---
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x0b0e14 }),
    );
    this.world.add(core);

    // delikatna sfera „oceanu" z fresnelem od wewnatrz (subtelny rim)
    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.001, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: { c: { value: new THREE.Color(0x1b3a4a) } },
        vertexShader: ATM_VERT, fragmentShader: ATM_FRAG,
        blending: THREE.AdditiveBlending, side: THREE.FrontSide, transparent: true, depthWrite: false,
      }),
    );
    this.world.add(innerGlow);

    // --- atmosfera (halo) ---
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: { c: { value: new THREE.Color(0xE8B23A) } },
        vertexShader: ATM_VERT, fragmentShader: ATM_FRAG,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
      }),
    );
    this.scene.add(atm); this._atm = atm;

    this._addGraticule();
    this._addStars();

    this.layers = { nodes: new THREE.Group(), choke: new THREE.Group(), bank: new THREE.Group(), arcs: new THREE.Group(), coast: new THREE.Group() };
    for (const k in this.layers) this.world.add(this.layers[k]);

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2(-2, -2);
    this._bindInput();
    this._loadCoastline();           // progresywne kontury (gdy jest siec)
    this._animate();
    window.addEventListener('resize', () => this.resize());
    return this;
  }

  _addGraticule() {
    const pts = [];
    const push = (a, b) => { pts.push(a.x, a.y, a.z, b.x, b.y, b.z); };
    for (let lat = -80; lat <= 80; lat += 20) {
      let prev = latLngToVec3(lat, -180, R * 1.001);
      for (let lng = -170; lng <= 180; lng += 10) { const p = latLngToVec3(lat, lng, R * 1.001); push(prev, p); prev = p; }
    }
    for (let lng = -180; lng < 180; lng += 20) {
      let prev = latLngToVec3(-90, lng, R * 1.001);
      for (let lat = -80; lat <= 90; lat += 10) { const p = latLngToVec3(lat, lng, R * 1.001); push(prev, p); prev = p; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.world.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x2a3340, transparent: true, opacity: 0.5 })));
  }

  _addStars() {
    const n = 1400, arr = [];
    let s = 9301;
    const rnd = () => { s = (s * 233280 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = 1600 + rnd() * 1200;
      const k = Math.sqrt(1 - u * u);
      arr.push(r * k * Math.cos(t), r * u, r * k * Math.sin(t));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x4a5160, size: 2, sizeAttenuation: false })));
  }

  async _loadCoastline() {
    const urls = [
      'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_coastline.geojson',
      'https://unpkg.com/visionscarto-world-atlas@0.1.0/world/110m_coastline.geojson',
    ];
    for (const url of urls) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 7000);
        const r = await fetch(url, { signal: ctrl.signal });
        clearTimeout(to);
        if (!r.ok) continue;
        const gj = await r.json();
        this._buildCoast(gj); return;
      } catch (e) { /* offline -> zostaje siatka */ }
    }
  }

  _buildCoast(gj) {
    const seg = [];
    const addLine = (coords) => {
      for (let i = 0; i < coords.length - 1; i++) {
        const a = latLngToVec3(coords[i][1], coords[i][0], R * 1.003);
        const b = latLngToVec3(coords[i + 1][1], coords[i + 1][0], R * 1.003);
        seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    };
    const feats = gj.features || (gj.type === 'FeatureCollection' ? gj.features : [gj]);
    for (const f of feats) {
      const gm = f.geometry || f; if (!gm) continue;
      if (gm.type === 'LineString') addLine(gm.coordinates);
      else if (gm.type === 'MultiLineString') gm.coordinates.forEach(addLine);
      else if (gm.type === 'Polygon') gm.coordinates.forEach(addLine);
      else if (gm.type === 'MultiPolygon') gm.coordinates.forEach((p) => p.forEach(addLine));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    this.layers.coast.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x3c6b78, transparent: true, opacity: 0.85 })));
  }

  // ---- dane: budowa instancjonowanych warstw ----
  setData({ nodes, chokepoints, banks }) {
    this.nodeItems = nodes; this.chokeItems = chokepoints; this.bankItems = banks;
    this._buildNodes();
    this._buildChoke();
    this._buildBanks();
  }

  _buildNodes() {
    const items = this.nodeItems;
    const geo = new THREE.SphereGeometry(1, 10, 8);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      const p = latLngToVec3(it.lat, it.lng, R * 1.012);
      it._pos = p;
      dummy.position.copy(p);
      dummy.scale.setScalar(it._size = 0.8 + Math.sqrt(it.share_pct || 0) * 0.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.set(it.color || '#E0E3E8'); mesh.setColorAt(i, col);
    });
    mesh.instanceColor.needsUpdate = true;
    this.layers.nodes.clear(); this.layers.nodes.add(mesh); this._nodeMesh = mesh; this._nodeDummy = dummy;
  }

  _buildChoke() {
    const items = this.chokeItems;
    const geo = new THREE.OctahedronGeometry(2.4, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xE8675A, transparent: true, opacity: 0.95 });
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    const dummy = new THREE.Object3D();
    items.forEach((it, i) => {
      const p = latLngToVec3(it.lat, it.lng, R * 1.02); it._pos = p;
      dummy.position.copy(p); dummy.scale.setScalar(1); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    this.layers.choke.clear(); this.layers.choke.add(mesh); this._chokeMesh = mesh;
  }

  _buildBanks() {
    const items = this.bankItems;
    const geo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9BD17A, transparent: true, opacity: 0.9 });
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    const dummy = new THREE.Object3D();
    items.forEach((it, i) => {
      const p = latLngToVec3(it.lat, it.lng, R * 1.02); it._pos = p;
      dummy.position.copy(p);
      dummy.lookAt(p.clone().multiplyScalar(2)); dummy.scale.setScalar(1); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    this.layers.bank.clear(); this.layers.bank.add(mesh); this._bankMesh = mesh;
  }

  // pokaz/ukryj warstwe
  setLayerVisible(key, v) { if (this.layers[key]) this.layers[key].visible = v; }

  // filtr kategorii zloz (Set ids kategorii lub null=wszystko)
  setCategoryFilter(set) {
    this._catFilter = set;
    if (!this._nodeMesh) return;
    const d = this._nodeDummy;
    this.nodeItems.forEach((it, i) => {
      const on = !set || set.has(it.cat);
      d.position.copy(it._pos);
      d.scale.setScalar(on ? (this._selId === it.id ? it._size * 2.1 : it._size) : 0.0001);
      d.updateMatrix(); this._nodeMesh.setMatrixAt(i, d.matrix);
    });
    this._nodeMesh.instanceMatrix.needsUpdate = true;
  }

  // tryb koloru: 'category' | 'fragility' (kazdy node ma it.color i it.fragColor)
  setColorMode(mode) {
    this.colorMode = mode;
    if (!this._nodeMesh) return;
    const col = new THREE.Color();
    this.nodeItems.forEach((it, i) => {
      col.set(mode === 'fragility' ? (it.fragColor || it.color) : it.color);
      this._nodeMesh.setColorAt(i, col);
    });
    this._nodeMesh.instanceColor.needsUpdate = true;
  }

  highlight(id) {
    this._selId = id;
    this.setCategoryFilter(this._catFilter); // przelicza skale (wybrany powiekszony)
  }

  // ---- luki kaskady ----
  drawArcs(arcs) {
    this.clearArcs();
    for (const a of arcs) {
      const p0 = latLngToVec3(a.from.lat, a.from.lng, R * 1.013);
      const p2 = latLngToVec3(a.to.lat, a.to.lng, R * 1.013);
      const dist = p0.distanceTo(p2);
      const mid = p0.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.02 + dist / R * 0.28));
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
      const pts = curve.getPoints(48);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: new THREE.Color(a.color || '#E8B23A'), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
      const line = new THREE.Line(g, m);
      g.setDrawRange(0, 0); line.userData.n = pts.length; line.userData.t = 0;
      this.layers.arcs.add(line);
      // pulsujacy punkt celu
      const dot = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.color || '#E8B23A') }));
      dot.position.copy(p2); this.layers.arcs.add(dot);
    }
  }
  clearArcs() {
    const g = this.layers.arcs;
    while (g.children.length) { const o = g.children.pop(); o.geometry?.dispose(); o.material?.dispose(); }
  }

  // ---- interakcja ----
  _bindInput() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => { this._drag = { x: e.clientX, y: e.clientY }; this._moved = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this._pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (this._drag) {
        const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y;
        this._moved += Math.abs(dx) + Math.abs(dy);
        this._rot.y += dx * 0.005; this._rot.x = clamp(this._rot.x + dy * 0.005, -1.3, 1.3);
        this._vel.y = dx * 0.005; this._vel.x = dy * 0.005;
        this._drag = { x: e.clientX, y: e.clientY };
      }
    });
    const up = (e) => {
      if (this._drag && this._moved < 6) this._click();
      this._drag = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', () => { this._drag = null; this._pointer.set(-2, -2); });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const d = this.camera.position.length() * (1 + Math.sign(e.deltaY) * 0.08);
      this.camera.position.setLength(clamp(d, 150, 600));
    }, { passive: false });
  }

  _pick() {
    if (!this._nodeMesh) return null;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const targets = [];
    if (this.layers.choke.visible && this._chokeMesh) targets.push(['choke', this._chokeMesh, this.chokeItems]);
    if (this.layers.bank.visible && this._bankMesh) targets.push(['bank', this._bankMesh, this.bankItems]);
    if (this.layers.nodes.visible && this._nodeMesh) targets.push(['node', this._nodeMesh, this.nodeItems]);
    let best = null;
    for (const [type, mesh, items] of targets) {
      const hit = this._raycaster.intersectObject(mesh, false);
      for (const h of hit) {
        const it = items[h.instanceId];
        if (type === 'node' && this._catFilter && !this._catFilter.has(it.cat)) continue;
        if (!best || h.distance < best.dist) best = { type, item: it, dist: h.distance };
        break;
      }
    }
    return best;
  }

  _click() { const p = this._pick(); if (this.onSelect) this.onSelect(p); }

  focus(lat, lng) {
    this._rot.x = clamp(lat * DEG, -1.3, 1.3);
    this._rot.y = -(lng + 180) * DEG + Math.PI;
    this.autoRotate = false;
  }

  resize() {
    const c = this.canvas, w = c.parentElement.clientWidth, h = c.parentElement.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _animate() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      // inercja + auto-rotacja
      if (!this._drag) {
        this._rot.y += this._vel.y; this._rot.x = clamp(this._rot.x + this._vel.x, -1.3, 1.3);
        this._vel.x *= 0.92; this._vel.y *= 0.92;
        if (this.autoRotate && Math.abs(this._vel.y) < 0.0006) this._rot.y += 0.0009;
      }
      this.world.rotation.y = this._rot.y; this.world.rotation.x = this._rot.x;
      // animacja rysowania lukow
      for (const o of this.layers.arcs.children) {
        if (o.userData && o.userData.n) { o.userData.t = Math.min(o.userData.n, o.userData.t + 1.6); o.geometry.setDrawRange(0, Math.floor(o.userData.t)); }
      }
      // hover (gdy nie ciagniemy)
      if (!this._drag) {
        const p = this._pick();
        const id = p ? (p.item.id || p.item.code) : -1;
        if (id !== this._hoverId) { this._hoverId = id; if (this.onHover) this.onHover(p); this.canvas.style.cursor = p ? 'pointer' : 'grab'; }
      }
      if (this._composer) this._composer.render();
      else this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  // opcjonalny bloom (progresywnie; gdy sie nie zlada — renderujemy bez)
  async enableBloom() {
    try {
      const base = '/vendor/three-0.160/examples/jsm/postprocessing/';
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import(base + 'EffectComposer.js'), import(base + 'RenderPass.js'),
        import(base + 'UnrealBloomPass.js'), import(base + 'OutputPass.js'),
      ]);
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      const comp = new EffectComposer(this.renderer);
      comp.addPass(new RenderPass(this.scene, this.camera));
      comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.6, 0.2));
      comp.addPass(new OutputPass());
      this._composer = comp;     // petla renderu uzyje kompozytora zamiast renderer.render
      window.addEventListener('resize', () => comp.setSize(this.canvas.clientWidth, this.canvas.clientHeight));
      return true;
    } catch (e) { return false; }
  }
}

export default Globe;
