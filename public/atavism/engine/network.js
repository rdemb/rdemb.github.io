/* ============================================================
   network.js — IBD relative network organ
   A living web of relative-nodes orbiting the core. Each thread
   is a strand of light from the core to a relative; its thickness
   (bead size) ÔêØ shared DNA (cM). Closer kin sit nearer & brighter.
   Node world positions are computed on CPU for hover/labels.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class RelativeNetwork {
    constructor(scene, engine, glowTex) {
      this.engine = engine;
      this.group = new THREE.Group();
      scene.add(this.group);
      this.core = new THREE.Vector3(0, 1.5, 0);

      const rel = engine.relatives;
      this.rel = rel;
      const maxCM = rel[0].cM, minCM = rel[rel.length - 1].cM;
      this.norm = (cM) => AE.clamp((cM - minCM) / (maxCM - minCM), 0, 1);

      // per-relative anchor + thread bead count
      this.nodes = rel.map((r, i) => {
        const nrm = this.norm(r.cM);
        const radius = AE.lerp(27, 8.5, nrm);            // closer kin nearer
        const height = AE.lerp(-3, 12, Math.pow(nrm, 0.7)) + (r.b - 0.5) * 10;
        return {
          rel: r, idx: i, nrm, radius, height,
          beads: Math.max(5, Math.round(6 + nrm * 12)),  // more shared DNA -> denser strand
          world: new THREE.Vector3(),
          a: r.a, seed: r.seed,
        };
      });

      // build bead buffer (threads + node caps)
      const items = [];
      this.nodes.forEach((nd) => {
        for (let i = 0; i < nd.beads; i++) {
          items.push({ node: nd, kind: 0, u: i / (nd.beads - 1) });
        }
        items.push({ node: nd, kind: 1, u: 1 }); // node cap
      });
      this.items = items;
      const n = items.length;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const aSize = new Float32Array(n);
      const aKind = new Float32Array(n);
      const aU = new Float32Array(n);
      const aSeed = new Float32Array(n);
      const cThread = new THREE.Color('#5fbfe6');
      const cNode = new THREE.Color('#dff2ff');
      items.forEach((it, i) => {
        const nd = it.node;
        const c = it.kind === 1 ? cNode : cThread;
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        const cmSize = AE.lerp(3, 9, nd.nrm);
        aSize[i] = it.kind === 1 ? AE.lerp(11, 26, nd.nrm) : cmSize;
        aKind[i] = it.kind;
        aU[i] = it.u;
        aSeed[i] = nd.seed;
      });
      const geo = new THREE.BufferGeometry();
      this.posAttr = new THREE.BufferAttribute(pos, 3);
      this.posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', this.posAttr);
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      geo.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
      geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));

      this.uniforms = {
        uTime: { value: 0 }, uTex: { value: glowTex },
        uAct: { value: 0 }, uDim: { value: 1 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute vec3 aColor; attribute float aSize, aKind, aU, aSeed;
          uniform float uTime, uAct, uDim, uPixelRatio;
          varying vec3 vColor; varying float vAlpha;
          void main(){
            // flow pulse travelling from core outward
            float flow = sin(aU * 7.0 - uTime * 2.2 + aSeed*6.2831);
            float reveal = smoothstep(0.0, 0.6, uAct);
            // node cap appears slightly later
            if(aKind > 0.5) reveal *= smoothstep(0.45, 0.85, uAct);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            float dist = -mv.z;
            float sz = aSize * (0.6 + 0.4*flow);
            if(aKind > 0.5) sz = aSize * (0.85 + 0.25*sin(uTime*1.3 + aSeed*9.0));
            gl_PointSize = sz * uPixelRatio * (42.0/dist) * reveal;
            gl_Position = projectionMatrix * mv;
            float bright = aKind > 0.5 ? 1.4 : (0.5 + 0.6*max(0.0,flow));
            vColor = aColor * bright;
            vAlpha = reveal * uDim * (aKind > 0.5 ? 0.95 : 0.5);
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
          void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vColor, a*vAlpha); }`,
      });
      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      this.group.add(this.points);
    }

    update(t, breath, life, dim) {
      this.uniforms.uTime.value = t;
      this.uniforms.uAct.value = this.engine.layers.ibd;
      this.uniforms.uDim.value = dim;

      // compute node world positions (gentle orbital drift + noise)
      const arr = this.posAttr.array;
      this.nodes.forEach((nd) => {
        const ang = nd.a + t * 0.045 * (0.5 + nd.nrm) + Math.sin(t * 0.2 + nd.seed) * 0.12;
        const wob = AE.pnoise3(nd.seed, t * 0.12, nd.seed * 0.3) * 1.6;
        const r = nd.radius + Math.sin(t * 0.3 + nd.seed) * 1.2 + breath * 0.4;
        nd.world.set(
          Math.cos(ang) * r,
          this.core.y + nd.height + wob + Math.sin(t * 0.25 + nd.seed * 2) * 1.0,
          Math.sin(ang) * r * 0.85
        );
      });
      // write bead positions along core->node, with slight sag/curve
      let i = 0;
      this.items.forEach((it) => {
        const nd = it.node;
        const u = it.u;
        const x = AE.lerp(this.core.x, nd.world.x, u);
        const y = AE.lerp(this.core.y, nd.world.y, u) + Math.sin(u * Math.PI) * (1.2 + nd.nrm * 1.5);
        const z = AE.lerp(this.core.z, nd.world.z, u);
        // organic lateral waver
        const w = Math.sin(u * 6.0 + t * 1.5 + nd.seed) * (1 - u) * 0.6;
        arr[i * 3] = x + w; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z + w;
        i++;
      });
      this.posAttr.needsUpdate = true;
    }
  }

  AE.RelativeNetwork = RelativeNetwork;
})();
