/*
  D-LOGIC ATLAS — kontroler (app.js)  [wersja 2]
  ==============================================
  Spina silnik + globus (realistyczna Ziemia, emoji) + dane na zywo + artykuly.
  Hover -> karta; klik -> DOSSIER (obszerny, algorytmiczny, zawsze swiezy) + kaskada;
  przycisk -> Monte Carlo + kombinatoryka compound; ⏸/▶ -> rotacja.
*/
import WorldEngine, { CAT_COLOR, CAT_PL } from './engine.js';
import Globe from './globe.js';
import Live from './live.js';
import buildArticle from './article.js';

const $ = (s, r = document) => r.querySelector(s);
const node = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const sP = (v) => Math.round(v * 100) + '%';

function heat(f) {
  const st = [[0, [46, 139, 122]], [35, [232, 178, 58]], [65, [232, 134, 90]], [100, [232, 72, 58]]];
  f = Math.max(0, Math.min(100, f));
  for (let i = 0; i < st.length - 1; i++) { const [a, ca] = st[i], [b, cb] = st[i + 1]; if (f <= b) { const t = (f - a) / (b - a || 1); const c = ca.map((v, k) => Math.round(v + (cb[k] - v) * t)); return `rgb(${c[0]},${c[1]},${c[2]})`; } }
  return 'rgb(232,72,58)';
}
const CATS = ['energy', 'precious', 'base-metal', 'battery-metal', 'grain', 'soft', 'fertilizer', 'industrial'];

async function main() {
  const eng = new WorldEngine(); await eng.load();
  for (const n of eng.nodes) { const st = eng.stat(n.commodity); n.fragility = st ? st.fragility : 0; n.fragColor = heat(n.fragility); n.icon = eng.iconFor(n); }

  $('#stat-nodes').textContent = eng.nodes.length;
  $('#stat-commodities').textContent = Object.values(eng.byCommodity).filter((b) => b.nodes.length).length;
  $('#stat-choke').textContent = eng.chokepoints.length;
  $('#stat-sources').textContent = eng.sources.filter((s) => s.wired).length + ' / ' + eng.sources.length;

  const globe = new Globe($('#atlas-canvas')).init();
  globe.enableBloom();
  globe.setData({ nodes: eng.nodes, chokepoints: eng.chokepoints, banks: eng.banks });

  // przycisk rotacji
  const rb = $('#rotate-btn');
  globe.onRotateChange = (v) => { rb.classList.toggle('on', v); rb.innerHTML = v ? '⏸ <span>auto-obrót</span>' : '▶ <span>zatrzymany</span>'; };
  rb.onclick = () => globe.toggleRotate();
  globe.onRotateChange(globe.autoRotate);

  // legenda + filtr kategorii
  const active = new Set(CATS); const legend = $('#legend'); const counts = {};
  for (const c of CATS) counts[c] = 0; for (const n of eng.nodes) counts[n.cat] = (counts[n.cat] || 0) + 1;
  for (const c of CATS) {
    const chip = node('button', 'lg-chip on', `<i style="background:${CAT_COLOR[c]}"></i><span>${CAT_PL[c]}</span><b>${counts[c] || 0}</b>`);
    chip.onclick = () => { chip.classList.toggle('on'); if (active.has(c)) active.delete(c); else active.add(c); globe.setCategoryFilter(active.size === CATS.length ? null : active); };
    legend.appendChild(chip);
  }

  // warstwy + tryb koloru
  const mkToggle = (label, on, fn) => { const b = node('button', 'tg' + (on ? ' on' : ''), label); b.onclick = () => { b.classList.toggle('on'); fn(b.classList.contains('on')); }; return b; };
  const lay = $('#layers');
  lay.appendChild(mkToggle('Złoża', true, (v) => globe.setLayerVisible('nodes', v)));
  lay.appendChild(mkToggle('Chokepointy', true, (v) => globe.setLayerVisible('choke', v)));
  lay.appendChild(mkToggle('Banki', true, (v) => globe.setLayerVisible('bank', v)));
  lay.appendChild(mkToggle('Kontury', true, (v) => globe.setLayerVisible('coast', v)));
  let frag = false;
  $('#colormode').onclick = () => { frag = !frag; globe.setColorMode(frag ? 'fragility' : 'category'); $('#colormode').textContent = frag ? 'Kolor: KRUCHOŚĆ' : 'Kolor: kategoria'; $('#colormode').classList.toggle('on', frag); };

  // rankingi: PageRank centralność + kruchość
  renderRank($('#rank-sys'), eng.centralityRanking().slice(0, 8), (b) => b.pr, (b) => Math.round(b.pr), eng, globe, '#E8B23A', false);
  renderRank($('#rank-frag'), eng.fragilityRanking().slice(0, 8), (b) => b.fragility, (b) => b.fragility + (b.spof ? ' ⚠' : ''), eng, globe, '#E8675A', true);

  // tooltip
  const tip = $('#tooltip'); let mx = 0, my = 0;
  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; if (tip.classList.contains('show')) place(tip, mx, my); });
  globe.onHover = (p) => { if (!p) { tip.classList.remove('show'); return; } tip.innerHTML = tipHTML(p, eng); tip.classList.add('show'); place(tip, mx, my); };

  // klik -> dossier + kaskada
  globe.onSelect = async (p) => {
    if (!p) { closePanel(globe); return; }
    if (p.type === 'bank') { showBank(p.item, eng); openPanel(); globe.clearArcs(); globe.highlight(null); return; }
    const o = p.item, cas = eng.cascade(o), from = { lat: o.lat, lng: o.lng }, arcs = [];
    cas.currencies.slice(0, 7).forEach((c) => arcs.push({ from, to: { lat: c.lat, lng: c.lng }, color: c.impact >= 0 ? '#4ADE80' : '#E8675A' }));
    cas.companies.filter((c) => c.lat != null).slice(0, 5).forEach((c) => arcs.push({ from, to: { lat: c.lat, lng: c.lng }, color: '#E8B23A' }));
    globe.drawArcs(arcs); globe.highlight(o.id);
    $('#detail-body').innerHTML = dossierLoading(p); openPanel();
    try { const art = await buildArticle(p, eng, Live); if ($('#detail').classList.contains('open')) $('#detail-body').innerHTML = art.html; }
    catch (e) { console.error(e); $('#detail-body').innerHTML = '<p class="muted">Nie udało się złożyć dossier.</p>'; }
  };

  // wyszukiwarka
  const si = $('#search-input'), sr = $('#search-results');
  si.addEventListener('input', () => {
    const q = si.value.trim().toLowerCase(); sr.innerHTML = ''; if (q.length < 2) return;
    const hits = [];
    for (const n of eng.nodes) if ((n.name + n.country + (eng.commodities[n.commodity]?.pl || '')).toLowerCase().includes(q)) hits.push({ t: 'złoże', it: n, ic: n.icon, ll: n, node: true });
    for (const c of eng.chokepoints) if ((c.pl + c.name).toLowerCase().includes(q)) hits.push({ t: 'chokepoint', it: c, ic: '⚠️', ll: c, choke: true });
    for (const c of eng.companies) if ((c.name + c.ticker).toLowerCase().includes(q) && c.hq) hits.push({ t: 'firma', it: c, ic: '🏢', ll: { lat: c.hq[0], lng: c.hq[1] } });
    hits.slice(0, 14).forEach((h) => {
      const r = node('button', 'sr-row', `<span>${h.ic} ${h.it.name || h.it.pl}</span><em>${h.t}</em>`);
      r.onclick = () => { globe.focus(h.ll.lat, h.ll.lng); if (h.node) globe.onSelect({ type: 'node', item: h.it }); else if (h.choke) globe.onSelect({ type: 'choke', item: h.it }); sr.innerHTML = ''; si.value = ''; };
      sr.appendChild(r);
    });
  });

  // Monte Carlo + kombinatoryka
  $('#sim-run').onclick = () => {
    const btn = $('#sim-run'); btn.disabled = true; $('#sim-status').textContent = 'liczenie 2000 scenariuszy + par compound...';
    setTimeout(() => { const res = eng.monteCarlo({ trials: 2000 }); const comp = eng.compoundRisks(6); renderSim(res, comp, eng); btn.disabled = false; $('#sim-status').textContent = `${res.trials} scenariuszy · ø ${res.expectedEvents.toFixed(1)} zakłóceń/rok`; }, 30);
  };

  // zamykanie
  $('#detail-close').onclick = () => closePanel(globe);
  $('#atlas-canvas').addEventListener('dblclick', () => closePanel(globe));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(globe); });
  $('#loading').classList.add('done');
}

function place(tip, x, y) { const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.min(x + 16, window.innerWidth - w - 12) + 'px'; tip.style.top = Math.min(Math.max(y - h / 2, 10), window.innerHeight - h - 10) + 'px'; }

function tipHTML(p, eng) {
  const it = p.item;
  if (p.type === 'choke') return `<b>⚠️ ${it.pl}</b><span class="t-sub">CHOKEPOINT</span><p>${it.throughput}</p><div class="t-row">prawd. zakłócenia / rok <b>${sP(it.annual_disruption_prob)}</b></div>`;
  if (p.type === 'bank') return `<b>🏛️ ${it.pl}</b><span class="t-sub">BANK CENTRALNY · ${it.ccy}</span><div class="t-row">stopa <b>${it.rate}%</b></div><div class="t-row">nastawienie <b>${it.stance}</b></div>`;
  const com = eng.commodities[it.commodity];
  return `<b>${it.icon || ''} ${it.name}</b><span class="t-sub" style="color:${CAT_COLOR[it.cat]}">${com ? com.pl : it.commodity} · ${it.country}</span><div class="t-row">udział w globalnej podaży <b>${it.share_pct}%</b></div><div class="t-row">kruchość surowca <b style="color:${heat(it.fragility)}">${it.fragility}/100</b></div><div class="t-row muted">klik otwiera pełne dossier</div>`;
}

function renderRank(box, list, val, label, eng, globe, color, frag) {
  box.innerHTML = ''; const max = Math.max(...list.map(val), 1);
  for (const b of list) {
    const row = node('button', 'rk-row', `<span class="rk-name">${b.com.pl}</span><span class="rk-bar"><i style="width:${val(b) / max * 100}%;background:${frag ? heat(b.fragility) : color}"></i></span><b>${label(b)}</b>`);
    row.title = `${b.topCountry}: ${sP(b.topShare)} podaży · ${b.nodes.length} złóż`;
    row.onclick = () => { const top = b.nodes.slice().sort((a, c) => c.share_pct - a.share_pct)[0]; if (top) { globe.focus(top.lat, top.lng); globe.onSelect({ type: 'node', item: top }); } };
    box.appendChild(row);
  }
}

function openPanel() { $('#detail').classList.add('open'); }
function closePanel(globe) { $('#detail').classList.remove('open'); if (globe) { globe.clearArcs(); globe.highlight(null); } }
function dossierLoading(p) { const it = p.item; return `<div class="art-hd"><span class="art-emoji">${it.icon || (p.type === 'choke' ? '⚠️' : '•')}</span><div><span class="d-eyebrow">DOSSIER</span><h3>${it.name || it.pl}</h3></div></div><p class="muted art-loading">Kompletowanie dossier… pobieranie danych na żywo (pogoda, FX).</p>`; }

function showBank(it, eng) {
  const cc = eng.ccy(it.ccy);
  $('#detail-body').innerHTML = `<div class="art-hd"><span class="art-emoji">🏛️</span><div><span class="d-eyebrow" style="color:#9BD17A">BANK CENTRALNY · ${it.ccy}</span><h3>${it.pl}</h3></div></div>` +
    `<p class="art-lede">${it.note}.</p>` +
    `<div class="art-sec"><h4>Polityka</h4><div class="art-stats"><span>stopa (ostatnia znana)<b>${it.rate}%</b></span><span>nastawienie<b>${it.stance}</b></span><span>stan na<b>${it.as_of}</b></span><span>waluta<b>${it.ccy} · ${cc ? cc.role : ''}</b></span></div></div>` +
    (cc ? `<div class="art-sec"><h4>Surowce napędzające ${it.ccy}</h4><div class="art-list">${(cc.drivers || []).map((d) => `<div class="art-row"><span>${eng.commodities[d.c]?.pl || d.c}</span><b>${sP(d.w)}</b></div>`).join('') || '<span class="muted">przystań / nabiał</span>'}</div></div>` : '') +
    `<p class="art-obs">Stopy przybliżone, do podpięcia na żywo (FRED / EBC) wg katalogu źródeł.</p>`;
}

function renderSim(res, compounds, eng) {
  const out = $('#sim-out');
  const maxS = Math.max(...res.topShock.map((c) => c.p95), 0.01);
  const shocks = res.topShock.slice(0, 9).map((c) => `<div class="sm-row"><span>${c.name}</span><span class="sm-bar"><i style="width:${c.p95 / maxS * 100}%;background:${heat(c.fragility)}"></i></span><b>${sP(c.p95)}</b></div>`).join('');
  const pf = res.portfolio;
  const comp = compounds.map((r) => `<div class="sm-row2"><span>${r.a} <em>+</em> ${r.b}</span><b>p ${(r.jointProb * 100).toFixed(2)}%</b></div>`).join('');
  out.innerHTML = `
    <div class="sm-sec"><h4>Najbardziej zagrożone surowce <span class="muted">(szok ceny P95/rok)</span></h4>${shocks}</div>
    <div class="sm-sec"><h4>Kombinatoryka: najgorsze scenariusze łączne</h4>${comp}<p class="muted" style="margin-top:5px">Pary źródeł zakłóceń wg dotkliwości łącznej (HHI×systemowość).</p></div>
    <div class="sm-sec"><h4>Portfel demo <span class="muted">(${pf.grossNotional} j.)</span></h4>
      <div class="sm-pf"><div><label>ø P&L</label><b class="${pf.mean >= 0 ? 'up' : 'dn'}">${pf.mean.toFixed(1)}</b></div>
      <div><label>VaR 95%</label><b class="dn">${pf.var95.toFixed(1)}</b></div>
      <div><label>najgorszy</label><b class="dn">${pf.worst.toFixed(1)}</b></div>
      <div><label>najlepszy</label><b class="up">${pf.best.toFixed(1)}</b></div></div></div>
    <p class="art-obs">Monte Carlo: losowe zakłócenia ${eng.nodes.length} złóż + ${eng.chokepoints.length} chokepointów wg hazardu kraju/typu. Rozkład RYZYKA scenariuszowego, nie prognoza.</p>`;
  out.classList.add('show');
}

main().catch((err) => { console.error(err); const l = document.getElementById('loading'); if (l) l.classList.add('done'); const f = document.getElementById('fatal'); if (f) { f.style.display = 'flex'; f.querySelector('p').textContent = String(err && err.message || err); } });
