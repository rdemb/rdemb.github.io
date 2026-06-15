/*
  D-LOGIC ATLAS — silnik swiata (engine.js)
  =========================================
  Czysty modul ES, zero zaleznosci. Laduje dane, buduje graf zaleznosci
  (zloze -> surowiec -> waluta / firma / chokepoint), liczy:
    * indeks kruchosci HHI (koncentracja podazy per surowiec),
    * hazard zaklocenia per zloze (typ x ryzyko kraju),
    * symulacje Monte Carlo "swiata" (rozklad szokow cenowych + wplyw na portfel),
    * deterministyczna kaskade (klik wezel -> kogo to rusza),
    * centralnosc (ktory surowiec najmocniej trzesie ukladem).

  DOKTRYNA OBSERVE_ONLY: to warstwa KONTEKSTU i scenariuszy "co-jesli",
  nie wyrocznia kierunku. Liczby surowcowe sa skalibrowane zgrubnie i datowane.
*/

// ---- bazowa sciezka do /atlas/data/ (niezaleznie od sciezki strony) ----
const DATA = new URL('./data/', import.meta.url);

// ---- mnoznik ryzyka kraju (nakladany na bazowy hazard typu zloza) ----
const COUNTRY_RISK = {
  'Democratic Republic of Congo': 2.2, 'Russia': 1.8, 'Iran': 2.1, 'Venezuela': 2.2,
  'Ukraine': 2.6, 'Nigeria': 1.9, 'Myanmar': 2.1, 'Iraq': 1.9, 'Libya': 2.3,
  'Belarus': 2.0, 'Ethiopia': 1.9, 'Zimbabwe': 1.8, 'Bolivia': 1.6, 'Mozambique': 1.6,
  "Cote d'Ivoire": 1.6, 'Sri Lanka': 1.6, 'Uzbekistan': 1.5, 'Jordan': 1.5, 'Israel': 1.5,
  'Taiwan': 1.5, 'Guinea': 1.7, 'Papua New Guinea': 1.7, 'Gabon': 1.6, 'New Caledonia': 1.4,
  'Zambia': 1.4, 'Mongolia': 1.4, 'Egypt': 1.4, 'Ghana': 1.4, 'Colombia': 1.4,
  'Argentina': 1.3, 'Peru': 1.35, 'Kazakhstan': 1.3, 'South Africa': 1.3, 'Saudi Arabia': 1.3,
  'Dominican Republic': 1.3, 'Paraguay': 1.4, 'Trinidad and Tobago': 1.3, 'Guyana': 1.4,
  'Mexico': 1.2, 'Indonesia': 1.2, 'Kuwait': 1.2, 'Namibia': 1.2, 'Morocco': 1.2,
  'Vietnam': 1.2, 'Thailand': 1.2, 'India': 1.1, 'Malaysia': 1.1, 'South Korea': 1.1,
  'China': 1.0, 'Brazil': 1.1, 'United Arab Emirates': 1.0, 'Qatar': 1.1, 'Japan': 0.9,
  'Netherlands': 0.85, 'Germany': 0.85, 'Belgium': 0.85, 'France': 0.8, 'Sweden': 0.8,
  'Singapore': 0.8, 'USA': 0.8, 'Australia': 0.8, 'Canada': 0.75, 'Norway': 0.7,
};

// ---- bazowy roczny hazard meaningful-disruption wg typu wezla ----
const TYPE_HAZARD = {
  'farm-belt': 0.08, 'plantation': 0.07, 'ammonia-plant': 0.06, 'export-port': 0.05, 'port': 0.05,
  'pgm-mine': 0.05, 'smelter': 0.05, 'refinery': 0.05, 'lng-terminal': 0.045, 'mine': 0.045,
  'gold-mine': 0.045, 'silver-mine': 0.045, 'uranium-mine': 0.045, 'coal-mine': 0.045,
  'potash-mine': 0.045, 'phosphate-mine': 0.045, 'oilfield': 0.04, 'gasfield': 0.04, 'fab': 0.035,
};

// skale prezentacyjne: o ile waluta/firma rusza sie na 1% szoku ceny surowca
// (beta < 1 — waluta nie chodzi 1:1 z surowcem; to scenariusz, nie prognoza)
const CCY_BETA = 0.35;
const CO_BETA = 0.6;

// ---- demonstracyjny portfel (pokazuje "ekspozycje" — w cockpicie podmienisz na swoj) ----
export const DEFAULT_PORTFOLIO = [
  { kind: 'fx', id: 'CAD', dir: +1, notional: 100, label: 'long CAD' },
  { kind: 'fx', id: 'AUD', dir: +1, notional: 100, label: 'long AUD' },
  { kind: 'fx', id: 'JPY', dir: -1, notional: 100, label: 'short JPY (long USD/JPY)' },
  { kind: 'fx', id: 'NOK', dir: +1, notional: 80, label: 'long NOK' },
  { kind: 'equity', id: 'bhp', dir: +1, notional: 120, label: 'long BHP' },
  { kind: 'equity', id: 'exxon', dir: +1, notional: 100, label: 'long ExxonMobil' },
  { kind: 'equity', id: 'nvidia', dir: +1, notional: 150, label: 'long NVIDIA' },
  { kind: 'equity', id: 'tsmc', dir: +1, notional: 120, label: 'long TSMC' },
];

// kolory kategorii (spojne z designem D-LOGIC; uzywane tez przez globus)
export const CAT_COLOR = {
  energy: '#E8675A', precious: '#E8B23A', 'base-metal': '#7FB3D5',
  'battery-metal': '#A78BFA', grain: '#9BD17A', soft: '#E59866', fertilizer: '#5DC7B8',
  industrial: '#E0E3E8',
};
export const CAT_PL = {
  energy: 'Energia', precious: 'Metale szlachetne', 'base-metal': 'Metale przemyslowe',
  'battery-metal': 'Metale baterii', grain: 'Zboza', soft: 'Surowce miekkie',
  fertilizer: 'Nawozy', industrial: 'Przemysl / logistyka',
};

// emoji per typ wezla (infrastruktura) i per surowiec (zloza)
const ICON_TYPE = { port: '⚓', 'export-port': '⚓', refinery: '🏭', smelter: '🏭', 'lng-terminal': '🔥', fab: '💻', 'ammonia-plant': '🧪', 'potash-mine': '🧪', 'phosphate-mine': '🧪' };
const ICON_COMMODITY = {
  crude_oil: '🛢️', natgas: '🔥', uranium: '☢️', coal: '⚫', gold: '🥇', silver: '🥈', platinum: '💍', palladium: '💍',
  copper: '🟤', iron_ore: '⛏️', bauxite_alumina: '🔩', aluminum: '🔩', nickel: '🔩', zinc: '🔩', tin: '🥫', lead: '🔋', manganese: '⛏️',
  lithium: '🔋', cobalt: '🔋', graphite: '✏️', rare_earths: '🧲', wheat: '🌾', corn: '🌽', soybean: '🫘', rice: '🌾',
  coffee: '☕', cocoa: '🍫', sugar: '🍬', palm_oil: '🌴', cotton: '🧵', natural_rubber: '🛞',
  potash: '🧪', phosphate: '🧪', nitrogen_ammonia: '🧪', semiconductors: '💻', shipping: '🚢',
};
// krytyczne miesiace (polkula N; dla lat<0 przesuwane o pol roku)
const SEASON = { wheat: [5, 6, 7], corn: [6, 7, 8], soybean: [7, 8], rice: [6, 7, 8, 9], coffee: [11, 0], cocoa: [10, 11, 0, 1], sugar: [8, 9, 10], cotton: [6, 7, 8], natural_rubber: [1, 2] };
const SEASON_LABEL = { wheat: 'nalewanie ziarna i zniwa (ryzyko suszy/upalu)', corn: 'zapylanie i nalewanie (lipcowa susza)', soybean: 'wypelnianie straczkow (sierpniowa susza)', rice: 'monsun i kwitnienie', coffee: 'okno mrozow (Brazylia)', cocoa: 'sucha Harmattan', sugar: 'dojrzewanie trzciny', cotton: 'kwitnienie i monsun', natural_rubber: 'pora sucha / wyciek lateksu' };

// deterministyczny RNG (mulberry32) — powtarzalne symulacje
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
function pct(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const i = clamp(Math.floor((p / 100) * (sortedAsc.length - 1)), 0, sortedAsc.length - 1);
  return sortedAsc[i];
}

export class WorldEngine {
  constructor() {
    this.nodes = []; this.commodities = {}; this.chokepoints = [];
    this.companies = []; this.currencies = []; this.banks = []; this.sources = [];
    this.byCommodity = {};
  }

  async load() {
    const get = async (f) => {
      const r = await fetch(new URL(f, DATA));
      if (!r.ok) throw new Error('Nie udalo sie wczytac ' + f + ' (' + r.status + ')');
      return r.json();
    };
    const [energy, metals, agro, logistics, commodities, chokepoints, companies, currencies, banks, sources] =
      await Promise.all([
        get('nodes_energy.json'), get('nodes_metals.json'), get('nodes_agro.json'),
        get('nodes_logistics.json'), get('commodities.json'), get('chokepoints.json'),
        get('companies.json'), get('currencies.json'), get('banks.json'), get('sources.json'),
      ]);

    // slownik surowcow
    for (const c of commodities) this.commodities[c.id] = c;
    this.chokepoints = chokepoints; this.companies = companies;
    this.currencies = currencies; this.banks = banks; this.sources = sources;

    // scal + oczysc wezly
    const merged = [...energy, ...metals, ...agro, ...logistics];
    const seen = new Set();
    for (const n of merged) {
      if (!n || seen.has(n.id)) continue;             // dedup po id
      seen.add(n.id);
      if (typeof n.lat !== 'number' || typeof n.lng !== 'number') continue;
      n.lat = clamp(n.lat, -89.9, 89.9);
      n.lng = ((n.lng + 540) % 360) - 180;            // normalizuj dlugosc do [-180,180]
      n.share_pct = Math.max(0, +n.share_pct || 0);
      const com = this.commodities[n.commodity];
      n.cat = com ? com.cat : 'industrial';
      n.color = CAT_COLOR[n.cat] || '#E0E3E8';
      n.hazard = this._hazard(n);
      this.nodes.push(n);
    }

    this._buildGraph();
    return this;
  }

  _hazard(n) {
    const base = TYPE_HAZARD[n.type] != null ? TYPE_HAZARD[n.type] : 0.05;
    const cr = COUNTRY_RISK[n.country] != null ? COUNTRY_RISK[n.country] : 1.2;
    return clamp(base * cr, 0.01, 0.6);
  }

  // ---- graf zaleznosci + statystyki per surowiec ----
  _buildGraph() {
    const byC = {};
    for (const id in this.commodities) {
      byC[id] = { id, com: this.commodities[id], nodes: [], country: {}, mapped: 0,
        currencies: [], companies: [], chokepoints: [] };
    }
    for (const n of this.nodes) {
      const b = byC[n.commodity]; if (!b) continue;
      b.nodes.push(n);
      b.country[n.country] = (b.country[n.country] || 0) + n.share_pct;
      b.mapped += n.share_pct;
    }
    // HHI po krajach (znormalizowany do udzialow zmapowanych) + kruchosc
    for (const id in byC) {
      const b = byC[id];
      const tot = sum(Object.values(b.country)) || 1;
      let hhi = 0, top = 0, topC = '-';
      for (const [country, s] of Object.entries(b.country)) {
        const frac = s / tot; hhi += frac * frac;
        if (frac > top) { top = frac; topC = country; }
      }
      b.hhi = hhi;                       // 0..1
      b.fragility = Math.round(hhi * 100); // 0..100
      b.topCountry = topC; b.topShare = top;
      b.spof = top > 0.5 || hhi > 0.4;   // single point of failure
    }
    // powiazania waluta/firma/chokepoint
    for (const ccy of this.currencies)
      for (const d of (ccy.drivers || []))
        if (byC[d.c]) byC[d.c].currencies.push(ccy.code);
    for (const co of this.companies)
      for (const cid of (co.commodities || []))
        if (byC[cid]) byC[cid].companies.push(co.id);
    for (const cp of this.chokepoints)
      for (const cid of (cp.commodities_at_risk || []))
        if (byC[cid]) byC[cid].chokepoints.push(cp.id);
    // centralnosc / "ile trzesie swiatem"
    for (const id in byC) {
      const b = byC[id];
      b.systemic = b.currencies.length * 1.0 + b.companies.length * 0.5 +
        b.chokepoints.length * 1.5 + b.fragility / 100 * 3;
    }
    this.byCommodity = byC;
  }

  stat(commodityId) { return this.byCommodity[commodityId]; }

  // surowce wg systemowosci (co najmocniej trzesie ukladem)
  systemicRanking() {
    return Object.values(this.byCommodity)
      .filter((b) => b.nodes.length)
      .sort((a, b) => b.systemic - a.systemic);
  }
  // surowce wg kruchosci (koncentracja podazy)
  // filtr pokrycia: liczymy HHI tylko gdy zmapowalismy sensowny kawalek rynku
  // (inaczej 2 wezly jednego kraju daja falszywe „100%")
  fragilityRanking() {
    return Object.values(this.byCommodity)
      .filter((b) => b.nodes.length >= 2 && b.mapped >= 8)
      .sort((a, b) => b.fragility - a.fragility);
  }

  iconFor(n) { return ICON_TYPE[n.type] || ICON_COMMODITY[n.commodity] || '•'; }

  // sezonowosc agro: czy biezacy miesiac to okno krytyczne (polkula uwzgledniona)
  seasonality(node, month) {
    let w = SEASON[node.commodity]; if (!w) return null;
    if (node.lat < 0) w = w.map((m) => (m + 6) % 12);
    const active = w.includes(month);
    const near = active || w.includes((month + 1) % 12) || w.includes((month + 11) % 12);
    return { active, near, label: SEASON_LABEL[node.commodity] || '', window: w };
  }

  // PageRank na grafie zaleznosci surowiec<->waluta/firma/chokepoint (centralnosc systemowa)
  pagerank() {
    if (this._pr) return this._pr;
    const adj = {};
    const add = (a, b, w) => { (adj[a] = adj[a] || {}); (adj[b] = adj[b] || {}); adj[a][b] = (adj[a][b] || 0) + w; adj[b][a] = (adj[b][a] || 0) + w; };
    for (const ccy of this.currencies) for (const d of (ccy.drivers || [])) add('x:' + ccy.code, 'c:' + d.c, d.w);
    for (const co of this.companies) for (const cid of (co.commodities || [])) add('f:' + co.id, 'c:' + cid, 1);
    for (const cp of this.chokepoints) for (const cid of (cp.commodities_at_risk || [])) add('k:' + cp.id, 'c:' + cid, 1.5);
    const ids = Object.keys(adj); const N = ids.length;
    if (!N) return (this._pr = { byId: {}, commodity: {}, top: [] });
    let pr = {}; ids.forEach((id) => (pr[id] = 1 / N));
    const out = {}; ids.forEach((id) => (out[id] = Object.values(adj[id]).reduce((a, b) => a + b, 0) || 1));
    const damp = 0.85;
    for (let it = 0; it < 50; it++) {
      const np = {}; ids.forEach((id) => (np[id] = (1 - damp) / N));
      for (const id of ids) { const sh = pr[id] * damp / out[id]; for (const nb in adj[id]) np[nb] += sh * adj[id][nb]; }
      pr = np;
    }
    const com = {}; let mx = 0;
    for (const id of ids) if (id[0] === 'c') { com[id.slice(2)] = pr[id]; if (pr[id] > mx) mx = pr[id]; }
    for (const k in com) com[k] = mx ? com[k] / mx * 100 : 0;
    const top = ids.map((id) => ({ id, score: pr[id] })).sort((a, b) => b.score - a.score).slice(0, 12);
    return (this._pr = { byId: pr, commodity: com, top });
  }
  centralityRanking() {
    const pr = this.pagerank().commodity;
    return Object.values(this.byCommodity).filter((b) => b.nodes.length)
      .map((b) => ({ ...b, pr: pr[b.id] || 0 })).sort((a, b) => b.pr - a.pr);
  }

  // KOMBINATORYKA: najgorsze LACZNE scenariusze (pary zrodel zaklocen)
  compoundRisks(topN = 8) {
    const nodesTop = this.nodes.slice().sort((a, b) => b.share_pct - a.share_pct).slice(0, 16);
    const sources = [
      ...this.chokepoints.map((c) => ({ o: c, prob: c.annual_disruption_prob || 0.05, label: c.pl || c.name })),
      ...nodesTop.map((n) => ({ o: n, prob: n.hazard, label: n.name })),
    ];
    const sysW = {}; for (const id in this.byCommodity) sysW[id] = this.byCommodity[id].systemic || 1;
    const out = [];
    for (let i = 0; i < sources.length; i++) for (let j = i + 1; j < sources.length; j++) {
      const a = sources[i], b = sources[j];
      const ca = this.cascade(a.o), cb = this.cascade(b.o);
      const merged = {};
      for (const k in ca.shock) merged[k] = ca.shock[k];
      for (const k in cb.shock) merged[k] = Math.max(merged[k] || 0, cb.shock[k]);
      let s = 0; for (const k in merged) s += merged[k] * (sysW[k] || 1);
      out.push({
        a: a.label, b: b.label, severity: s, jointProb: a.prob * b.prob, expected: s * a.prob * b.prob,
        commodities: Object.entries(merged).filter(([, v]) => v > 0.05).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k]) => this.commodities[k]?.pl || k),
      });
    }
    return out.sort((x, y) => y.severity - x.severity).slice(0, topN);
  }

  ccy(code) { return this.currencies.find((c) => c.code === code); }
  company(id) { return this.companies.find((c) => c.id === id); }

  // znak reakcji waluty na wzrost ceny surowca-drivera
  _ccySign(role) { return role === 'exporter' ? +1 : role === 'importer' ? -1 : 0; }
  // znak reakcji firmy na wzrost ceny surowca
  _coSign(role) {
    return role === 'producer' ? +1 : role === 'consumer' ? -1 :
      role === 'trader' ? +0.4 : role === 'infrastructure' ? +0.2 : 0;
  }

  /*
    KASKADA — deterministyczny scenariusz "co-jesli" z jednego wezla lub chokepointu.
    Zwraca szok ceny surowca i posortowana liste poruszonych walut i firm + luki na globus.
  */
  cascade(origin, opts = {}) {
    const kind = origin.commodities_at_risk ? 'chokepoint' : 'node';
    const sev = opts.severity != null ? opts.severity
      : (kind === 'chokepoint' ? (origin.severity || 0.4) : 0.5);

    // mapa: surowiec -> frakcja utraconej globalnej podazy w tym scenariuszu
    const loss = {};
    if (kind === 'node') {
      loss[origin.commodity] = clamp((origin.share_pct / 100) * sev, 0, 0.9);
    } else {
      for (const cid of origin.commodities_at_risk)
        loss[cid] = clamp(sev * 0.3, 0, 0.9); // chokepoint blokuje ~30% przeplywu surowca
    }

    // szok ceny per surowiec (mniejsza elastycznosc = wiekszy ruch)
    const shock = {};
    for (const cid in loss) {
      const el = (this.commodities[cid]?.elast) || 0.4;
      shock[cid] = clamp(loss[cid] / el, 0, 0.8);
    }

    // propagacja na waluty
    const ccyMap = {};
    for (const ccy of this.currencies) {
      let imp = 0;
      for (const d of (ccy.drivers || []))
        if (shock[d.c]) imp += shock[d.c] * d.w * this._ccySign(ccy.role);
      imp *= CCY_BETA;
      if (Math.abs(imp) > 1e-4)
        ccyMap[ccy.code] = { code: ccy.code, pl: ccy.pl, impact: imp, lat: ccy.lat, lng: ccy.lng };
    }
    // propagacja na firmy
    const coArr = [];
    for (const co of this.companies) {
      let imp = 0;
      for (const cid of (co.commodities || []))
        if (shock[cid]) imp += shock[cid] * this._coSign(co.role) * CO_BETA;
      if (Math.abs(imp) > 1e-4)
        coArr.push({ id: co.id, name: co.name, ticker: co.ticker, role: co.role,
          impact: imp, lat: co.hq ? co.hq[0] : null, lng: co.hq ? co.hq[1] : null });
    }

    const currencies = Object.values(ccyMap).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const companies = coArr.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    return { kind, origin, shock, loss, currencies, companies };
  }

  /*
    MONTE CARLO — symulacja roku swiata.
    N prob: losuj zaklocenia wezlow (Bernoulli(hazard)) i chokepointow,
    agreguj utrate podazy per surowiec -> szok ceny, policz wplyw na portfel.
  */
  monteCarlo(opts = {}) {
    const trials = opts.trials || 2000;
    const seed = opts.seed || 12345;
    const portfolio = opts.portfolio || DEFAULT_PORTFOLIO;
    const rng = mulberry32(seed);

    const cids = Object.keys(this.commodities);
    const shocks = {}; for (const c of cids) shocks[c] = [];
    const pnl = [];
    let evSum = 0;

    // pre-mapy do szybkiej propagacji portfela
    const ccyByCode = {}; for (const c of this.currencies) ccyByCode[c.code] = c;
    const coById = {}; for (const c of this.companies) coById[c.id] = c;

    for (let t = 0; t < trials; t++) {
      const loss = {}; let events = 0;
      for (const n of this.nodes) {
        if (rng() < n.hazard) {
          events++;
          const sev = 0.15 + rng() * 0.6;
          loss[n.commodity] = clamp((loss[n.commodity] || 0) + (n.share_pct / 100) * sev, 0, 0.95);
        }
      }
      for (const cp of this.chokepoints) {
        if (rng() < (cp.annual_disruption_prob || 0)) {
          events++;
          const sev = (cp.severity || 0.4) * (0.5 + rng() * 0.5);
          for (const cid of (cp.commodities_at_risk || []))
            loss[cid] = clamp((loss[cid] || 0) + sev * 0.3, 0, 0.95);
        }
      }
      evSum += events;

      // szok ceny per surowiec w tej probie
      const sh = {};
      for (const c of cids) {
        const l = loss[c] || 0;
        const el = this.commodities[c].elast || 0.4;
        const s = l > 0 ? clamp(l / el, 0, 0.8) : 0;
        sh[c] = s; shocks[c].push(s);
      }

      // P&L portfela w tej probie
      let p = 0;
      for (const pos of portfolio) {
        let move = 0;
        if (pos.kind === 'fx') {
          const ccy = ccyByCode[pos.id];
          if (ccy) for (const d of (ccy.drivers || [])) move += (sh[d.c] || 0) * d.w * this._ccySign(ccy.role);
          move *= CCY_BETA;
        } else {
          const co = coById[pos.id];
          if (co) for (const cid of (co.commodities || [])) move += (sh[cid] || 0) * this._coSign(co.role) * CO_BETA;
        }
        p += pos.notional * pos.dir * move;
      }
      pnl.push(p);
    }

    // statystyki per surowiec
    const perCommodity = cids.map((c) => {
      const s = shocks[c].slice().sort((a, b) => a - b);
      const over10 = s.filter((x) => x > 0.10).length / trials;
      const over25 = s.filter((x) => x > 0.25).length / trials;
      return {
        id: c, name: this.commodities[c].pl, cat: this.commodities[c].cat,
        mean: sum(s) / trials, p50: pct(s, 50), p90: pct(s, 90), p95: pct(s, 95),
        probOver10: over10, probOver25: over25, fragility: this.byCommodity[c]?.fragility || 0,
      };
    }).sort((a, b) => b.p95 - a.p95);

    const pnlSorted = pnl.slice().sort((a, b) => a - b);
    const portfolioStat = {
      mean: sum(pnl) / trials,
      var95: pct(pnlSorted, 5),    // 5-ty percentyl = strata w najgorszych 5%
      p25: pct(pnlSorted, 25), p75: pct(pnlSorted, 75), p95: pct(pnlSorted, 95),
      worst: pnlSorted[0], best: pnlSorted[pnlSorted.length - 1],
      grossNotional: sum(portfolio.map((p) => p.notional)),
    };

    return {
      trials, seed,
      expectedEvents: evSum / trials,
      perCommodity,
      topShock: perCommodity.slice(0, 12),
      portfolio: portfolioStat,
      portfolioPositions: portfolio,
    };
  }
}

export default WorldEngine;
