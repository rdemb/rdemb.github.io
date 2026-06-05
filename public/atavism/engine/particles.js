/* ============================================================
   particles.js — ambient "tissue" field + abyss background
   The volume the organism lives in: drifting plankton/motes,
   slow flow-field motion, depth fade. GPU shader, additive.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class TissueField {
    constructor(scene, glowTex, count = 2600) {
      this.scene = scene;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      const sz = new Float32Array(count);
      const tint = new Float32Array(count * 3);

      const palette = [
        new THREE.Color('#2b6fb0'),
        new THREE.Color('#3aa6a0'),
        new THREE.Color('#6f7ed8'),
        new THREE.Color('#8fd6e6'),
        new THREE.Color('#a98bff'),
      ];
      const rng = AE.mulberry32(7);
      for (let i = 0; i < count; i++) {
        // distribute in a tall ellipsoidal volume, denser near center
        const r = Math.pow(rng(), 0.55) * 46;
        const th = rng() * Math.PI * 2;
        const ph = Math.acos(2 * rng() - 1);
        pos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th) * 1.15;
        pos[i * 3 + 1] = r * Math.cos(ph) * 1.35 - 4;
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) * 1.15;
        seed[i] = rng() * 100;
        sz[i] = 6 + rng() * 26;
        const c = palette[(rng() * palette.length) | 0];
        tint[i * 3] = c.r; tint[i * 3 + 1] = c.g; tint[i * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
      geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));

      this.uniforms = {
        uTime: { value: 0 },
        uTex: { value: glowTex },
        uBreath: { value: 0 },
        uLife: { value: 0.4 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          ${AE.GLSL_SNOISE}
          attribute float aSeed;
          attribute float aSize;
          attribute vec3 aTint;
          uniform float uTime;
          uniform float uBreath;
          uniform float uLife;
          uniform float uPixelRatio;
          varying vec3 vTint;
          varying float vAlpha;
          void main(){
            vec3 p = position;
            float t = uTime * 0.08;
            // slow flow-field drift
            vec3 q = p * 0.05 + vec3(aSeed);
            p.x += snoise(q + vec3(t, 0.0, 0.0)) * 2.4;
            p.y += snoise(q + vec3(0.0, t, 10.0)) * 2.4;
            p.z += snoise(q + vec3(0.0, 0.0, t)) * 2.4;
            // breath: gentle volumetric expansion
            p *= 1.0 + uBreath * 0.02;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float dist = -mv.z;
            // twinkle
            float tw = 0.55 + 0.45 * sin(uTime * 0.6 + aSeed * 6.2831);
            gl_PointSize = aSize * uPixelRatio * (40.0 / dist) * (0.5 + uLife) * tw;
            gl_Position = projectionMatrix * mv;
            // depth fade — far motes dimmer (depth of field feel)
            float df = smoothstep(150.0, 18.0, dist);
            vTint = aTint;
            vAlpha = df * (0.10 + 0.32 * uLife) * tw;
          }
        `,
        fragmentShader: `
          uniform sampler2D uTex;
          varying vec3 vTint;
          varying float vAlpha;
          void main(){
            float a = texture2D(uTex, gl_PointCoord).a;
            gl_FragColor = vec4(vTint, a * vAlpha);
          }
        `,
      });
      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      scene.add(this.points);
    }
    update(t, breath, life) {
      this.uniforms.uTime.value = t;
      this.uniforms.uBreath.value = breath;
      this.uniforms.uLife.value = life;
    }
  }

  // abyss background: large gradient sphere (inside-out)
  function makeAbyss(scene) {
    const geo = new THREE.SphereGeometry(220, 32, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vPos;
        void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float uTime;
        void main(){
          vec3 dir = normalize(vPos);
          // vertical gradient: faint navy/violet high, black deep below
          float v = dir.y * 0.5 + 0.5;
          vec3 top = vec3(0.018, 0.028, 0.055);
          vec3 mid = vec3(0.030, 0.026, 0.052);
          vec3 deep = vec3(0.004, 0.005, 0.012);
          vec3 col = mix(deep, mid, smoothstep(0.0, 0.55, v));
          col = mix(col, top, smoothstep(0.55, 1.0, v));
          // subtle central glow toward viewer-ish (radial in xy)
          float rad = length(dir.xy);
          col += vec3(0.012, 0.02, 0.035) * smoothstep(0.8, 0.0, rad) * (0.6 + 0.4*sin(uTime*0.1));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, mat };
  }

  AE.TissueField = TissueField;
  AE.makeAbyss = makeAbyss;
})();
