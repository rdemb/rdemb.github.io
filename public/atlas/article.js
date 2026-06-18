/*
  D-LOGIC ATLAS — generator artykulow (article.js)
  ================================================
  CZYSTO ALGORYTMICZNA generacja języka (NLG): gramatyka + progi danych +
  kombinatoryka wariantów zdań. ZERO LLM. Deterministyczna (wariancja z hasha id),
  ZAWSZE ŚWIEŻA (statystyki silnika liczone na bieżąco + dane na żywo + timestamp).
  Zwraca {title, html} dla węzła lub chokepointu.
*/

import { T, t, td } from './i18n.js';

const MON = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'].map(t);
function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const pick = (arr, seed) => arr[hash(seed) % arr.length];
const sPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const sP = (v) => Math.round(v * 100) + '%';
function nowStr() { const d = new Date(); return T`${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function capBn(n) { if (!n) return null; return n >= 1000 ? (n / 1000).toFixed(1) + ' bln USD' : Math.round(n) + ' mld USD'; }

function spark(vals, { w = 200, h = 38, color = '#E8B23A', area = true } = {}) {
  const v = (vals || []).filter((x) => typeof x === 'number');
  if (v.length < 2) return '';
  const mn = Math.min(...v), mx = Math.max(...v), rng = (mx - mn) || 1;
  const X = (i) => (i / (v.length - 1)) * (w - 4) + 2;
  const Y = (val) => h - 3 - ((val - mn) / rng) * (h - 6);
  const pts = v.map((val, i) => T`${X(i).toFixed(1)},${Y(val).toFixed(1)}`).join(' ');
  const areaP = area ? T`<polygon points="2,${h} ${pts} ${(w - 2)},${h}" fill="${color}" opacity="0.10"/>` : '';
  return T`<svg class="art-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${areaP}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
}

function fragBand(f) {
  if (f >= 80) return [t('ekstremalna'), t('jeden kraj trzyma niemal cała zmapowana podaż, więc pojedyncze zdarzenie potrafi wstrząsnąć całym rynkiem')];
  if (f >= 55) return [t('wysoka'), t('podaż jest mocno skupiona w jednym kraju, co czyni ja wrażliwa na politykę i pogodę tego miejsca')];
  if (f >= 35) return [t('umiarkowana'), t('podaż jest skoncentrowana, ale istnieją realne alternatywy łagodzące szok')];
  return [t('niska'), t('podaż jest rozproszona geograficznie, więc rynek łatwiej amortyzuje lokalne zakłócenia')];
}

function topCountries(stat, n = 3) {
  const tot = Object.values(stat.country).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(stat.country).sort((a, b) => b[1] - a[1]).slice(0, n).map(([c, s]) => ({ c, pct: s / tot }));
}

// ---------- ARTYKUL: WĘZEŁ ----------
async function nodeArticle(node, eng, Live) {
  const com = eng.commodities[node.commodity] || { pl: node.commodity, use: '', note: '', elast: 0.4, cat: node.cat };
  const stat = eng.stat(node.commodity);
  const cName = td('commodity:' + node.commodity + ':pl', com.pl);
  const cNote = com.note ? td('commodity:' + node.commodity + ':note', com.note) : '';
  const cUse = com.use ? td('commodity:' + node.commodity + ':use', com.use) : '';
  const seed = node.id;
  const month = new Date().getMonth();

  // pozycja węzła wśród zmapowanych złóż
  const ranked = stat.nodes.slice().sort((a, b) => b.share_pct - a.share_pct);
  const rank = ranked.findIndex((x) => x.id === node.id) + 1;
  const tops = topCountries(stat);
  const [fband, fexpl] = fragBand(stat.fragility);
  const pr = Math.round(eng.pagerank().commodity[node.commodity] || 0);

  // LEDE
  const role = node.share_pct >= 4 ? pick(['filar','kręgosłup','serce'].map(t), seed) : node.share_pct >= 1.5 ? pick(['ważny węzeł','istotny element','znaczący punkt'].map(t), seed) : pick(['ogniwo','element układanki','tryb'].map(t), seed);
  const lede = T`${pick(['Patrzysz na','Przed Toba','To'].map(t), seed)} ${node.name} (${node.region || node.country}), ${role} globalnej podaży surowca, który ${cUse ? cUse.toLowerCase() : t('napędza gospodarkę')}. ` +
    T`Operator: ${node.operator}. Według zmapowanych danych to ${rank > 0 ? `nr ${rank} wśród ${stat.nodes.length} śledzonych złóż` : 'jedno ze śledzonych złóż'} ${cName.toLowerCase()}, z udziałem okolo ${node.share_pct}% w globalnej podaży.`;

  // GEOGRAFIA
  const geo = T`<div class="art-sec"><h4>Geografia i skala</h4>` +
    T`<p>${node.name} leży w regionie ${node.region || node.country} (${node.country}). ${node.note}. ` +
    `Zdolność: <b>${node.capacity}</b>. ${cNote ? cNote + '.' : ''}</p>` +
    T`<div class="art-stats"><span>udział globalny<b>${node.share_pct}%</b></span><span>pozycja<b>${rank > 0 ? '#' + rank : '—'}</b></span><span>operator<b>${node.operator}</b></span><span>źródło<b>${node.source_type} · ${node.as_of}</b></span></div></div>`;

  // KONCENTRACJA / HHI / PageRank
  const conc = T`<div class="art-sec"><h4>Koncentracja i krwiobieg podaży</h4>` +
    T`<p>Kruchość ${cName.toLowerCase()} jest <b style="color:var(--accent)">${fband}</b> (indeks HHI ${stat.fragility}/100): ${fexpl}. ` +
    `Największy gracz to <b>${stat.topCountry}</b> z okolo ${sP(stat.topShare)} zmapowanej podaży${stat.spof ? ', co kwalifikuje surowiec jako <b style="color:var(--loss)">single point of failure</b>' : ''}. ` +
    `Zmapowani liderzy: ${tops.map((t) => T`${t.c} (${sP(t.pct)})`).join(', ')}.</p>` +
    T`<p>W grafie zależności świata ${cName.toLowerCase()} ma centralność PageRank <b>${pr}/100</b>. ${pr >= 70 ? 'To jeden z surowców, które najmocniej trzęsą całym układem walut, firm i szlaków' : pr >= 40 ? 'To surowiec o dużym znaczeniu systemowym' : 'Jego waga systemowa jest umiarkowana, choć lokalnie istotna'}.</p>` +
    T`<div class="art-bar"><i style="width:${stat.fragility}%;background:${node.fragColor}"></i></div></div>`;

  // KTO TRZYMA RYNEK
  const cos = (stat.companies || []).map((id) => eng.company(id)).filter(Boolean).sort((a, b) => (b.mkt_cap_bn || 0) - (a.mkt_cap_bn || 0)).slice(0, 5);
  let metalsLine = '';
  if (node.commodity === 'gold' || node.commodity === 'silver') {
    const m = await Live.metals();
    if (m) { const px = node.commodity === 'gold' ? m.gold : m.silver; if (px) metalsLine = T`<p class="art-live">Cena spot na żywo (${m.source}): <b>${px.toLocaleString('pl-PL')} USD/oz</b>.</p>`; }
  }
  const market = T`<div class="art-sec"><h4>Kto trzyma rynek</h4>` +
    (cos.length ? T`<p>Ceny i marżę ${cName.toLowerCase()} wokół tego węzła kształtują przede wszystkim:</p>` +
      T`<div class="art-list">${cos.map((c) => T`<div class="art-row"><span>${c.name} <em>${c.ticker}</em></span><b>${capBn(c.mkt_cap_bn) || c.role}</b></div>`).join('')}</div>` : T`<p>Rynek tego surowca jest rozproszony między wielu producentow i traderów.</p>`) +
    metalsLine + T`</div>`;

  // WALUTY + LIVE FX
  const ccyCodes = stat.currencies || [];
  let fxBlock = '';
  if (ccyCodes.length) {
    const fx = await Live.fx();
    const rows = ccyCodes.map((code) => {
      const c = eng.ccy(code); if (!c) return '';
      let live = '';
      if (fx && fx.rates && fx.rates[code]) live = T`<b>1 USD = ${fx.rates[code].toLocaleString('pl-PL', { maximumFractionDigits: 4 })} ${code}</b>`;
      const dir = c.role === 'exporter' ? t('rośnie') : c.role === 'importer' ? t('słabnie') : t('reaguje neutralnie');
      return T`<div class="art-row"><span>${code} · ${td('currency:' + code + ':pl', c.pl)} <em>${c.role === 'exporter' ? t('eksporter') : c.role === 'importer' ? t('importer') : t('przystań')}</em></span>${live}</div>`;
    }).join('');
    const exp = ccyCodes.map((x) => eng.ccy(x)).filter((c) => c && c.role === 'exporter').map((c) => c.code);
    fxBlock = T`<div class="art-sec"><h4>Waluty na sznurku</h4>` +
      T`<p>Gdy cena ${cName.toLowerCase()} idzie w górę, ${exp.length ? `umacniają się waluty eksporterów (${exp.join(', ')}), a słabną waluty importerów` : 'reagują powiązane waluty surowcowe'}. Kursy referencyjne${fx && fx.asOfLabel ? ` (aktualizacja ${fx.cadence || 'dzienna'}, stan ${fx.asOfLabel})` : ''}:</p>` +
      T`<div class="art-list">${rows}</div></div>`;
  }

  // ŁAŃCUCH RYZYKA (chokepointy + compound)
  const chokes = (stat.chokepoints || []).map((id) => eng.chokepoints.find((c) => c.id === id)).filter(Boolean);
  const compounds = eng.compoundRisks(40).filter((r) => r.a === node.name || r.b === node.name || r.commodities.includes(com.pl)).slice(0, 2);
  let riskBlock = '';
  if (chokes.length || compounds.length) {
    riskBlock = T`<div class="art-sec"><h4>Łańcuch ryzyka</h4>`;
    if (chokes.length) riskBlock += T`<p>Ten surowiec przechodzi przez wąskie gardła: ${chokes.map((c) => T`<b>${c.pl}</b> (ryzyko ${sP(c.annual_disruption_prob)}/rok)`).join(', ')}. Zatkanie któregokolwiek przekłada się na koszt i czas dostawy.</p>`;
    if (compounds.length) riskBlock += T`<p>Kombinatoryka najgorszych scenariuszy łączy to z innymi punktami zapalnymi, np. <b>${compounds[0].a} + ${compounds[0].b}</b> jednocześnie (prawd. łączne ${(compounds[0].jointProb * 100).toFixed(2)}%/rok) uderzyłoby w ${compounds[0].commodities.join(', ')}.</p>`;
    riskBlock += T`</div>`;
  }

  // POGODA I SEZONOWOŚĆ (LIVE) + sparkline
  let wxBlock = '';
  const season = eng.seasonality(node, month);
  const isAgro = node.type === 'farm-belt' || node.type === 'plantation';
  if (isAgro || season) {
    const wx = await Live.weather(node.lat, node.lng);
    let inner = '';
    if (wx) {
      inner += T`<p class="art-live">Pogoda na żywo (${wx.source}, ${new Date(wx.asOf).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}): ` +
        T`<b>${Math.round(wx.tempC)}°C</b>, opad bieżący ${wx.precip} mm, wiatr ${Math.round(wx.wind)} km/h. Suma opadow z ostatnich 10 dni: <b>${wx.recentPrecip} mm</b>.</p>`;
      if (wx.dailyMax && wx.dailyMax.length) inner += T`<div class="art-sparkwrap"><span>temp. max, 13 dni</span>${spark(wx.dailyMax, { color: '#E8675A' })}</div>`;
      if (wx.dailyPrecip && wx.dailyPrecip.length) inner += T`<div class="art-sparkwrap"><span>opad dzienny, 13 dni</span>${spark(wx.dailyPrecip, { color: '#5DC7B8' })}</div>`;
    } else inner += T`<p class="muted">Dane pogodowe na żywo chwilowo niedostępne.</p>`;
    if (season) inner += T`<p>Sezonowo jesteśmy ${season.active ? '<b style="color:var(--loss)">w oknie krytycznym</b>' : season.near ? 'tuz przy oknie krytycznym' : 'poza oknem krytycznym'}: ${season.label}. ${season.active ? 'To moment, w którym pogoda waży najwięcej dla plonu.' : ''}</p>`;
    wxBlock = T`<div class="art-sec"><h4>Pogoda i sezonowość <span class="art-livebadge">LIVE</span></h4>${inner}</div>`;
  }

  // SCENARIUSZ KASKADY
  const cas = eng.cascade(node);
  const ccyTop = cas.currencies.slice(0, 5);
  const coTop = cas.companies.slice(0, 4);
  const cascade = T`<div class="art-sec"><h4>Scenariusz kaskady „co-jeśli"</h4>` +
    T`<p>Gdyby ten węzeł wypadł (utrata ~50% jego udziału), modelowy szok ceny ${cName.toLowerCase()} wyniosłby <b style="color:var(--loss)">${sPct(cas.shock[node.commodity] || 0)}</b> (przez elastyczność podaży ${com.elast}). Propagacja:</p>` +
    T`<div class="art-cols"><div><div class="art-mini">waluty</div>${ccyTop.map((c) => T`<div class="art-row"><span>${c.code}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<span class="muted">—</span>'}</div>` +
    T`<div><div class="art-mini">firmy</div>${coTop.map((c) => T`<div class="art-row"><span>${c.ticker}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<span class="muted">—</span>'}</div></div></div>`;

  // WERDYKT
  const verdict = T`<div class="art-sec"><h4>Werdykt kontekstowy</h4>` +
    T`<p>${stat.spof ? T`Trzymaj ${stat.topCountry} na radarze, bo koncentracja jest tu największym ryzykiem.` : 'Rozproszenie podaży daje rynkowi poduszkę, ale '} ` +
    T`${pr >= 60 ? `wysoka centralność systemowa oznacza, ze ruch ceny rozejdzie się szeroko po walutach i akcjach.` : `efekty pozostaną raczej lokalne dla powiązanych aktywów.`} ` +
    `Co obserwować: ${isAgro ? 'pogodę w oknie sezonowym i raporty USDA' : chokes.length ? 'drożność chokepointów i zapasy' : 'politykę producentów i popyt'}.</p>` +
    T`<p class="art-obs">OBSERVE_ONLY: to warstwa kontekstu i scenariuszy „co-jeśli", policzona algorytmicznie z danych. Nie jest prognoza kierunku. Liczby surowcowe sa skalibrowane zgrubnie i datowane.</p></div>`;

  const foot = T`<div class="art-foot">Wygenerowano algorytmicznie (bez LLM): <b>${nowStr()}</b> · dane na żywo: Open-Meteo, ExchangeRate-API, gold-api.com · statystyki liczone na bieżąco z ${eng.nodes.length} złóż.</div>`;

  const html = T`<div class="art-hd"><span class="art-emoji">${node.icon || '•'}</span><div><span class="d-eyebrow" style="color:${node.color}">${cName.toUpperCase()} · ${node.country}</span><h3>${node.name}</h3></div></div>` +
    T`<p class="art-lede">${lede}</p>` + geo + conc + market + fxBlock + riskBlock + wxBlock + cascade + verdict + foot;
  return { title: node.name, html };
}

// ---------- ARTYKUL: CHOKEPOINT ----------
async function chokeArticle(cp, eng, Live) {
  const coms = (cp.commodities_at_risk || []).map((id) => eng.commodities[id]).filter(Boolean);
  const cas = eng.cascade(cp);
  const ccyTop = cas.currencies.slice(0, 6);
  const compounds = eng.compoundRisks(40).filter((r) => r.a === cp.pl || r.b === cp.pl).slice(0, 3);
  const fx = await Live.fx();
  const ccyRows = ccyTop.map((c) => {
    let live = (fx && fx.rates && fx.rates[c.code]) ? ` <em>1 USD=${fx.rates[c.code].toLocaleString('pl-PL', { maximumFractionDigits: 3 })}</em>` : '';
    return T`<div class="art-row"><span>${c.code} · ${td('currency:' + c.code + ':pl', c.pl)}${live}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`;
  }).join('');
  const html = T`<div class="art-hd"><span class="art-emoji">⚠️</span><div><span class="d-eyebrow" style="color:var(--loss)">CHOKEPOINT</span><h3>${td('choke:' + cp.id + ':pl', cp.pl)}</h3></div></div>` +
    T`<p class="art-lede">${td('choke:' + cp.id + ':pl', cp.pl)} (${cp.name}) to jedno z wąskich gardeł światowego handlu. Przepływ: ${td('choke:' + cp.id + ':throughput', cp.throughput)}. ${td('choke:' + cp.id + ':note', cp.note)}.</p>` +
    T`<div class="art-sec"><h4>Parametry ryzyka</h4><div class="art-stats"><span>prawd. zakłócenia / rok<b>${sP(cp.annual_disruption_prob)}</b></span><span>dotkliwość<b>${sP(cp.severity)}</b></span><span>objazd<b>${(cp.alt_routes || []).join('; ') || '—'}</b></span></div></div>` +
    T`<div class="art-sec"><h4>Co przez nie płynie</h4><p>${coms.map((c) => td('commodity:' + c.id + ':pl', c.pl)).join(', ')}. Zatkanie przekłada się na cenę i czas dostawy tych surowców w skali globalnej.</p></div>` +
    T`<div class="art-sec"><h4>Reakcja walut (kaskada, live FX)</h4><div class="art-list">${ccyRows || '<span class="muted">—</span>'}</div></div>` +
    (compounds.length ? T`<div class="art-sec"><h4>Kombinatoryka: scenariusze łączne</h4>${compounds.map((r) => T`<div class="art-row"><span>+ ${r.a === cp.pl ? r.b : r.a}</span><b>p ${(r.jointProb * 100).toFixed(2)}%</b></div>`).join('')}<p class="muted" style="margin-top:6px">Najgroźniejsze, gdy ten punkt staje równocześnie z innym (ryzyko skorelowane).</p></div>` : '') +
    T`<div class="art-sec"><p class="art-obs">OBSERVE_ONLY: scenariusz, nie prognoza. Kaskada policzona deterministycznie z utraty przepływu / elastyczności.</p></div>` +
    T`<div class="art-foot">Wygenerowano: <b>${nowStr()}</b> · FX referencyjny (aktualizacja dzienna): ExchangeRate-API${fx && fx.asOfLabel ? ' · stan ' + fx.asOfLabel : ''}.</div>`;
  return { title: cp.pl, html };
}

export async function buildArticle(p, eng, Live) {
  if (p.type === 'choke') return chokeArticle(p.item, eng, Live);
  return nodeArticle(p.item, eng, Live);
}
export default buildArticle;
