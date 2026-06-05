/* ============================================================
   engine.js — simulated ancestral genetics engine
   Streams "live" state: dig depth, layer activations, events.
   This stands in for a real WebSocket/SSE engine feed.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});
  const { mulberry32, smoothstep, clamp, lerp } = AE;

  // ---------- ancestry populations (muted, museum palette) ----------
  // modern local-ancestry components + ancient source populations.
  const POPULATIONS = [
    { id: 'baltic',   label: 'Baltic',                 color: '#5fd0e6', frac: 0.27, type: 'modern' },
    { id: 'slavic',   label: 'West Slavic',            color: '#6fe3c2', frac: 0.31, type: 'modern' },
    { id: 'eeuro',    label: 'East European',          color: '#7aa6ff', frac: 0.18, type: 'modern' },
    { id: 'finnic',   label: 'Finno-Volgaic',          color: '#9d8cff', frac: 0.09, type: 'modern' },
    { id: 'scand',    label: 'Scandinavian',           color: '#bfeaff', frac: 0.07, type: 'modern' },
    { id: 'germanic', label: 'Central Germanic',       color: '#62b8a8', frac: 0.08, type: 'modern' },
  ];

  // ancient source populations (deep-time constellations)
  const ANCIENT = [
    { id: 'steppe',   label: 'Steppe Pastoralist',     color: '#e9b66a', frac: 0.46, age: 5000 },
    { id: 'anatolian',label: 'Anatolian Neolithic',    color: '#9fd07a', frac: 0.32, age: 8000 },
    { id: 'whg',      label: 'Western Hunter-Gatherer', color: '#c79bff', frac: 0.14, age: 11000 },
    { id: 'ehg',      label: 'Eastern Hunter-Gatherer', color: '#7fb0ff', frac: 0.08, age: 9000 },
  ];

  // chromosome lengths (relative, 1..22 + X) — drives fiber lengths
  const CHR_LEN = [
    2.49, 2.42, 1.98, 1.90, 1.81, 1.71, 1.59, 1.45, 1.38, 1.34,
    1.35, 1.33, 1.14, 1.07, 1.02, 0.90, 0.83, 0.80, 0.59, 0.64,
    0.47, 0.51, 1.55,
  ];

  // ---------- named ancestors from registry hits (authentic PL records) ----------
  // depth = when in the dig they crystallize (0..1). Rare & precious.
  const NAMED = [
    { name: 'Katarzyna Wiśniewska', born: 1834, place: 'Płock',       source: 'Parish · St. Bartholomew',  certainty: 0.94, lineage: 'mt',   depth: 0.38, gen: 6 },
    { name: 'Jan Kowalczyk',        born: 1801, place: 'Sandomierz',  source: 'Civil register',            certainty: 0.88, lineage: 'auto', depth: 0.47, gen: 7 },
    { name: 'Marianna Lewandowska', born: 1779, place: 'Łomża',       source: 'Parish · baptism',          certainty: 0.81, lineage: 'mt',   depth: 0.56, gen: 8 },
    { name: 'Wojciech Zieliński',   born: 1748, place: 'Lublin',      source: 'Land registry',             certainty: 0.73, lineage: 'auto', depth: 0.66, gen: 9 },
    { name: 'Sebastian Mazur',      born: 1711, place: 'Przemyśl',    source: 'Parish · marriage',         certainty: 0.69, lineage: 'Y',    depth: 0.75, gen: 11 },
    { name: 'Agnieszka Dąbrowska',  born: 1683, place: 'Zamość',      source: 'GEDCOM · cross-matched',    certainty: 0.62, lineage: 'mt',   depth: 0.84, gen: 12 },
    { name: 'Stanisław Wróbel',     born: 1647, place: 'Kraków',      source: 'Guild record',              certainty: 0.55, lineage: 'Y',    depth: 0.92, gen: 14 },
  ];

  // ---------- uniparental haplogroup branch nodes (Y + mt deep splits) ----------
  const Y_HAPLO = [
    { label: 'R-M269',  ybp: 4500 },
    { label: 'R-L23',   ybp: 6200 },
    { label: 'R-M417',  ybp: 8500 },
    { label: 'R-M207',  ybp: 18500 },
  ];
  const MT_HAPLO = [
    { label: 'H1b',     ybp: 9000 },
    { label: 'H1',      ybp: 12500 },
    { label: 'H',       ybp: 20000 },
    { label: 'HV',      ybp: 28000 },
  ];

  // ---------- relatives (IBD matches) ----------
  function degreeFromCM(cM) {
    if (cM > 1300) return 'Parent / child';
    if (cM > 680) return 'Sibling';
    if (cM > 380) return '1st cousin';
    if (cM > 180) return '2nd cousin';
    if (cM > 60) return '3rd cousin';
    if (cM > 26) return '4th cousin';
    return '5th+ cousin';
  }
  function buildRelatives(rng) {
    const firstM = ['Tomasz','Piotr','Andrzej','Marek','Krzysztof','Paweł','Jakub','Michał','Adam','Grzegorz'];
    const firstF = ['Anna','Maria','Ewa','Zofia','Agata','Halina','Iwona','Dorota','Renata','Beata'];
    const last = ['Nowak','Kamiński','Sikora','Walczak','Górski','Pawlak','Witkowski','Adamczyk','Brzeziński','Czarnecki','Sokołowski','Urbański'];
    const rel = [];
    const N = 34;
    for (let i = 0; i < N; i++) {
      // degree distribution: a few close, many distant
      const r = rng();
      let cM, degree;
      if (r < 0.06)      { cM = lerp(900, 1700, rng()); degree = '1st cousin'; }
      else if (r < 0.2)  { cM = lerp(220, 560, rng());  degree = '2nd cousin'; }
      else if (r < 0.5)  { cM = lerp(70, 180, rng());   degree = '3rd cousin'; }
      else if (r < 0.8)  { cM = lerp(28, 65, rng());    degree = '4th cousin'; }
      else               { cM = lerp(8, 24, rng());     degree = '5th+ cousin'; }
      const fem = rng() < 0.5;
      const name = (fem ? firstF : firstM)[(rng() * 10) | 0] + ' ' + last[(rng() * last.length) | 0];
      rel.push({
        id: i, name, cM: Math.round(cM), degree,
        segments: Math.max(1, Math.round(cM / 45 + rng() * 2)),
        // placement seeds
        a: rng() * Math.PI * 2,
        b: 0.2 + rng() * 0.9,
        seed: rng() * 100,
      });
    }
    rel.sort((x, y) => y.cM - x.cM);
    return rel;
  }

  // ---------- the engine ----------
  class Engine {
    constructor(seed = 20240607) {
      this.seed = seed;
      const rng = mulberry32(seed);
      this.rng = rng;
      this.chrLen = CHR_LEN;

      // live state
      this.dig = 0.0;          // 0..1 overall dig depth (target)
      this.digSmoothed = 0.0;  // interpolated
      this.auto = true;        // engine digs on its own
      this.autoSpeed = 0.045;  // dig units per second
      this.lineage = 'auto';   // 'auto' | 'Y' | 'mt'  (focus)
      this.focusOrgan = null;  // hovered/selected organ key
      this.timeZoom = 0;       // 0..1 scroll-into-time

      // layers (activation 0..1 derived from dig)
      this.layers = { genome: 0, ibd: 0, coalescent: 0, uniparental: 0, ancient: 0, registry: 0 };

      // events
      this._listeners = [];
      this._evTimer = 0;
      this._namedFired = new Set();
      this._t = 0;

      // ingest the default dataset
      this.loadData(Engine.defaultData());
    }

    on(fn) { this._listeners.push(fn); }
    emit(ev) { for (const f of this._listeners) f(ev); }

    // depth (0..1 dig) at which a named ancestor crystallizes, from generation
    static depthForGen(gen) { return clamp(0.32 + ((gen - 5) / 10) * 0.63, 0.30, 0.96); }

    static defaultData() {
      const rng = mulberry32(20240607);
      return {
        profile: 'You',
        populations: POPULATIONS.map((p) => ({ ...p })),
        ancient: ANCIENT.map((a) => ({ ...a })),
        relatives: buildRelatives(rng).map((r) => ({ name: r.name, cM: r.cM, degree: r.degree })),
        named: NAMED.map((n) => ({ name: n.name, born: n.born, place: n.place, source: n.source, certainty: n.certainty, lineage: n.lineage, gen: n.gen })),
        yHaplo: Y_HAPLO.map((h) => ({ ...h })),
        mtHaplo: MT_HAPLO.map((h) => ({ ...h })),
      };
    }

    // ingest a (possibly user-authored) dataset and reset the dig
    loadData(data) {
      const rng = this.rng;
      this.profile = data.profile || 'You';

      // populations: keep as given, derive normalized weights for genome painting
      this.populations = (data.populations && data.populations.length ? data.populations : POPULATIONS)
        .map((p) => ({ label: p.label || 'Unknown', color: p.color || '#6fe3c2', frac: Math.max(0, +p.frac || 0), type: 'modern' }));
      const tot = this.populations.reduce((s, p) => s + p.frac, 0) || 1;
      this.populations.forEach((p) => (p.frac = p.frac / tot));

      this.ancient = (data.ancient || []).map((a) => ({
        label: a.label || 'Source', color: a.color || '#e9b66a',
        frac: Math.max(0, +a.frac || 0), age: Math.max(1000, +a.age || 6000),
      }));

      // Array.isArray: jawnie puste [] zostaje puste (droga archiwalna bez DNA = linie uśpione),
      // tylko brak pola (undefined) wpada w domyślny przykład. Uczciwość: bez DNA nie zmyślamy haplogrup.
      this.yHaplo = (Array.isArray(data.yHaplo) ? data.yHaplo : Y_HAPLO).map((h) => ({ label: h.label || 'R', ybp: +h.ybp || 5000 }));
      this.mtHaplo = (Array.isArray(data.mtHaplo) ? data.mtHaplo : MT_HAPLO).map((h) => ({ label: h.label || 'H', ybp: +h.ybp || 9000 }));

      // relatives: ensure placement seeds + segments
      this.relatives = (data.relatives || []).map((r, i) => ({
        id: i,
        name: r.name || 'Match ' + (i + 1),
        cM: Math.max(1, Math.round(+r.cM || 30)),
        degree: r.degree || degreeFromCM(+r.cM || 30),
        segments: r.segments || Math.max(1, Math.round((+r.cM || 30) / 45 + 1)),
        a: rng() * Math.PI * 2, b: 0.2 + rng() * 0.9, seed: rng() * 100,
      })).sort((x, y) => y.cM - x.cM);
      if (!this.relatives.length) this.relatives = buildRelatives(rng);

      // named ancestors: derive crystallization depth from generation
      this.named = (data.named || []).map((a) => ({
        name: a.name || 'Unknown', born: +a.born || 1800, place: a.place || '',
        source: a.source || 'Registry', certainty: clamp(+a.certainty || 0.7, 0, 1),
        lineage: a.lineage || 'auto', gen: Math.max(3, Math.round(+a.gen || 7)),
        depth: Engine.depthForGen(Math.max(3, Math.round(+a.gen || 7))),
      })).sort((x, y) => x.gen - y.gen);

      // reset live state
      this.dig = 0; this.digSmoothed = 0; this._namedFired.clear();
      for (const k in this.layers) this.layers[k] = 0;
      this.emit({ type: 'data-loaded' });
    }

    exportData() {
      return {
        profile: this.profile,
        populations: this.populations.map((p) => ({ label: p.label, color: p.color, frac: p.frac })),
        ancient: this.ancient.map((a) => ({ label: a.label, color: a.color, frac: a.frac, age: a.age })),
        relatives: this.relatives.map((r) => ({ name: r.name, cM: r.cM, degree: r.degree })),
        named: this.named.map((n) => ({ name: n.name, born: n.born, place: n.place, source: n.source, certainty: n.certainty, lineage: n.lineage, gen: n.gen })),
        yHaplo: this.yHaplo.map((h) => ({ ...h })),
        mtHaplo: this.mtHaplo.map((h) => ({ ...h })),
      };
    }

    setDig(v) { this.dig = clamp(v, 0, 1); this.auto = false; }
    setAuto(v) { this.auto = v; }
    setLineage(l) { this.lineage = l; this.emit({ type: 'lineage', lineage: l }); }

    update(dt) {
      this._t += dt;
      if (this.auto) {
        // ease the auto-dig so it slows as it goes deeper (harder to dig back)
        const resist = 1 - 0.6 * this.dig;
        this.dig = clamp(this.dig + this.autoSpeed * resist * dt, 0, 1);
      }
      // smooth toward target (so slider scrubs feel organic)
      this.digSmoothed += (this.dig - this.digSmoothed) * Math.min(1, dt * 3.0);
      const d = this.digSmoothed;

      // derive layer activations
      const prev = { ...this.layers };
      this.layers.genome      = smoothstep(0.00, 0.16, d);
      this.layers.ibd         = smoothstep(0.10, 0.36, d);
      this.layers.coalescent  = smoothstep(0.24, 0.60, d);
      this.layers.uniparental = smoothstep(0.48, 0.80, d);
      this.layers.ancient     = smoothstep(0.58, 0.92, d);
      this.layers.registry    = smoothstep(0.30, 1.00, d);

      // fire "layer awakened" growth pulses
      const thresh = 0.5;
      for (const k of Object.keys(this.layers)) {
        if (prev[k] < thresh && this.layers[k] >= thresh) {
          this.emit({ type: 'layer-awake', layer: k });
        }
      }

      // crystallize named ancestors as we cross their depth
      for (const a of this.named) {
        if (!this._namedFired.has(a.name) && d >= a.depth) {
          this._namedFired.add(a.name);
          this.emit({ type: 'named', ancestor: a });
        }
      }

      // streaming log events (engine "thinking")
      this._evTimer -= dt;
      if (this._evTimer <= 0) {
        this._evTimer = 0.5 + this.rng() * 0.7;
        this.emit({ type: 'log', text: this._mkLog(d) });
      }
    }

    _mkLog(d) {
      const T = (k, p) => (AE.t ? AE.t(k, p) : k);
      const L = (s) => (AE.tLabel ? AE.tLabel(s) : s);
      const D = (s) => (AE.tDegree ? AE.tDegree(s) : s);
      const r = this.rng();
      if (this.layers.genome < 0.5 || r < 0.22) {
        const p = this.populations[(this.rng() * this.populations.length) | 0];
        const chr = 1 + ((this.rng() * 22) | 0);
        return `${T('log.local')} · chr${chr} · ${L(p.label)} · ${(this.rng() * 40 + 5).toFixed(1)} cM`;
      }
      if (this.layers.ibd >= 0.5 && r < 0.45) {
        const rel = this.relatives[(this.rng() * this.relatives.length) | 0];
        return `${T('log.ibd')} · ${D(rel.degree)} · ${rel.cM} cM · ${rel.segments} ${T('log.segments')}`;
      }
      if (this.layers.coalescent >= 0.5 && r < 0.7) {
        const ybp = Math.round(lerp(280, 1400, this.rng()) / 10) * 10;
        return `${T('log.coal')} ~${ybp} ybp`;
      }
      if (this.layers.uniparental >= 0.5 && r < 0.86) {
        const hap = (this.rng() < 0.5 ? this.yHaplo : this.mtHaplo)[(this.rng() * 4) | 0];
        return `${T('log.uni')} · ${hap.label} · TMRCA ~${(hap.ybp / 1000).toFixed(1)} kybp`;
      }
      if (this.layers.ancient >= 0.5) {
        const a = this.ancient[(this.rng() * this.ancient.length) | 0];
        return `${T('log.admix')} · ${L(a.label)} · ${Math.round(a.frac * 100)}% · f-stat z=${(this.rng() * 6 + 2).toFixed(1)}`;
      }
      return `${T('log.scan')} ${(this.rng() * 22 | 0) + 1}…`;
    }
  }

  AE.Engine = Engine;
})();
