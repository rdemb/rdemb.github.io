/*
  D-LOGIC ATLAS — generator artykulow (article.js)
  ================================================
  CZYSTO ALGORYTMICZNA generacja jezyka (NLG): gramatyka + progi danych +
  kombinatoryka wariantow zdan. ZERO LLM. Deterministyczna (wariancja z hasha id),
  ZAWSZE SWIEZA (statystyki silnika liczone na biezaco + dane na zywo + timestamp).
  Zwraca {title, html} dla wezla lub chokepointu.
*/

const MON = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'wrzesnia', 'pazdziernika', 'listopada', 'grudnia'];
function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const pick = (arr, seed) => arr[hash(seed) % arr.length];
const sPct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const sP = (v) => Math.round(v * 100) + '%';
function nowStr() { const d = new Date(); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function capBn(n) { if (!n) return null; return n >= 1000 ? (n / 1000).toFixed(1) + ' bln USD' : Math.round(n) + ' mld USD'; }

function spark(vals, { w = 200, h = 38, color = '#E8B23A', area = true } = {}) {
  const v = (vals || []).filter((x) => typeof x === 'number');
  if (v.length < 2) return '';
  const mn = Math.min(...v), mx = Math.max(...v), rng = (mx - mn) || 1;
  const X = (i) => (i / (v.length - 1)) * (w - 4) + 2;
  const Y = (val) => h - 3 - ((val - mn) / rng) * (h - 6);
  const pts = v.map((val, i) => `${X(i).toFixed(1)},${Y(val).toFixed(1)}`).join(' ');
  const areaP = area ? `<polygon points="2,${h} ${pts} ${(w - 2)},${h}" fill="${color}" opacity="0.10"/>` : '';
  return `<svg class="art-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${areaP}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
}

function fragBand(f) {
  if (f >= 80) return ['ekstremalna', 'jeden kraj trzyma niemal cala zmapowana podaz, wiec pojedyncze zdarzenie potrafi wstrzasnac calym rynkiem'];
  if (f >= 55) return ['wysoka', 'podaz jest mocno skupiona w jednym kraju, co czyni ja wrazliwa na polityke i pogode tego miejsca'];
  if (f >= 35) return ['umiarkowana', 'podaz jest skoncentrowana, ale istnieja realne alternatywy lagodzce szok'];
  return ['niska', 'podaz jest rozproszona geograficznie, wiec rynek latwiej amortyzuje lokalne zaklocenia'];
}

function topCountries(stat, n = 3) {
  const tot = Object.values(stat.country).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(stat.country).sort((a, b) => b[1] - a[1]).slice(0, n).map(([c, s]) => ({ c, pct: s / tot }));
}

// ---------- ARTYKUL: WEZEL ----------
async function nodeArticle(node, eng, Live) {
  const com = eng.commodities[node.commodity] || { pl: node.commodity, use: '', note: '', elast: 0.4, cat: node.cat };
  const stat = eng.stat(node.commodity);
  const seed = node.id;
  const month = new Date().getMonth();

  // pozycja wezla wsrod zmapowanych zloz
  const ranked = stat.nodes.slice().sort((a, b) => b.share_pct - a.share_pct);
  const rank = ranked.findIndex((x) => x.id === node.id) + 1;
  const tops = topCountries(stat);
  const [fband, fexpl] = fragBand(stat.fragility);
  const pr = Math.round(eng.pagerank().commodity[node.commodity] || 0);

  // LEDE
  const role = node.share_pct >= 4 ? pick(['filar', 'kregoslup', 'serce'], seed) : node.share_pct >= 1.5 ? pick(['wazny wezel', 'istotny element', 'znaczacy punkt'], seed) : pick(['ogniwo', 'element ukladanki', 'tryb'], seed);
  const lede = `${pick(['Patrzysz na', 'Przed Toba', 'To'], seed)} ${node.name} (${node.region || node.country}) — ${role} globalnej podazy surowca, ktory ${com.use ? com.use.toLowerCase() : 'napedza gospodarke'}. ` +
    `Operator: ${node.operator}. Wedlug zmapowanych danych to ${rank > 0 ? `nr ${rank} wsrod ${stat.nodes.length} sledzonych zloz` : 'jedno ze sledzonych zloz'} ${com.pl.toLowerCase()}, z udzialem okolo ${node.share_pct}% w globalnej podazy.`;

  // GEOGRAFIA
  const geo = `<div class="art-sec"><h4>Geografia i skala</h4>` +
    `<p>${node.name} lezy w regionie ${node.region || node.country} (${node.country}). ${node.note}. ` +
    `Zdolnosc: <b>${node.capacity}</b>. ${com.note ? com.note + '.' : ''}</p>` +
    `<div class="art-stats"><span>udzial globalny<b>${node.share_pct}%</b></span><span>pozycja<b>${rank > 0 ? '#' + rank : '—'}</b></span><span>operator<b>${node.operator}</b></span><span>zrodlo<b>${node.source_type} · ${node.as_of}</b></span></div></div>`;

  // KONCENTRACJA / HHI / PageRank
  const conc = `<div class="art-sec"><h4>Koncentracja i krwiobieg podazy</h4>` +
    `<p>Kruchosc ${com.pl.toLowerCase()} jest <b style="color:var(--accent)">${fband}</b> (indeks HHI ${stat.fragility}/100): ${fexpl}. ` +
    `Najwiekszy gracz to <b>${stat.topCountry}</b> z okolo ${sP(stat.topShare)} zmapowanej podazy${stat.spof ? ', co kwalifikuje surowiec jako <b style="color:var(--loss)">single point of failure</b>' : ''}. ` +
    `Zmapowani liderzy: ${tops.map((t) => `${t.c} (${sP(t.pct)})`).join(', ')}.</p>` +
    `<p>W grafie zaleznosci swiata ${com.pl.toLowerCase()} ma centralnosc PageRank <b>${pr}/100</b> — ${pr >= 70 ? 'to jeden z surowcow, ktore najmocniej trzesa calym ukladem walut, firm i szlakow' : pr >= 40 ? 'to surowiec o duzym znaczeniu systemowym' : 'jego waga systemowa jest umiarkowana, choc lokalnie istotna'}.</p>` +
    `<div class="art-bar"><i style="width:${stat.fragility}%;background:${node.fragColor}"></i></div></div>`;

  // KTO TRZYMA RYNEK
  const cos = (stat.companies || []).map((id) => eng.company(id)).filter(Boolean).sort((a, b) => (b.mkt_cap_bn || 0) - (a.mkt_cap_bn || 0)).slice(0, 5);
  let metalsLine = '';
  if (node.commodity === 'gold' || node.commodity === 'silver') {
    const m = await Live.metals();
    if (m) { const px = node.commodity === 'gold' ? m.gold : m.silver; if (px) metalsLine = `<p class="art-live">Cena spot na zywo (${m.source}): <b>${px.toLocaleString('pl-PL')} USD/oz</b>.</p>`; }
  }
  const market = `<div class="art-sec"><h4>Kto trzyma rynek</h4>` +
    (cos.length ? `<p>Ceny i marze ${com.pl.toLowerCase()} wokol tego wezla ksztaltuja przede wszystkim:</p>` +
      `<div class="art-list">${cos.map((c) => `<div class="art-row"><span>${c.name} <em>${c.ticker}</em></span><b>${capBn(c.mkt_cap_bn) || c.role}</b></div>`).join('')}</div>` : `<p>Rynek tego surowca jest rozproszony miedzy wielu producentow i traderow.</p>`) +
    metalsLine + `</div>`;

  // WALUTY + LIVE FX
  const ccyCodes = stat.currencies || [];
  let fxBlock = '';
  if (ccyCodes.length) {
    const fx = await Live.fx();
    const rows = ccyCodes.map((code) => {
      const c = eng.ccy(code); if (!c) return '';
      let live = '';
      if (fx && fx.rates && fx.rates[code]) live = `<b>1 USD = ${fx.rates[code].toLocaleString('pl-PL', { maximumFractionDigits: 4 })} ${code}</b>`;
      const dir = c.role === 'exporter' ? 'rosnie' : c.role === 'importer' ? 'slabnie' : 'reaguje neutralnie';
      return `<div class="art-row"><span>${code} · ${c.pl} <em>${c.role === 'exporter' ? 'eksporter' : c.role === 'importer' ? 'importer' : 'przystan'}</em></span>${live}</div>`;
    }).join('');
    const exp = ccyCodes.map((x) => eng.ccy(x)).filter((c) => c && c.role === 'exporter').map((c) => c.code);
    fxBlock = `<div class="art-sec"><h4>Waluty na sznurku</h4>` +
      `<p>Gdy cena ${com.pl.toLowerCase()} idzie w gore, ${exp.length ? `umacniaja sie waluty eksporterow (${exp.join(', ')}), a slabna waluty importerow` : 'reaguja powiazane waluty surowcowe'}. Kursy ponizej sa pobierane na zywo:</p>` +
      `<div class="art-list">${rows}</div></div>`;
  }

  // LANCUCH RYZYKA (chokepointy + compound)
  const chokes = (stat.chokepoints || []).map((id) => eng.chokepoints.find((c) => c.id === id)).filter(Boolean);
  const compounds = eng.compoundRisks(40).filter((r) => r.a === node.name || r.b === node.name || r.commodities.includes(com.pl)).slice(0, 2);
  let riskBlock = '';
  if (chokes.length || compounds.length) {
    riskBlock = `<div class="art-sec"><h4>Lancuch ryzyka</h4>`;
    if (chokes.length) riskBlock += `<p>Ten surowiec przechodzi przez waskie gardla: ${chokes.map((c) => `<b>${c.pl}</b> (ryzyko ${sP(c.annual_disruption_prob)}/rok)`).join(', ')}. Zatkanie ktoregokolwiek przeklada sie na koszt i czas dostawy.</p>`;
    if (compounds.length) riskBlock += `<p>Kombinatoryka najgorszych scenariuszy laczy to z innymi punktami zapalnymi — np. <b>${compounds[0].a} + ${compounds[0].b}</b> jednoczesnie (prawd. laczne ${(compounds[0].jointProb * 100).toFixed(2)}%/rok) uderzyloby w ${compounds[0].commodities.join(', ')}.</p>`;
    riskBlock += `</div>`;
  }

  // POGODA I SEZONOWOSC (LIVE) + sparkline
  let wxBlock = '';
  const season = eng.seasonality(node, month);
  const isAgro = node.type === 'farm-belt' || node.type === 'plantation';
  if (isAgro || season) {
    const wx = await Live.weather(node.lat, node.lng);
    let inner = '';
    if (wx) {
      inner += `<p class="art-live">Pogoda na zywo (${wx.source}, ${new Date(wx.asOf).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}): ` +
        `<b>${Math.round(wx.tempC)}°C</b>, opad biezacy ${wx.precip} mm, wiatr ${Math.round(wx.wind)} km/h. Suma opadow z ostatnich 10 dni: <b>${wx.recentPrecip} mm</b>.</p>`;
      if (wx.dailyMax && wx.dailyMax.length) inner += `<div class="art-sparkwrap"><span>temp. max, 13 dni</span>${spark(wx.dailyMax, { color: '#E8675A' })}</div>`;
      if (wx.dailyPrecip && wx.dailyPrecip.length) inner += `<div class="art-sparkwrap"><span>opad dzienny, 13 dni</span>${spark(wx.dailyPrecip, { color: '#5DC7B8' })}</div>`;
    } else inner += `<p class="muted">Dane pogodowe na zywo chwilowo niedostepne.</p>`;
    if (season) inner += `<p>Sezonowo jestesmy ${season.active ? '<b style="color:var(--loss)">w oknie krytycznym</b>' : season.near ? 'tuz przy oknie krytycznym' : 'poza oknem krytycznym'}: ${season.label}. ${season.active ? 'To moment, w ktorym pogoda wazy najwiecej dla plonu.' : ''}</p>`;
    wxBlock = `<div class="art-sec"><h4>Pogoda i sezonowosc <span class="art-livebadge">LIVE</span></h4>${inner}</div>`;
  }

  // SCENARIUSZ KASKADY
  const cas = eng.cascade(node);
  const ccyTop = cas.currencies.slice(0, 5);
  const coTop = cas.companies.slice(0, 4);
  const cascade = `<div class="art-sec"><h4>Scenariusz kaskady „co-jesli"</h4>` +
    `<p>Gdyby ten wezel wypadl (utrata ~50% jego udzialu), modelowy szok ceny ${com.pl.toLowerCase()} wyniosłby <b style="color:var(--loss)">${sPct(cas.shock[node.commodity] || 0)}</b> (przez elastycznosc podazy ${com.elast}). Propagacja:</p>` +
    `<div class="art-cols"><div><div class="art-mini">waluty</div>${ccyTop.map((c) => `<div class="art-row"><span>${c.code}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<span class="muted">—</span>'}</div>` +
    `<div><div class="art-mini">firmy</div>${coTop.map((c) => `<div class="art-row"><span>${c.ticker}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`).join('') || '<span class="muted">—</span>'}</div></div></div>`;

  // WERDYKT
  const verdict = `<div class="art-sec"><h4>Werdykt kontekstowy</h4>` +
    `<p>${stat.spof ? `Trzymaj ${stat.topCountry} na radarze — koncentracja jest tu najwiekszym ryzykiem.` : 'Rozproszenie podazy daje rynkowi poduszke, ale '} ` +
    `${pr >= 60 ? `wysoka centralnosc systemowa oznacza, ze ruch ceny rozejdzie sie szeroko po walutach i akcjach.` : `efekty pozostana raczej lokalne dla powiazanych aktywow.`} ` +
    `Co obserwowac: ${isAgro ? 'pogode w oknie sezonowym i raporty USDA' : chokes.length ? 'droznosc chokepointow i zapasy' : 'politykę producentów i popyt'}.</p>` +
    `<p class="art-obs">OBSERVE_ONLY — to warstwa kontekstu i scenariuszy „co-jesli", policzona algorytmicznie z danych, nie prognoza kierunku. Liczby surowcowe sa skalibrowane zgrubnie i datowane.</p></div>`;

  const foot = `<div class="art-foot">Wygenerowano algorytmicznie (bez LLM): <b>${nowStr()}</b> · dane na zywo: Open-Meteo, ExchangeRate-API, gold-api.com · statystyki liczone na biezaco z ${eng.nodes.length} zloz.</div>`;

  const html = `<div class="art-hd"><span class="art-emoji">${node.icon || '•'}</span><div><span class="d-eyebrow" style="color:${node.color}">${com.pl.toUpperCase()} · ${node.country}</span><h3>${node.name}</h3></div></div>` +
    `<p class="art-lede">${lede}</p>` + geo + conc + market + fxBlock + riskBlock + wxBlock + cascade + verdict + foot;
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
    return `<div class="art-row"><span>${c.code} · ${c.pl}${live}</span><b class="${c.impact >= 0 ? 'up' : 'dn'}">${sPct(c.impact)}</b></div>`;
  }).join('');
  const html = `<div class="art-hd"><span class="art-emoji">⚠️</span><div><span class="d-eyebrow" style="color:var(--loss)">CHOKEPOINT</span><h3>${cp.pl}</h3></div></div>` +
    `<p class="art-lede">${cp.pl} (${cp.name}) to jedno z waskich gardel swiatowego handlu. Przeplyw: ${cp.throughput}. ${cp.note}.</p>` +
    `<div class="art-sec"><h4>Parametry ryzyka</h4><div class="art-stats"><span>prawd. zaklocenia / rok<b>${sP(cp.annual_disruption_prob)}</b></span><span>dotkliwosc<b>${sP(cp.severity)}</b></span><span>objazd<b>${(cp.alt_routes || []).join('; ') || '—'}</b></span></div></div>` +
    `<div class="art-sec"><h4>Co przez nie plynie</h4><p>${coms.map((c) => c.pl).join(', ')}. Zatkanie przeklada sie na cene i czas dostawy tych surowcow w skali globalnej.</p></div>` +
    `<div class="art-sec"><h4>Reakcja walut (kaskada, live FX)</h4><div class="art-list">${ccyRows || '<span class="muted">—</span>'}</div></div>` +
    (compounds.length ? `<div class="art-sec"><h4>Kombinatoryka — scenariusze laczne</h4>${compounds.map((r) => `<div class="art-row"><span>+ ${r.a === cp.pl ? r.b : r.a}</span><b>p ${(r.jointProb * 100).toFixed(2)}%</b></div>`).join('')}<p class="muted" style="margin-top:6px">Najgrozniejsze, gdy ten punkt staje rownoczesnie z innym (ryzyko skorelowane).</p></div>` : '') +
    `<div class="art-sec"><p class="art-obs">OBSERVE_ONLY — scenariusz, nie prognoza. Kaskada policzona deterministycznie z utraty przeplywu / elastycznosci.</p></div>` +
    `<div class="art-foot">Wygenerowano: <b>${nowStr()}</b> · FX na zywo: ExchangeRate-API.</div>`;
  return { title: cp.pl, html };
}

export async function buildArticle(p, eng, Live) {
  if (p.type === 'choke') return chokeArticle(p.item, eng, Live);
  return nodeArticle(p.item, eng, Live);
}
export default buildArticle;
