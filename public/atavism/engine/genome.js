/* ============================================================
   genome.js — the genome organ (centerpiece)
   23 chromosome PAIRS = 46 luminous bead-fibers emanating from a
   breathing core. Each bead painted by local-ancestry population.
   Fibers undulate; a pulse-wave travels outward; beads light up
   from the core outward as the genome layer activates.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class Genome {
    constructor(scene, engine, glowTex) {
      this.engine = engine;
      this.group = new THREE.Group();
      scene.add(this.group);
      this.fibers = []; // metadata for raycast/labels later

      const chrLen = engine.chrLen;
      const pops = engine.populations;
      const rng = AE.mulberry32(101);

      // weighted population picker by fraction
      const pickPop = () => {
        let x = rng();
        for (const p of pops) { x -= p.frac; if (x <= 0) return p; }
        return pops[0];
      };

      const beads = [];
      const corePos = new THREE.Vector3(0, 1.5, 0);

      // 23 pairs; arrange directions on a sphere using a phyllotaxis-ish spread,
      // biased into an upward anemone "body".
      const PAIRS = 23;
      const golden = Math.PI * (3 - Math.sqrt(5));
      let fiberIndex = 0;
      for (let c = 0; c < PAIRS; c++) {
        const L = chrLen[c];
        for (let s = 0; s < 2; s++) {
          const k = fiberIndex;
          // base direction via fibonacci sphere, biased up & outward
          const yy = 1 - (k / (PAIRS * 2 - 1)) * 1.55; // 1..-0.55
          const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
          const phi = k * golden + (s === 0 ? 0 : 0.14);
          let dir = new THREE.Vector3(Math.cos(phi) * rr, yy * 0.9 + 0.25, Math.sin(phi) * rr).normalize();
          // lateral bend axis
          const bend = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
          const bend2 = new THREE.Vector3().crossVectors(dir, bend).normalize();
          const bendAmt = (rng() - 0.5) * 6.0;
          const bend2Amt = (rng() - 0.5) * 4.0;
          const r0 = 2.6 + rng() * 0.6;
          const len = 7 + L * 9.5;
          const nBeads = Math.round(26 + L * 30);
          const phase = rng() * 100;

          // ancestry segmentation along the fiber
          let segLeft = 0, segPop = pickPop();

          for (let i = 0; i < nBeads; i++) {
            const t = i / (nBeads - 1);
            if (segLeft <= 0) { segPop = pickPop(); segLeft = 0.12 + rng() * 0.3; }
            segLeft -= 1 / nBeads;
            const along = r0 + t * len;
            const base = new THREE.Vector3()
              .copy(corePos)
              .addScaledVector(dir, along)
              .addScaledVector(bend, Math.sin(t * Math.PI * 1.1) * bendAmt)
              .addScaledVector(bend2, Math.sin(t * Math.PI * 1.7 + 1.0) * bend2Amt);
            const col = new THREE.Color(segPop.color);
            beads.push({ base, col, t, fiber: k, size: 7 + (1 - t) * 9 + rng() * 3, phase });
          }
          this.fibers.push({ index: k, chr: c + 1, copy: s, dir, len });
          fiberIndex++;
        }
      }

      // also seed a dense bright core cluster
      for (let i = 0; i < 140; i++) {
        const v = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize().multiplyScalar(Math.pow(rng(), 0.5) * 2.4);
        const base = v.add(corePos);
        const p = pickPop();
        beads.push({ base, col: new THREE.Color(p.color).lerp(new THREE.Color('#eaf6ff'), 0.4), t: 0.0, fiber: -1, size: 9 + rng() * 16, phase: rng() * 100 });
      }

      const n = beads.length;
      const pos = new Float32Array(n * 3);
      const color = new Float32Array(n * 3);
      const aT = new Float32Array(n);
      const aFiber = new Float32Array(n);
      const aSize = new Float32Array(n);
      const aPhase = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const b = beads[i];
        pos[i * 3] = b.base.x; pos[i * 3 + 1] = b.base.y; pos[i * 3 + 2] = b.base.z;
        color[i * 3] = b.col.r; color[i * 3 + 1] = b.col.g; color[i * 3 + 2] = b.col.b;
        aT[i] = b.t; aFiber[i] = b.fiber; aSize[i] = b.size; aPhase[i] = b.phase;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
      geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
      geo.setAttribute('aFiber', new THREE.BufferAttribute(aFiber, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));

      this.uniforms = {
        uTime: { value: 0 },
        uTex: { value: glowTex },
        uAct: { value: 0 },     // genome activation
        uBreath: { value: 0 },
        uDim: { value: 1 },     // focus dimming (1 = full)
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          ${AE.GLSL_SNOISE}
          attribute vec3 aColor;
          attribute float aT;
          attribute float aFiber;
          attribute float aSize;
          attribute float aPhase;
          uniform float uTime, uAct, uBreath, uDim, uPixelRatio;
          varying vec3 vColor;
          varying float vAlpha;
          void main(){
            vec3 p = position;
            float t = uTime;
            // undulation: organic perpendicular sway, stronger toward fiber tips
            float amp = 0.5 + aT * 2.2;
            vec3 q = p * 0.12 + vec3(aPhase);
            p.x += snoise(q + vec3(t*0.18, 0.0, 0.0)) * amp;
            p.y += snoise(q + vec3(0.0, t*0.16, 5.0)) * amp;
            p.z += snoise(q + vec3(0.0, 0.0, t*0.20)) * amp;
            // breath
            vec3 fromCore = p - vec3(0.0,1.5,0.0);
            p = vec3(0.0,1.5,0.0) + fromCore * (1.0 + uBreath*0.03);

            // reveal from core outward as activation rises
            float reveal = smoothstep(aT - 0.04, aT + 0.02, uAct * 1.12);
            // travelling pulse-wave along the fiber
            float wave = sin(aT * 9.0 - t * 1.6 + aPhase * 6.2831);
            float pulse = 0.6 + 0.4 * wave;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float dist = -mv.z;
            gl_PointSize = aSize * uPixelRatio * (42.0 / dist) * reveal * (0.7 + 0.5*pulse);
            gl_Position = projectionMatrix * mv;
            vColor = aColor * (0.85 + 0.6 * pulse);
            vAlpha = reveal * uDim * (0.5 + 0.5*pulse);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTex;
          varying vec3 vColor;
          varying float vAlpha;
          void main(){
            float a = texture2D(uTex, gl_PointCoord).a;
            gl_FragColor = vec4(vColor, a * vAlpha);
          }
        `,
      });

      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      this.group.add(this.points);

      // soft core halo sprite
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color('#bfe6ff'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        opacity: 0.0,
      }));
      halo.scale.setScalar(16);
      halo.position.copy(corePos);
      this.group.add(halo);
      this.halo = halo;
    }

    update(t, breath, life, dim) {
      this.uniforms.uTime.value = t;
      this.uniforms.uAct.value = this.engine.layers.genome;
      this.uniforms.uBreath.value = breath;
      this.uniforms.uDim.value = dim;
      this.halo.material.opacity = 0.25 * this.engine.layers.genome * (0.8 + 0.2 * Math.sin(t * 0.8)) * dim;
      this.halo.scale.setScalar(14 + breath * 1.5);
    }
  }

  AE.Genome = Genome;
})();
