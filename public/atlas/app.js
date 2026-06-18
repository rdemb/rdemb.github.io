/*
  D-LOGIC ATLAS — kontroler (app.js)  [wersja 2]
  ==============================================
  Spina silnik + globus (realistyczna Ziemia, emoji) + dane na zywo + artykuly.
  Hover -> karta; klik -> DOSSIER (obszerny, algorytmiczny, zawsze swiezy) + kaskada;
  przycisk -> Monte Carlo + kombinatoryka compound; ⏸/▶ -> rotacja.
*/
import WorldEngine, { CAT_COLOR, CAT_PL, DEFAULT_PORTFOLIO } from './engine.js';
import Globe from './globe.js';
import Live from './live.js';
import buildArticle from './article.js';
import { t, T, td, LANG } from './i18n.js';

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

// ---- portfel: localStorage (lokalny what-if, zero backendu) ----
const PF_KEY = 'atlas-portfolio';
function loadPF() {
  try { const j = JSON.parse(localStorage.getItem(PF_KEY)); if (Array.isArray(j) && j.length) return j; } catch (e) {}
  return DEFAULT_PORTFOLIO.map((p) => ({ ...p }));
}
function savePF(pf) { try { localStorage.setItem(PF_KEY, JSON.stringify(pf)); } catch (e) {} }
function pfLabel(pos, eng) {
  if (pos.kind === 'fx') { const c = eng.ccy(pos.id); return c ? T`${pos.id} · ${c.pl}` : pos.id; }
  const c = eng.company(pos.id); return c ? T`${c.name}${c.ticker ? ' ' + c.ticker : ''}` : pos.id;
}

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
  globe.onRotateChange = (v) => { rb.classList.toggle('on', v); rb.innerHTML = v ? t('⏸ <span>auto-obrót</span>') : t('▶ <span>zatrzymany</span>'); };
  rb.onclick = () => globe.toggleRotate();
  globe.onRotateChange(globe.autoRotate);
  // dostepnosc: nie kreci globem, gdy uzytkownik prosi o ograniczony ruch
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) globe.setAutoRotate(false);

  // legenda + filtr kategorii
  const active = new Set(CATS); const legend = $('#legend'); const counts = {};
  for (const c of CATS) counts[c] = 0; for (const n of eng.nodes) counts[n.cat] = (counts[n.cat] || 0) + 1;
  for (const c of CATS) {
    const chip = node('button', 'lg-chip on', T`<i style="background:${CAT_COLOR[c]}"></i><span>${t(CAT_PL[c])}</span><b>${counts[c] || 0}</b>`);
    chip.onclick = () => { chip.classList.toggle('on'); if (active.has(c)) active.delete(c); else active.add(c); globe.setCategoryFilter(active.size === CATS.length ? null : active); };
    legend.appendChild(chip);
  }

  // warstwy + tryb koloru
  const mkToggle = (label, on, fn) => { const b = node('button', 'tg' + (on ? ' on' : ''), label); b.onclick = () => { b.classList.toggle('on'); fn(b.classList.contains('on')); }; return b; };
  const lay = $('#layers');
  lay.appendChild(mkToggle(t('Złoża'), true, (v) => globe.setLayerVisible('nodes', v)));
  lay.appendChild(mkToggle(t('Chokepointy'), true, (v) => globe.setLayerVisible('choke', v)));
  lay.appendChild(mkToggle(t('Banki'), true, (v) => globe.setLayerVisible('bank', v)));
  lay.appendChild(mkToggle(t('Kontury'), true, (v) => globe.setLayerVisible('coast', v)));
  let frag = false;
  $('#colormode').onclick = () => { frag = !frag; globe.setColorMode(frag ? 'fragility' : 'category'); $('#colormode').textContent = frag ? t('Kolor: KRUCHOŚĆ') : t('Kolor: kategoria'); $('#colormode').classList.toggle('on', frag); };

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
    try { const art = await buildArticle(p, eng, Live); if ($('#detail').classList.contains('open')) { $('#detail-body').innerHTML = art.html; appendBriefBar(p, eng); } }
    catch (e) { console.error(e); $('#detail-body').innerHTML = t('Nie udało się złożyć dossier.'); }
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
      const r = node('button', 'sr-row', T`<span>${h.ic} ${h.it.name || h.it.pl}</span><em>${h.t}</em>`);
      r.onclick = () => { globe.focus(h.ll.lat, h.ll.lng); if (h.node) globe.onSelect({ type: 'node', item: h.it }); else if (h.choke) globe.onSelect({ type: 'choke', item: h.it }); sr.innerHTML = ''; si.value = ''; };
      sr.appendChild(r);
    });
  });

  // ---- PORTFEL (lokalny, localStorage) + dekompozycja ekspozycji ----
  let portfolio = loadPF();
  const pfList = $('#pf-list'), pfAdd = $('#pf-add'), pfFoot = $('#pf-foot'), pfExp = $('#pf-exposure');
  function renderExposure() {
    const ex = eng.portfolioExposure(portfolio);
    if (!ex.rows.length) { pfExp.innerHTML = ''; return; }
    const max = Math.max(...ex.rows.map((r) => r.gross), 1);
    const top = ex.rows.slice(0, 5).map((r) => T`<div class="pf-exp-row"><span>${r.pl}</span><span class="pf-exp-bar"><i style="width:${r.gross / max * 100}%;background:${r.net >= 0 ? 'var(--live)' : 'var(--loss)'}"></i></span><b class="${r.net >= 0 ? 'up' : 'dn'}">${r.net >= 0 ? '+' : ''}${r.net.toFixed(0)}</b></div>`).join('');
    const warn = ex.hiddenCorr ? T`<div class="pf-warn">Ukryta korelacja: <b>${ex.topNet.pl}</b> to Twój największy kierunkowy zakład (netto ${ex.topNet.net >= 0 ? '+' : ''}${ex.topNet.net.toFixed(0)}, ${Math.round(ex.concentration * 100)}% ekspozycji netto, jednokierunkowy w ${Math.round(ex.topNet.oneWay * 100)}%). Te pozycje ruszają się razem, nie dywersyfikują.</div>` : '';
    const hedge = ex.hedged.length ? T`<div class="pf-hedge">Zhedgowane (duże brutto, małe netto): ${ex.hedged.map((h) => h.pl).join(', ')}.</div>` : '';
    pfExp.innerHTML = T`<div class="rail-label" style="margin-bottom:7px">Co rusza portfelem <span class="muted">· wrażliwość na +1 szok surowca</span></div>${top}${warn}${hedge}`;
  }
  function buildPF() {
    pfList.innerHTML = '';
    portfolio.forEach((pos, i) => {
      const row = node('div', 'pf-row', T`<span>${pfLabel(pos, eng)}</span><span class="pf-dir ${pos.dir >= 0 ? 'up' : 'dn'}">${pos.dir >= 0 ? 'long' : 'short'} ${pos.notional}</span>`);
      const x = node('button', 'pf-x', '✕'); x.title = 'usuń';
      x.onclick = () => { portfolio.splice(i, 1); savePF(portfolio); buildPF(); };
      row.appendChild(x); pfList.appendChild(row);
    });
    if (!portfolio.length) pfList.appendChild(node('div', 'muted', '<span style="font-size:11.5px">Pusto. Dodaj pozycje albo wróć do demo.</span>'));
    const gross = portfolio.reduce((a, p) => a + (p.notional || 0), 0);
    pfFoot.innerHTML = T`<span>brutto ${gross} j. · ${portfolio.length} poz.</span>`;
    const reset = node('button', 'pf-reset', 'reset do demo');
    reset.onclick = () => { portfolio = DEFAULT_PORTFOLIO.map((p) => ({ ...p })); savePF(portfolio); buildPF(); };
    pfFoot.appendChild(reset);
    renderExposure();
    $('#sim-out').classList.remove('show'); $('#sim-status').textContent = '';   // poprzedni wynik MC nieaktualny dla nowego portfela
  }
  (function buildAdd() {
    const kind = node('select'); kind.innerHTML = '<option value="fx">FX</option><option value="equity">akcja</option>';
    const idsel = node('select');
    const dir = node('select'); dir.innerHTML = '<option value="1">long</option><option value="-1">short</option>';
    const amt = node('input'); amt.type = 'number'; amt.value = '100'; amt.min = '1';
    const go = node('button', 'pf-go', '+'); go.title = 'dodaj pozycję';
    const fillIds = () => {
      idsel.innerHTML = '';
      const opts = kind.value === 'fx'
        ? eng.currencies.map((c) => ({ v: c.code, t: T`${c.code} · ${c.pl}` }))
        : eng.companies.slice().sort((a, b) => (b.mkt_cap_bn || 0) - (a.mkt_cap_bn || 0)).map((c) => ({ v: c.id, t: c.name }));
      for (const o of opts) { const e = node('option'); e.value = o.v; e.textContent = o.t; idsel.appendChild(e); }
    };
    kind.onchange = fillIds; fillIds();
    go.onclick = () => { portfolio.push({ kind: kind.value, id: idsel.value, dir: +dir.value, notional: Math.max(1, Math.round(+amt.value || 100)) }); savePF(portfolio); buildPF(); };
    pfAdd.append(kind, idsel, dir, amt, go);
  })();
  buildPF();

  // Monte Carlo + kombinatoryka (na bieżącym portfelu)
  $('#sim-run').onclick = () => {
    const btn = $('#sim-run'); btn.disabled = true; $('#sim-status').textContent = t('liczenie 2000 scenariuszy + par compound...');
    setTimeout(() => { const res = eng.monteCarlo({ trials: 2000, portfolio }); const comp = eng.compoundRisks(6); renderSim(res, comp, eng); btn.disabled = false; $('#sim-status').textContent = T`${res.trials} scenariuszy · ø ${res.expectedEvents.toFixed(1)} zakłóceń/rok`; }, 30);
  };

  // deep-link: /atlas/?focus=ghawar | ?commodity=crude_oil | ?choke=hormuz
  applyDeepLink(eng, globe);

  // zamykanie
  $('#detail-close').onclick = () => closePanel(globe);
  $('#atlas-canvas').addEventListener('dblclick', () => closePanel(globe));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(globe); });
  document.documentElement.lang = LANG;
  // SiteNav i mobile-gate maja data-pl/en/de -> tlumacz przez dataset[LANG]
  document.querySelectorAll('[data-en]').forEach((el) => { const v = el.getAttribute('data-' + LANG); if (v != null) el.textContent = v; });
  // rail Atlasu ma data-i18n (klucz=PL) -> t(); pomin elementy SiteNav (maja data-en) i brak trafienia (zostaw PL)
  document.querySelectorAll('[data-i18n]').forEach((el) => { if (el.hasAttribute('data-en')) return; const k = el.getAttribute('data-i18n'); const v = t(k); if (v && v !== k) el.textContent = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { const k = el.getAttribute('data-i18n-ph'); const v = t(k); if (v && v !== k) el.setAttribute('placeholder', v); });
  const langSeg = document.getElementById('lang');
  if (langSeg) {
    langSeg.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
    langSeg.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (!b) return; e.preventDefault(); try { localStorage.setItem('dlogic-lang', b.dataset.lang); } catch (err) {} location.reload(); });
  }
  $('#loading').classList.add('done');
}

function place(tip, x, y) { const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.min(x + 16, window.innerWidth - w - 12) + 'px'; tip.style.top = Math.min(Math.max(y - h / 2, 10), window.innerHeight - h - 10) + 'px'; }

function tipHTML(p, eng) {
  const it = p.item;
  if (p.type === 'choke') return T`<b>⚠️ ${it.pl}</b><span class="t-sub">CHOKEPOINT</span><p>${it.throughput}</p><div class="t-row">prawd. zakłócenia / rok <b>${sP(it.annual_disruption_prob)}</b></div>`;
  if (p.type === 'bank') return T`<b>🏛️ ${td('bank:' + it.id + ':pl', it.pl)}</b><span class="t-sub">BANK CENTRALNY · ${it.ccy}</span><div class="t-row">stopa <b>${it.rate}%</b></div><div class="t-row">nastawienie <b>${it.stance}</b></div>`;
  const com = eng.commodities[it.commodity];
  return T`<b>${it.icon || ''} ${it.name}</b><span class="t-sub" style="color:${CAT_COLOR[it.cat]}">${com ? td('commodity:' + it.commodity + ':pl', com.pl) : it.commodity} · ${it.country}</span><div class="t-row">udział w globalnej podaży <b>${it.share_pct}%</b></div><div class="t-row">kruchość surowca <b style="color:${heat(it.fragility)}">${it.fragility}/100</b></div><div class="t-row muted">klik otwiera pełne dossier</div>`;
}

function renderRank(box, list, val, label, eng, globe, color, frag) {
  box.innerHTML = ''; const max = Math.max(...list.map(val), 1);
  for (const b of list) {
    const row = node('button', 'rk-row', T`<span class="rk-name">${td('commodity:' + b.id + ':pl', b.com.pl)}</span><span class="rk-bar"><i style="width:${val(b) / max * 100}%;background:${frag ? heat(b.fragility) : color}"></i></span><b>${label(b)}</b>`);
    row.title = T`${b.topCountry}: ${sP(b.topShare)} podaży · ${b.nodes.length} złóż`;
    row.onclick = () => { const top = b.nodes.slice().sort((a, c) => c.share_pct - a.share_pct)[0]; if (top) { globe.focus(top.lat, top.lng); globe.onSelect({ type: 'node', item: top }); } };
    box.appendChild(row);
  }
}

// deep-link: skok do konkretnego wezla / surowca / chokepointu z URL (spina Atlas z Quant Desk / Capital)
function applyDeepLink(eng, globe) {
  const q = new URLSearchParams(location.search);
  const focus = q.get('focus'), commodity = q.get('commodity'), choke = q.get('choke');
  const topNode = (cid) => { const b = eng.byCommodity[cid]; return b && b.nodes.length ? b.nodes.slice().sort((a, c) => c.share_pct - a.share_pct)[0] : null; };
  let target = null, kind = 'node';
  if (choke) { const c = eng.chokepoints.find((x) => x.id === choke); if (c) { target = c; kind = 'choke'; } }
  if (!target && commodity) { const n = topNode(commodity); if (n) target = n; }
  if (!target && focus) {
    const n = eng.nodes.find((x) => x.id === focus); if (n) target = n;
    else { const c = eng.chokepoints.find((x) => x.id === focus); if (c) { target = c; kind = 'choke'; } else { const t = topNode(focus); if (t) target = t; } }
  }
  if (target) { globe.focus(target.lat, target.lng); setTimeout(() => globe.onSelect({ type: kind, item: target }), 420); }
}

// ---- BLOK DO BRIEFU FX (twardy gard jezykowy: warunkowo, zero targetow, zero kierunku) ----
function buildBriefText(p, eng) {
  const it = p.item, d = new Date();
  const date = T`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cas = eng.cascade(it);
  const roleCodes = (role) => cas.currencies.filter((c) => { const cc = eng.ccy(c.code); return cc && cc.role === role; }).slice(0, 4).map((c) => c.code);
  const exp = roleCodes('exporter'), imp = roleCodes('importer');
  const lines = [];
  if (p.type === 'choke') {
    const coms = (it.commodities_at_risk || []).map((c) => eng.commodities[c]?.pl || c);
    lines.push(`**Świat fizyczny: ${it.pl}.** ${it.throughput}.`);
    lines.push(`Scenariusz co-jeśli (nie prognoza): gdyby przepływ przez ${it.pl} został ograniczony, modelowa kaskada dotyka ${coms.join(', ')}.`);
  } else {
    const com = eng.commodities[it.commodity], shock = cas.shock[it.commodity] || 0;
    lines.push(`**Świat fizyczny: ${com.pl}.** ${it.name} (${it.country}) to około ${it.share_pct}% globalnej podaży (${it.source_type} / ${it.as_of}).`);
    lines.push(`Scenariusz co-jeśli (nie prognoza): gdyby ten węzeł wypadł, modelowy szok ceny ${com.pl.toLowerCase()} wyniósłby około ${sPct(shock)} przy elastyczności podaży ${com.elast}.`);
  }
  if (exp.length || imp.length) {
    const parts = [];
    if (exp.length) parts.push(`waluty eksporterów (${exp.join(', ')}) zyskiwałyby na drożejącym surowcu`);
    if (imp.length) parts.push(`waluty importerów (${imp.join(', ')}) byłyby pod presją terms of trade`);
    lines.push(`W tym hipotetycznym scenariuszu ${parts.join(', a ')}.`);
  }
  lines.push(`Bez celów cenowych i bez rekomendacji kierunku. Liczby kontekstowe, skalibrowane zgrubnie. OBSERVE_ONLY · ${date}.`);
  return lines.join('\n\n');
}
function appendBriefBar(p, eng) {
  if (p.type !== 'node' && p.type !== 'choke') return;
  const body = $('#detail-body'); if (!body) return;
  const bar = node('div', 'brief-bar');
  const btn = node('button', 'brief-btn', '⧉ Kopiuj blok „świat fizyczny" do briefu');
  btn.onclick = async () => {
    const text = buildBriefText(p, eng);
    try { await navigator.clipboard.writeText(text); btn.textContent = '✓ skopiowano (warunkowo, bez kierunku)'; }
    catch (e) { let ta = bar.querySelector('textarea'); if (!ta) { ta = node('textarea', 'brief-ta'); bar.appendChild(ta); } ta.value = text; ta.select(); btn.textContent = '↑ zaznacz i skopiuj ręcznie'; }
    setTimeout(() => { btn.textContent = '⧉ Kopiuj blok „świat fizyczny" do briefu'; }, 2600);
  };
  bar.appendChild(btn);
  body.appendChild(bar);
}

function openPanel() { $('#detail').classList.add('open'); }
function closePanel(globe) { $('#detail').classList.remove('open'); if (globe) { globe.clearArcs(); globe.highlight(null); } }
function dossierLoading(p) { const it = p.item; return T`<div class="art-hd"><span class="art-emoji">${it.icon || (p.type === 'choke' ? '⚠️' : '•')}</span><div><span class="d-eyebrow">DOSSIER</span><h3>${it.name || it.pl}</h3></div></div><p class="muted art-loading">Kompletowanie dossier… pobieranie danych na żywo (pogoda, FX).</p>`; }

function showBank(it, eng) {
  const cc = eng.ccy(it.ccy);
  $('#detail-body').innerHTML = T`<div class="art-hd"><span class="art-emoji">🏛️</span><div><span class="d-eyebrow" style="color:#9BD17A">BANK CENTRALNY · ${it.ccy}</span><h3>${td('bank:' + it.id + ':pl', it.pl)}</h3></div></div>` +
    T`<p class="art-lede">${td('bank:' + it.id + ':note', it.note)}.</p>` +
    T`<div class="art-sec"><h4>Polityka</h4><div class="art-stats"><span>stopa (ostatnia znana)<b>${it.rate}%</b></span><span>nastawienie<b>${it.stance}</b></span><span>stan na<b>${it.as_of}</b></span><span>waluta<b>${it.ccy} · ${cc ? cc.role : ''}</b></span></div></div>` +
    (cc ? T`<div class="art-sec"><h4>Surowce napędzające ${it.ccy}</h4><div class="art-list">${(cc.drivers || []).map((d) => T`<div class="art-row"><span>${eng.commodities[d.c]?.pl || d.c}</span><b>${sP(d.w)}</b></div>`).join('') || '<span class="muted">przystań / nabiał</span>'}</div></div>` : '') +
    T`<p class="art-obs">Stopy przybliżone, do podpięcia na żywo (FRED / EBC) wg katalogu źródeł.</p>`;
}

function renderSim(res, compounds, eng) {
  const out = $('#sim-out');
  const maxS = Math.max(...res.topShock.map((c) => c.p95), 0.01);
  const shocks = res.topShock.slice(0, 9).map((c) => T`<div class="sm-row"><span>${c.name}</span><span class="sm-bar"><i style="width:${c.p95 / maxS * 100}%;background:${heat(c.fragility)}"></i></span><b>${sP(c.p95)}</b></div>`).join('');
  const pf = res.portfolio;
  const comp = compounds.map((r) => T`<div class="sm-row2"><span>${r.a} <em>+</em> ${r.b}</span><b>p ${(r.jointProb * 100).toFixed(2)}%</b></div>`).join('');
  out.innerHTML = `
    <div class="sm-sec"><h4>Najbardziej zagrożone surowce <span class="muted">(szok ceny P95/rok)</span></h4>${shocks}</div>
    <div class="sm-sec"><h4>Kombinatoryka: najgorsze scenariusze łączne</h4>${comp}<p class="muted" style="margin-top:5px">Pary źródeł zakłóceń wg dotkliwości łącznej (HHI×systemowość).</p></div>
    <div class="sm-sec"><h4>Twój portfel <span class="muted">(${pf.grossNotional} j.)</span></h4>
      <div class="sm-pf"><div><label>ø P&L</label><b class="${pf.mean >= 0 ? 'up' : 'dn'}">${pf.mean.toFixed(1)}</b></div>
      <div><label>dolne 5% (P5)</label><b class="${pf.var95 < 0 ? 'dn' : 'up'}">${pf.var95.toFixed(1)}</b></div>
      <div><label>najgorszy</label><b class="${pf.worst < 0 ? 'dn' : 'up'}">${pf.worst.toFixed(1)}</b></div>
      <div><label>najlepszy</label><b class="up">${pf.best.toFixed(1)}</b></div></div></div>
    <p class="art-obs">Monte Carlo: losowe zakłócenia ${eng.nodes.length} złóż + ${eng.chokepoints.length} chokepointów wg hazardu kraju/typu. Szoki są jednokierunkowe (podażowe, cena w górę), więc strata pojawia się tylko dla pozycji tracących na drożejącym surowcu (short eksportera, long importera). Rozkład ekspozycji scenariuszowej, nie prognoza. Parametry modelu: ${eng.params ? eng.params.source_type + ' / ' + eng.params.as_of : 'wbudowane'}.</p>`;
  out.classList.add('show');
}

main().catch((err) => { console.error(err); const l = document.getElementById('loading'); if (l) l.classList.add('done'); const f = document.getElementById('fatal'); if (f) { f.style.display = 'flex'; f.querySelector('p').textContent = String(err && err.message || err); } });
