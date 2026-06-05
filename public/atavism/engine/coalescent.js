/* ============================================================
   coalescent.js — deep-time organ
   (a) Coalescent / ARG roots growing BACKWARD in time below the
       core: lineages merge into ancestor-nodes, crystallizing
       generation by generation into the dark.
   (b) Two deepest uniparental strands (Y paternal, mt maternal)
       with dated haplogroup branch nodes.
   (c) Rare NAMED ancestor crystalline nodes from registry hits.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class Coalescent {
    constructor(scene, engine, glowTex, ringTex) {
      this.engine = engine;
      this.group = new THREE.Group();
      scene.add(this.group);
      this.core = new THREE.Vector3(0, 0.5, 0);
      const rng = AE.mulberry32(303);

      // ---------- build coalescent tree ----------
      let nodes = [];
      let edges = [];
      const N0 = 26;
      for (let i = 0; i < N0; i++) {
        nodes.push({
          id: nodes.length, gen: 0,
          x: (i / (N0 - 1) - 0.5) * 30 + (rng() - 0.5) * 2,
          z: (rng() - 0.5) * 11,
          y: -1.5, children: [],
        });
      }
      let layer = nodes.slice();
      let gen = 0, maxGen = 0;
      while (layer.length > 3 && gen < 14) {
        gen++;
        layer.sort((a, b) => a.x - b.x);
        const next = [];
        for (let i = 0; i < layer.length; i += 2) {
          const a = layer[i], b = layer[i + 1];
          if (!b) { next.push(a); continue; }
          const parent = {
            id: nodes.length, gen,
            x: (a.x + b.x) / 2 + (rng() - 0.5) * 1.4,
            z: (a.z + b.z) / 2 + (rng() - 0.5) * 1.4,
            y: -1.5 - gen * 2.4 - (rng() * 0.6),
            children: [a, b],
          };
          nodes.push(parent);
          edges.push({ from: parent, to: a });
          edges.push({ from: parent, to: b });
          next.push(parent);
        }
        layer = next;
        maxGen = gen;
      }
      this.maxGen = maxGen;
      const depthNorm = (g) => g / maxGen;

      // ---------- bead strands for edges ----------
      const cTop = new THREE.Color('#6fcfe6');
      const cDeep = new THREE.Color('#6f74d8');
      const beadItems = [];
      edges.forEach((e) => {
        const len = Math.hypot(e.from.x - e.to.x, e.from.y - e.to.y, e.from.z - e.to.z);
        const nb = Math.max(4, Math.round(len * 1.5));
        for (let i = 0; i < nb; i++) beadItems.push({ e, u: i / (nb - 1) });
      });
      // node caps (crystallized ancestor merge points)
      nodes.forEach((nd) => { if (nd.gen > 0) beadItems.push({ node: nd, cap: true }); });

      const n = beadItems.length;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const aSize = new Float32Array(n);
      const aAppear = new Float32Array(n);
      const aCap = new Float32Array(n);
      const aSeed = new Float32Array(n);
      const tmp = new THREE.Color();
      beadItems.forEach((it, i) => {
        let x, y, z, dn, isCap = 0, size;
        if (it.cap) {
          const nd = it.node; x = nd.x; y = nd.y; z = nd.z; dn = depthNorm(nd.gen);
          isCap = 1; size = AE.lerp(10, 20, dn);
        } else {
          const e = it.e, u = it.u;
          x = AE.lerp(e.to.x, e.from.x, u);
          y = AE.lerp(e.to.y, e.from.y, u);
          z = AE.lerp(e.to.z, e.from.z, u);
          dn = depthNorm(e.from.gen);
          size = AE.lerp(5, 8, dn);
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        tmp.copy(cTop).lerp(cDeep, dn);
        if (isCap) tmp.lerp(new THREE.Color('#dff2ff'), 0.4);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
        aSize[i] = size;
        aAppear[i] = AE.lerp(0.26, 0.66, dn);
        aCap[i] = isCap;
        aSeed[i] = rng() * 100;
      });

      this.uniforms = {
        uTime: { value: 0 }, uTex: { value: glowTex }, uDig: { value: 0 }, uDim: { value: 1 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };
      const treeMat = new THREE.ShaderMaterial({
        uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute vec3 aColor; attribute float aSize, aAppear, aCap, aSeed;
          uniform float uTime, uDig, uDim, uPixelRatio;
          varying vec3 vColor; varying float vAlpha;
          void main(){
            float reveal = smoothstep(aAppear - 0.02, aAppear + 0.06, uDig);
            // crystallization shimmer when freshly revealed
            float fresh = smoothstep(aAppear+0.16, aAppear, uDig);
            float twinkle = 0.7 + 0.3*sin(uTime*1.4 + aSeed*9.0);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            float dist = -mv.z;
            float sz = aSize * (aCap>0.5 ? (0.9+0.3*sin(uTime+aSeed*6.0)) : twinkle);
            sz *= 1.0 + fresh*1.2;
            gl_PointSize = sz * uPixelRatio * (42.0/dist) * reveal;
            gl_Position = projectionMatrix * mv;
            vColor = aColor * (aCap>0.5 ? 1.5 : 0.9) * (1.0 + fresh*0.8);
            vAlpha = reveal * uDim * (aCap>0.5 ? 0.95 : 0.5);
          }`,
        fragmentShader: `uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
          void main(){ float a=texture2D(uTex,gl_PointCoord).a; gl_FragColor=vec4(vColor,a*vAlpha); }`,
      });
      this.points = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), treeMat);
      this.points.geometry.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      this.points.geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      this.points.geometry.setAttribute('aAppear', new THREE.BufferAttribute(aAppear, 1));
      this.points.geometry.setAttribute('aCap', new THREE.BufferAttribute(aCap, 1));
      this.points.geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
      this.points.frustumCulled = false;
      this.group.add(this.points);

      // ---------- uniparental deep strands (Y + mt) ----------
      this.uniLabels = []; // {text, world, lineage}
      this._buildUniparental(engine, glowTex, rng);

      // ---------- named ancestor crystalline nodes ----------
      this.named = [];
      this._buildNamed(engine, ringTex, glowTex, depthNorm);
    }

    _buildUniparental(engine, glowTex, rng) {
      const lines = [
        { key: 'Y', haplo: engine.yHaplo, color: '#7aa6ff', xside: 7 },
        { key: 'mt', haplo: engine.mtHaplo, color: '#e58fbf', xside: -7 },
      ];
      const items = [];
      this.uniMeta = lines;
      lines.forEach((ln) => {
        // strand from core down to deepest, bowing outward to its side
        const top = new THREE.Vector3(0, this.core.y - 2, 0);
        const bottomY = -1.5 - this.maxGen * 2.4 - 24; // deeper than the tree
        const nb = 60;
        for (let i = 0; i < nb; i++) {
          const u = i / (nb - 1);
          items.push({ ln, u, top, bottomY, seed: rng() * 100 });
        }
        // haplogroup branch caps + labels
        ln.haplo.forEach((h, hi) => {
          const u = 0.32 + hi * 0.2;
          items.push({ ln, u, top, bottomY, cap: true, haplo: h, seed: rng() * 100 });
        });
      });
      this.uniItems = items;
      const n = items.length;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const aSize = new Float32Array(n);
      const aU = new Float32Array(n);
      const aCap = new Float32Array(n);
      const aKey = new Float32Array(n); // 0 = Y, 1 = mt
      const aSeed = new Float32Array(n);
      items.forEach((it, i) => {
        const c = new THREE.Color(it.ln.color);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        aSize[i] = it.cap ? 16 : AE.lerp(8, 4, it.u);
        aU[i] = it.u; aCap[i] = it.cap ? 1 : 0;
        aKey[i] = it.ln.key === 'Y' ? 0 : 1;
        aSeed[i] = it.seed;
      });
      this.uniUniforms = {
        uTime: { value: 0 }, uTex: { value: glowTex }, uAct: { value: 0 },
        uDim: { value: 1 }, uSelY: { value: 1 }, uSelMt: { value: 1 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute vec3 aColor; attribute float aSize, aU, aCap, aKey, aSeed;
          uniform float uTime, uAct, uDim, uSelY, uSelMt, uPixelRatio;
          varying vec3 vColor; varying float vAlpha;
          void main(){
            float reveal = smoothstep(aU*0.9, aU*0.9+0.25, uAct*1.25);
            float sel = mix(uSelY, uSelMt, aKey);
            float flow = sin(aU*9.0 - uTime*2.0 + aSeed*6.28);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            float dist = -mv.z;
            float sz = aSize * (aCap>0.5 ? (0.9+0.3*sin(uTime*1.2+aSeed)) : (0.6+0.4*flow));
            gl_PointSize = sz * uPixelRatio * (42.0/dist) * reveal;
            gl_Position = projectionMatrix * mv;
            vColor = aColor * (aCap>0.5 ? 1.6 : (0.6+0.6*max(0.0,flow)));
            vAlpha = reveal * uDim * sel * (aCap>0.5 ? 0.95 : 0.5);
          }`,
        fragmentShader: `uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
          void main(){ float a=texture2D(uTex,gl_PointCoord).a; gl_FragColor=vec4(vColor,a*vAlpha); }`,
      });
      this.uniPosAttr = new THREE.BufferAttribute(pos, 3);
      this.uniPosAttr.setUsage(THREE.DynamicDrawUsage);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', this.uniPosAttr);
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
      geo.setAttribute('aCap', new THREE.BufferAttribute(aCap, 1));
      geo.setAttribute('aKey', new THREE.BufferAttribute(aKey, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
      this.uniPoints = new THREE.Points(geo, mat);
      this.uniPoints.frustumCulled = false;
      this.group.add(this.uniPoints);
    }

    _uniPos(it, t, out) {
      const u = it.u;
      const side = it.ln.xside;
      // bow outward then plunge straight down into deepest dark
      const x = Math.sin(u * Math.PI * 0.8) * side + Math.sin(u * 10 + t * 1.2 + it.seed) * (1 - u) * 0.5;
      const y = AE.lerp(it.top.y, it.bottomY, u);
      const z = Math.cos(u * Math.PI * 0.5) * side * 0.4 + Math.sin(u * 7 + t + it.seed) * (1 - u) * 0.4;
      out.set(x, y, z);
    }

    _buildNamed(engine, ringTex, glowTex, depthNorm) {
      engine.named.forEach((a) => {
        const g = a.gen;
        const yy = -2 - ((g - 5) / 10) * 26;
        let xx, zz;
        if (a.lineage === 'Y') { xx = 6 + (g % 3) - 1; zz = 2; }
        else if (a.lineage === 'mt') { xx = -6 - (g % 3) + 1; zz = -2; }
        else { xx = ((g * 37) % 22) - 11; zz = ((g * 53) % 12) - 6; }
        const world = new THREE.Vector3(xx, yy, zz);

        const grp = new THREE.Group();
        grp.position.copy(world);
        // ring sprite
        const ring = new THREE.Sprite(new THREE.SpriteMaterial({
          map: ringTex, color: new THREE.Color('#f0c884'),
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
        }));
        ring.scale.setScalar(5);
        // bright core
        const core = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, color: new THREE.Color('#ffe6b0'),
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
        }));
        core.scale.setScalar(7);
        grp.add(ring); grp.add(core);
        this.group.add(grp);
        this.named.push({ data: a, world, grp, ring, core, reveal: 0 });
      });
    }

    update(t, breath, life, dim) {
      this.uniforms.uTime.value = t;
      this.uniforms.uDig.value = this.engine.digSmoothed;
      this.uniforms.uDim.value = dim;

      // uniparental
      this.uniUniforms.uTime.value = t;
      this.uniUniforms.uAct.value = this.engine.layers.uniparental;
      this.uniUniforms.uDim.value = dim;
      const lin = this.engine.lineage;
      this.uniUniforms.uSelY.value = (lin === 'auto' || lin === 'Y') ? 1.0 : 0.12;
      this.uniUniforms.uSelMt.value = (lin === 'auto' || lin === 'mt') ? 1.0 : 0.12;
      const arr = this.uniPosAttr.array;
      const tmp = new THREE.Vector3();
      this.uniItems.forEach((it, i) => {
        this._uniPos(it, t, tmp);
        arr[i * 3] = tmp.x; arr[i * 3 + 1] = tmp.y; arr[i * 3 + 2] = tmp.z;
        if (it.cap) it.world = tmp.clone();
      });
      this.uniPosAttr.needsUpdate = true;
      // collect haplo label anchors
      this.uniLabels = this.uniItems.filter((it) => it.cap).map((it) => ({
        text: it.haplo.label, sub: `~${(it.haplo.ybp / 1000).toFixed(1)} kybp`,
        world: it.world, key: it.ln.key,
      }));

      // named ancestors reveal
      const reg = this.engine.layers.registry;
      this.named.forEach((nm) => {
        const appear = nm.data.depth;
        const target = this.engine.digSmoothed >= appear ? 1 : 0;
        nm.reveal += (target - nm.reveal) * Math.min(1, 0.06);
        const pulse = 0.8 + 0.2 * Math.sin(t * 1.6 + nm.data.gen);
        // lineage focus
        let sel = 1;
        if (lin !== 'auto') sel = nm.data.lineage === lin ? 1.2 : 0.2;
        const o = nm.reveal * dim * sel;
        nm.ring.material.opacity = 0.9 * o * pulse;
        nm.core.material.opacity = 0.85 * o;
        nm.ring.scale.setScalar((4.5 + Math.sin(t * 1.2 + nm.data.gen) * 0.4) * (0.6 + 0.4 * nm.reveal));
        nm.core.scale.setScalar(6 * (0.5 + 0.5 * nm.reveal));
        nm.visible = nm.reveal > 0.4 && o > 0.3;
      });
    }
  }

  AE.Coalescent = Coalescent;
})();
