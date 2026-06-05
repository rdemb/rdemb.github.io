/* ============================================================
   ancient.js — deep-time ancestral source populations
   Distant constellations (Steppe, Anatolian Neolithic, WHG, EHG)
   far in the abyss, each bound to the organism by threads of
   light whose mass ÔêØ admixture proportion.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class Ancient {
    constructor(scene, engine, glowTex) {
      this.engine = engine;
      this.group = new THREE.Group();
      scene.add(this.group);
      this.core = new THREE.Vector3(0, 0.5, 0);
      const rng = AE.mulberry32(909);

      const dirs = [
        new THREE.Vector3(-1.0, 0.8, -0.6),
        new THREE.Vector3(1.1, 1.0, -0.4),
        new THREE.Vector3(-0.9, 1.3, 0.7),
        new THREE.Vector3(1.0, 0.5, 0.9),
      ];
      this.consts = [];
      const items = [];

      engine.ancient.forEach((pop, pi) => {
        const dir = dirs[pi % dirs.length].clone().normalize();
        const dist = 50 + pop.age * 0.0016; // older = farther
        const center = dir.multiplyScalar(dist).add(new THREE.Vector3(0, 6, 0));
        this.consts.push({ pop, center, world: center.clone() });

        // constellation stars
        const stars = 18 + Math.round(pop.frac * 34);
        for (let i = 0; i < stars; i++) {
          const p = new THREE.Vector3(
            center.x + (rng() - 0.5) * 14,
            center.y + (rng() - 0.5) * 11,
            center.z + (rng() - 0.5) * 14
          );
          items.push({ pop, pi, p, kind: 0, size: 4 + rng() * 9, seed: rng() * 100, u: 0 });
        }
        // thread bundle to core (count + size ÔêØ admixture)
        const strands = 1 + Math.round(pop.frac * 4);
        for (let s = 0; s < strands; s++) {
          const off = new THREE.Vector3((rng() - 0.5) * 5, (rng() - 0.5) * 5, (rng() - 0.5) * 5);
          const nb = 26;
          for (let i = 0; i < nb; i++) {
            items.push({ pop, pi, kind: 1, u: i / (nb - 1), off, size: 3 + pop.frac * 5, seed: rng() * 100 });
          }
        }
      });

      this.items = items;
      const n = items.length;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const aSize = new Float32Array(n);
      const aKind = new Float32Array(n);
      const aU = new Float32Array(n);
      const aSeed = new Float32Array(n);
      const aPi = new Float32Array(n);
      items.forEach((it, i) => {
        const c = new THREE.Color(it.pop.color);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        aSize[i] = it.size; aKind[i] = it.kind; aU[i] = it.u; aSeed[i] = it.seed; aPi[i] = it.pi;
        if (it.kind === 0) { pos[i * 3] = it.p.x; pos[i * 3 + 1] = it.p.y; pos[i * 3 + 2] = it.p.z; }
      });
      this.posAttr = new THREE.BufferAttribute(pos, 3);
      this.posAttr.setUsage(THREE.DynamicDrawUsage);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', this.posAttr);
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      geo.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
      geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
      geo.setAttribute('aPi', new THREE.BufferAttribute(aPi, 1));

      this.uniforms = {
        uTime: { value: 0 }, uTex: { value: glowTex }, uAct: { value: 0 }, uDim: { value: 1 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute vec3 aColor; attribute float aSize, aKind, aU, aSeed, aPi;
          uniform float uTime, uAct, uDim, uPixelRatio;
          varying vec3 vColor; varying float vAlpha;
          void main(){
            float reveal = smoothstep(0.0, 0.7, uAct);
            float flow = sin(aU*8.0 - uTime*1.6 + aSeed*6.28);
            float tw = 0.6 + 0.4*sin(uTime*0.8 + aSeed*9.0);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            float dist = -mv.z;
            float sz = aKind < 0.5 ? aSize*tw : aSize*(0.5+0.5*flow);
            gl_PointSize = sz * uPixelRatio * (42.0/dist) * reveal;
            gl_Position = projectionMatrix * mv;
            float bright = aKind < 0.5 ? 1.0 : (0.4+0.6*max(0.0,flow));
            vColor = aColor * bright;
            vAlpha = reveal * uDim * (aKind < 0.5 ? (0.35+0.4*tw) : 0.32);
          }`,
        fragmentShader: `uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
          void main(){ float a=texture2D(uTex,gl_PointCoord).a; gl_FragColor=vec4(vColor,a*vAlpha); }`,
      });
      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      this.group.add(this.points);
    }

    update(t, breath, life, dim) {
      this.uniforms.uTime.value = t;
      this.uniforms.uAct.value = this.engine.layers.ancient;
      this.uniforms.uDim.value = dim;
      // animate constellation drift + thread positions
      const arr = this.posAttr.array;
      const tmp = new THREE.Vector3();
      this.items.forEach((it, i) => {
        if (it.kind === 0) {
          // gentle twinkle drift
          arr[i * 3] = it.p.x + Math.sin(t * 0.2 + it.seed) * 0.5;
          arr[i * 3 + 1] = it.p.y + Math.cos(t * 0.17 + it.seed) * 0.5;
          arr[i * 3 + 2] = it.p.z + Math.sin(t * 0.13 + it.seed * 2) * 0.5;
        } else {
          const center = this.consts[it.pi].center;
          const u = it.u;
          tmp.set(
            AE.lerp(this.core.x, center.x + it.off.x, u),
            AE.lerp(this.core.y, center.y + it.off.y, u) + Math.sin(u * Math.PI) * 3,
            AE.lerp(this.core.z, center.z + it.off.z, u)
          );
          // waver
          tmp.x += Math.sin(u * 6 + t * 1.2 + it.seed) * (1 - u) * 1.2;
          tmp.y += Math.cos(u * 5 + t + it.seed) * (1 - u) * 1.0;
          arr[i * 3] = tmp.x; arr[i * 3 + 1] = tmp.y; arr[i * 3 + 2] = tmp.z;
        }
      });
      this.posAttr.needsUpdate = true;
    }
  }

  AE.Ancient = Ancient;
})();
