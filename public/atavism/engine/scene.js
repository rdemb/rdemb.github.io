/* ============================================================
   scene.js — orchestrator: renderer, bloom, camera-life,
   organ wiring, interaction, render loop.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  class World {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.renderer.setSize(innerWidth, innerHeight);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.setClearColor(0x000000, 1);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 600);
      this.camBase = new THREE.Vector3(0, 2.5, 58);
      this.camera.position.copy(this.camBase);
      this.camTarget = new THREE.Vector3(0, 1.5, 0);

      // engine
      this.engine = new AE.Engine();

      // shared textures
      this.glowTex = AE.makeGlowTexture(128, 0.16);
      this.ringTex = AE.makeRingTexture(128);

      // background + organs
      this.abyss = AE.makeAbyss(this.scene);
      this.tissue = new AE.TissueField(this.scene, this.glowTex, 2600);
      this._createOrgans();

      // bloom composer
      this._setupComposer();

      // camera life / input
      this.mouse = new THREE.Vector2(0, 0);
      this.mouseT = new THREE.Vector2(0, 0);
      this.scroll = 0; this.scrollT = 0;
      this._initInput();

      // breathing/life state
      this.t = 0;
      this.breath = 0;
      this.life = 0.4;
      this._flash = 0;
      this._flashColor = new THREE.Color('#e9b66a');

      // raycaster for hover
      this.raycaster = new THREE.Raycaster();
      this.raycaster.params.Points = { threshold: 1.2 };

      addEventListener('resize', () => this._resize());
    }

    _createOrgans() {
      this.genome = new AE.Genome(this.scene, this.engine, this.glowTex);
      this.network = AE.RelativeNetwork ? new AE.RelativeNetwork(this.scene, this.engine, this.glowTex) : null;
      this.coalescent = AE.Coalescent ? new AE.Coalescent(this.scene, this.engine, this.glowTex, this.ringTex) : null;
      this.ancient = AE.Ancient ? new AE.Ancient(this.scene, this.engine, this.glowTex) : null;
    }

    _disposeOrgan(o) {
      if (!o) return;
      const g = o.group || o.points;
      if (!g) return;
      g.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => { if (m.map && m.map.dispose && m.map !== this.glowTex && m.map !== this.ringTex) m.map.dispose(); m.dispose(); });
      });
      this.scene.remove(g);
    }

    // tear down organs and regrow from the engine's current data
    rebuildOrgans() {
      ['genome', 'network', 'coalescent', 'ancient'].forEach((k) => { this._disposeOrgan(this[k]); this[k] = null; });
      this._createOrgans();
      this.engine.focusOrgan = null;
    }

    _setupComposer() {
      const { EffectComposer, RenderPass, UnrealBloomPass } = THREE;
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.62, 0.18);
      bloom.strength = 1.05;
      bloom.radius = 0.7;
      bloom.threshold = 0.12;
      this.bloom = bloom;
      this.composer.addPass(bloom);
      this.composer.setPixelRatio(Math.min(devicePixelRatio, 2));
    }

    _initInput() {
      addEventListener('pointermove', (e) => {
        this.mouseT.x = (e.clientX / innerWidth) * 2 - 1;
        this.mouseT.y = -((e.clientY / innerHeight) * 2 - 1);
        this._pointerPx = { x: e.clientX, y: e.clientY };
      });
      addEventListener('wheel', (e) => {
        this.scrollT = AE.clamp(this.scrollT + e.deltaY * 0.0008, 0, 1);
        this.engine.timeZoom = this.scrollT;
      }, { passive: true });
    }

    flash(colorHex, amount = 1) {
      this._flash = Math.min(1.6, this._flash + amount);
      if (colorHex) this._flashColor.set(colorHex);
    }

    setDim(organKey) { this.engine.focusOrgan = organKey; }

    _resize() {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.composer.setSize(innerWidth, innerHeight);
      this.bloom.setSize(innerWidth, innerHeight);
    }

    update(dt) {
      this.t += dt;
      const t = this.t;
      this.engine.update(dt);

      // breathing: slow + a faster sub-pulse; richer when digging deep
      const deep = this.engine.layers.coalescent;
      this.breath = Math.sin(t * 0.55) * (0.7 + deep * 0.6) + Math.sin(t * 1.7) * 0.25;
      // overall "life" rises with how deep the engine has dug
      const targetLife = 0.32 + 0.68 * this.engine.digSmoothed;
      this.life += (targetLife - this.life) * Math.min(1, dt * 1.5);
      this._flash *= Math.pow(0.12, dt); // decay

      // bloom reacts to life + flashes
      this.bloom.strength = 0.85 + this.life * 0.5 + this._flash * 0.6;

      // camera life: gentle parallax + drift + scroll-into-time descent
      this.mouse.lerp(this.mouseT, Math.min(1, dt * 2.2));
      this.scroll += (this.scrollT - this.scroll) * Math.min(1, dt * 2.0);
      const drift = new THREE.Vector3(
        Math.sin(t * 0.07) * 2.4 + this.mouse.x * 6.0,
        Math.cos(t * 0.06) * 1.4 + this.mouse.y * 3.5,
        0
      );
      // scroll descends camera down along the roots into deep time
      const descend = this.scroll;
      const camPos = new THREE.Vector3(
        this.camBase.x + drift.x,
        this.camBase.y + drift.y - descend * 26,
        this.camBase.z - descend * 10 + Math.sin(t * 0.05) * 1.5
      );
      this.camera.position.lerp(camPos, Math.min(1, dt * 2.5));
      const tgt = new THREE.Vector3(0, 1.5 - descend * 30, 0);
      this.camTarget.lerp(tgt, Math.min(1, dt * 2.5));
      this.camera.lookAt(this.camTarget);

      // focus dimming per organ
      const focus = this.engine.focusOrgan;
      const dimFor = (key) => (!focus || focus === key ? 1.0 : 0.18);

      // update organs
      this.tissue.update(t, this.breath, this.life);
      this.genome.update(t, this.breath, this.life, dimFor('genome') * this._lineageDim('genome'));
      if (this.network) this.network.update(t, this.breath, this.life, dimFor('ibd'));
      if (this.coalescent) this.coalescent.update(t, this.breath, this.life, dimFor('coalescent'));
      if (this.ancient) this.ancient.update(t, this.breath, this.life, dimFor('ancient'));
      this.abyss.mat.uniforms.uTime.value = t;

      // flash tint into exposure
      this.renderer.toneMappingExposure = 1.05 + this._flash * 0.18;
    }

    // lineage focus dims autosomal genome when Y/mt selected
    _lineageDim(key) {
      const l = this.engine.lineage;
      if (l === 'auto') return 1.0;
      if (key === 'genome') return 0.45; // genome present but receded for uniparental focus
      return 1.0;
    }

    render() {
      this.composer.render();
    }
  }

  AE.World = World;
})();
