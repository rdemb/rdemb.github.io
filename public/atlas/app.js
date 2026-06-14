/*
  D-LOGIC ATLAS — kontroler (app.js)
  ==================================
  Spina silnik (engine.js) z globusem (globe.js) i interfejsem.
  Hover -> karta; klik -> panel + KASKADA (luki na globusie); przycisk -> Monte Carlo.
*/
import WorldEngine, { CAT_COLOR, CAT_PL } from './engine.js';
import Globe from './globe.js';

const $ = (s, r = document) => r.querySelector(s);
const node = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const sP = (v) => (v * 100).toFixed(0) + '%';

// rampa „kruchosci": spokojny zielony -> bursztyn -> czerwien
function heat(f) {
  const stops = [[0, [46, 139, 122]], [35, [232, 178, 58]], [65, [232, 134, 90]], [100, [232, 72, 58]]];
  f = Math.max(0, Math.min(100, f));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i], [b, cb] = stops[i + 1];
    if (f <= b) { const t = (f - a) / (b - a || 1); const c = ca.map((v, k) => Math.round(v + (cb[k] - v) * t)); return `rgb(${c[0]},${c[1]},${c[2]})`; }
  }
  return 'rgb(232,72,58)';
}

const CATS = ['energy', 'precious', 'base-metal', 'battery-metal', 'grain', 'soft', 'fertilizer', 'industrial'];

async function main() {
  const eng = new WorldEngine();
  await eng.load();

  // wzbogac wezly o kolor kruchosci + liczbe fragility
  for (const n of eng.nodes) { const st = eng.stat(n.commodity); n.fragility = st ? st.fragility : 0; n.fragColor = heat(n.fragility); }

  // statystyki naglowka
  $('#stat-nodes').textContent = eng.nodes.length;
  $('#stat-commodities').textContent = Object.values(eng.byCommodity).filter((b) => b.nodes.length).length;
  $('#stat-choke').textContent = eng.chokepoints.length;
  $('#stat-sources').textContent = eng.sources.length;

  // ---- globus ----
  const globe = new Globe($('#atlas-canvas')).init();
  globe.enableBloom();
  globe.setData({ nodes: eng.nodes, chokepoints: eng.chokepoints, banks: eng.banks });

  // ---- legenda + filtr kategorii ----
  const active = new Set(CATS);
  const legend = $('#legend');
  const counts = {}; for (const c of CATS) counts[c] = 0;
  for (const n of eng.nodes) counts[n.cat] = (counts[n.cat] || 0) + 1;
  for (const c of CATS) {
    const chip = node('button', 'lg-chip on');
    chip.innerHTML = `<i style="background:${CAT_COLOR[c]}"></i><span>${CAT_PL[c]}</span><b>${counts[c] || 0}</b>`;
    chip.onclick = () => {
      chip.classList.toggle('on');
      if (active.has(c)) active.delete(c); else active.add(c);
      globe.setCategoryFilter(active.size === CATS.length ? null : active);
    };
    legend.appendChild(chip);
  }

  // ---- warstwy + tryb koloru ----
  const mkToggle = (label, on, fn) => { const b = node('button', 'tg' + (on ? ' on' : '')); b.textContent = label; b.onclick = () => { b.classList.toggle('on'); fn(b.classList.contains('on')); }; return b; };
  const lay = $('#layers');
  lay.appendChild(mkToggle('Zloza', true, (v) => globe.setLayerVisible('nodes', v)));
  lay.appendChild(mkToggle('Chokepointy', true, (v) => globe.setLayerVisible('choke', v)));
  lay.appendChild(mkToggle('Banki centr.', true, (v) => globe.setLayerVisible('bank', v)));
  lay.appendChild(mkToggle('Kontury', true, (v) => globe.setLayerVisible('coast', v)));

  let frag = false;
  $('#colormode').onclick = () => { frag = !frag; globe.setColorMode(frag ? 'fragility' : 'category'); $('#colormode').textContent = frag ? 'Kolor: KRUCHOSC' : 'Kolor: kategoria'; $('#colormode').classList.toggle('on', frag); };

  // ---- rankingi ----
  renderRank($('#rank-sys'), eng.systemicRanking().slice(0, 8), (b) => b.systemic, (b) => b.systemic.toFixed(1), eng, globe, '#E8B23A');
  renderRank($('#rank-frag'), eng.fragilityRanking().slice(0, 8), (b) => b.fragility, (b) => b.fragility + (b.spof ? ' ⚠' : ''), eng, globe, '#E8675A', true);

  // ---- tooltip ----
  const tip = $('#tooltip'); let mx = 0, my = 0;
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; if (tip.classList.contains('show')) place(tip, mx, my); });
  globe.onHover = (p) => {
    if (!p) { tip.classList.remove('show'); return; }
    tip.innerHTML = tipHTML(p, eng);
    tip.classList.add('show'); place(tip, mx, my);
  };

  // ---- klik -> panel + kaskada ----
  globe.onSelect = (p) => {
    if (!p) { closePanel(globe); return; }
    if (p.type === 'bank') return showBank(p.item, eng);
    const origin = p.item;
    const cas = eng.cascade(origin);
    showCascade(p, cas, eng);
    // luki: origin -> top waluty + top firmy z hq
    const from = { lat: origin.lat, lng: origin.lng };
    const arcs = [];
    cas.currencies.slice(0, 7).forEach((c) => arcs.push({ from, to: { lat: c.lat, lng: c.lng }, color: c.impact >= 0 ? '#4ADE80' : '#E8675A' }));
    cas.companies.filter((c) => c.lat != null).slice(0, 5).forEach((c) => arcs.push({ from, to: { lat: c.lat, lng: c.lng }, color: '#E8B23A' }));
    globe.drawArcs(arcs);
    globe.highlight(origin.id);
  };

  // ---- wyszukiwarka ----
  const si = $('#search-input'), sr = $('#search-results');
  si.addEventListener('input', () => {
    const q = si.value.trim().toLowerCase(); sr.innerHTML = '';
    if (q.length < 2) return;
    const hits = [];
    for (const n of eng.nodes) if ((n.name + n.country + (eng.commodities[n.commodity]?.pl || '')).toLowerCase().includes(q)) hits.push({ t: 'zloze', it: n, ll: n });
    for (const c of eng.companies) if ((c.name + c.ticker).toLowerCase().includes(q) && c.hq) hits.push({ t: 'firma', it: c, ll: { lat: c.hq[0], lng: c.hq[1] } });
    hits.slice(0, 14).forEach((h) => {
      const r = node('button', 'sr-row', `<span>${h.it.name}</span><em>${h.t}</em>`);
      r.onclick = () => { globe.focus(h.ll.lat, h.ll.lng); if (h.t === 'zloze') globe.onSelect({ type: 'node', item: h.it }); sr.innerHTML = ''; si.value = ''; };
      sr.appendChild(r);
    });
  });

  // ---- Monte Carlo ----
  $('#sim-run').onclick = () => {
    const btn = $('#sim-run'); btn.disabled = true; $('#sim-status').textContent = 'liczenie 2000 scenariuszy roku...';
    setTimeout(() => { const res = eng.monteCarlo({ trials: 2000 }); renderSim(res, eng); btn.disabled = false; $('#sim-status').textContent = `${res.trials} scenariuszy · ø ${res.expectedEvents.toFixed(1)} zaklocen/rok`; }, 30);
  };

  // zamykanie panelu
  $('#detail-close').onclick = () => closePanel(globe);
  $('#atlas-canvas').addEventListener('dblclick', () => closePanel(globe));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(globe); });
  $('#loading').classList.add('done');
}

function place(tip, x, y) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(x + 16, window.innerWidth - w - 12) + 'px';
  tip.style.top = Math.min(Math.max(y - h / 2, 10), window.innerHeight - h - 10) + 'px';
}

function tipHTML(p, eng) {
  const it = p.item;
  if (p.type === 'choke') return `<b>${it.pl}</b><span class="t-sub">CHOKEPOINT</span><p>${it.throughput}</p><div class="t-row">prawd. zaklocenia / rok <b>${sP(it.annual_disruption_prob)}</b></div>`;
  if (p.type === 'bank') { const cc = eng.ccy(it.ccy); return `<b>${it.pl}</b><span class="t-sub">BANK CENTRALNY · ${it.ccy}</span><div class="t-row">stopa <b>${it.rate}%</b></div><div class="t-row">nastawienie <b>${it.stance}</b></div>`; }
  const com = eng.commodities[it.commodity];
  return `<b>${it.name}</b><span class="t-sub" style="color:${CAT_COLOR[it.cat]}">${com ? com.pl : it.commodity} · ${it.country}</span><div class="t-row">udzial w globalnej podazy <b>${it.share_pct}%</b></div><div class="t-row">kruchosc surowca <b style="color:${heat(it.fragility)}">${it.fragility}/100</b></div>`;
}

function renderRank(box, list, val, label, eng, globe, color, frag) {
  box.innerHTML = '';
  const max = Math.max(...list.map(val), 1);
  for (const b of list) {
    const row = node('button', 'rk-row');
    row.innerHTML = `<span class="rk-name">${b.com.pl}</span><span class="rk-bar"><i style="width:${(val(b) / max * 100)}%;background:${frag ? heat(b.fragility) : color}"></i></span><b>${label(b)}</b>`;
    row.title = `${b.topCountry}: ${sP(b.topShare)} podazy · ${b.nodes.length} zloz`;
    row.onclick = () => { const top = b.nodes.slice().sort((a, c) => c.share_pct - a.share_pct)[0]; if (top) { globe.focus(top.lat, top.lng); globe.onSelect({ type: 'node', item: top }); } };
    box.appendChild(row);
  }
}

function panelEl() { return $('#detail'); }
function closePanel(globe) { panelEl().classList.remove('open'); if (globe) { globe.clearArcs(); globe.highlight(null); } }

function showCascade(p, cas, eng) {
  const it = p.item;
  const isChoke = p.type === 'choke';
  const com = isChoke ? null : eng.commodities[it.commodity];
  const st = isChoke ? null : eng.stat(it.commodity);
  const shockLines = Object.entries(cas.shock).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([cid, v]) => `<div class="cs-row"><span>${eng.commodities[cid]?.pl || cid}</span><b class="up">${sPct(v)}</b></div>`).join('');
  const ccy = cas.currencies.slice(0, 8).map((c) => `<div class="cs-row"><span>${c.code} · ${c.pl}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<p class="muted">brak bezposrednich powiazan walutowych</p>';
  const co = cas.companies.slice(0, 8).map((c) => `<div class="cs-row"><span>${c.name}<em>${c.ticker}</em></span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<p class="muted">brak bezposrednich powiazan korporacyjnych</p>';

  const head = isChoke
    ? `<span class="d-eyebrow" style="color:#E8675A">CHOKEPOINT</span><h3>${it.pl}</h3><p class="d-note">${it.note}</p>
       <div class="d-grid"><div><label>przepustowosc</label><b>${it.throughput}</b></div><div><label>prawd. / rok</label><b>${sP(it.annual_disruption_prob)}</b></div><div><label>dotkliwosc</label><b>${sP(it.severity)}</b></div><div><label>objazd</label><b>${(it.alt_routes || []).join('; ') || '-'}</b></div></div>`
    : `<span class="d-eyebrow" style="color:${CAT_COLOR[it.cat]}">${(com ? com.pl : it.commodity).toUpperCase()} · ${it.country}</span><h3>${it.name}</h3><p class="d-note">${it.note}</p>
       <div class="d-grid"><div><label>operator</label><b>${it.operator}</b></div><div><label>udzial globalny</label><b>${it.share_pct}%</b></div><div><label>moc</label><b>${it.capacity}</b></div><div><label>zrodlo</label><b>${it.source_type} · ${it.as_of}</b></div></div>
       ${st ? `<div class="d-frag"><label>kruchosc surowca (HHI koncentracji)</label><div class="rk-bar"><i style="width:${st.fragility}%;background:${heat(st.fragility)}"></i></div><span class="muted">${st.topCountry}: ${sP(st.topShare)} podazy · ${st.fragility}/100 ${st.spof ? '· ⚠ single point of failure' : ''}</span></div>` : ''}`;

  $('#detail-body').innerHTML = `${head}
    <div class="d-sec"><h4>Scenariusz „co-jesli" → szok ceny</h4>${shockLines}</div>
    <div class="d-sec"><h4>Reakcja walut</h4>${ccy}</div>
    <div class="d-sec"><h4>Reakcja firm</h4>${co}</div>
    <p class="d-obs">OBSERVE_ONLY — deterministyczny scenariusz kaskady, nie prognoza kierunku. Skala szoku = utrata podazy / elastycznosc.</p>`;
  panelEl().classList.add('open');
}

function showBank(it, eng) {
  const cc = eng.ccy(it.ccy);
  $('#detail-body').innerHTML = `<span class="d-eyebrow" style="color:#9BD17A">BANK CENTRALNY · ${it.ccy}</span><h3>${it.pl}</h3><p class="d-note">${it.note}</p>
    <div class="d-grid"><div><label>stopa (ostatnia znana)</label><b>${it.rate}%</b></div><div><label>nastawienie</label><b>${it.stance}</b></div><div><label>stan na</label><b>${it.as_of}</b></div><div><label>waluta</label><b>${it.ccy} · ${cc ? cc.role : ''}</b></div></div>
    ${cc ? `<div class="d-sec"><h4>Surowce napedzajace ${it.ccy}</h4>${(cc.drivers || []).map((d) => `<div class="cs-row"><span>${eng.commodities[d.c]?.pl || d.c}</span><b>${sP(d.w)}</b></div>`).join('') || '<p class="muted">brak (przystan / nabial)</p>'}</div>` : ''}
    <p class="d-obs">Stopy przybliżone, do podpięcia na żywo (FRED / EBC / API banków) wg katalogu źródeł.</p>`;
  panelEl().classList.add('open');
}

function renderSim(res, eng) {
  const out = $('#sim-out');
  const maxS = Math.max(...res.topShock.map((c) => c.p95), 0.01);
  const shocks = res.topShock.slice(0, 10).map((c) => `<div class="sm-row"><span>${c.name}</span><span class="sm-bar"><i style="width:${(c.p95 / maxS * 100)}%;background:${heat(c.fragility)}"></i></span><b>${sP(c.p95)}</b></div>`).join('');
  const pf = res.portfolio;
  out.innerHTML = `
    <div class="sm-sec"><h4>Najbardziej zagrozone surowce <span class="muted">(szok ceny, P95 / rok)</span></h4>${shocks}</div>
    <div class="sm-sec"><h4>Portfel demo <span class="muted">(${pf.grossNotional} j. brutto)</span></h4>
      <div class="sm-pf"><div><label>oczekiwany P&L</label><b class="${pf.mean >= 0 ? 'up' : 'dn'}">${pf.mean.toFixed(1)}</b></div>
      <div><label>VaR 95% (strata)</label><b class="dn">${pf.var95.toFixed(1)}</b></div>
      <div><label>najgorszy scenariusz</label><b class="dn">${pf.worst.toFixed(1)}</b></div>
      <div><label>najlepszy</label><b class="up">${pf.best.toFixed(1)}</b></div></div>
      <p class="muted" style="margin-top:8px">${res.portfolioPositions.map((p) => p.label).join(' · ')}</p>
    </div>
    <p class="d-obs">Monte Carlo: losowe zaklocenia ${eng.nodes.length} zloz + ${eng.chokepoints.length} chokepointow wg hazardu kraju/typu. To rozklad RYZYKA scenariuszowego, nie prognoza.</p>`;
  out.classList.add('show');
}

main().catch((err) => {
  console.error(err);
  const l = document.getElementById('loading');
  if (l) { l.classList.add('done'); }
  const f = document.getElementById('fatal');
  if (f) { f.style.display = 'flex'; f.querySelector('p').textContent = String(err && err.message || err); }
});
