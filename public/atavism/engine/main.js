/* ============================================================
   main.js — controller: render loop, HUD wiring, drawers,
   data-driven regrow, projection labels, hover/tap, cards.
   ============================================================ */
(function () {
  const AE = window.AE;
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const world = new AE.World(canvas);
  const engine = world.engine;
  const canHover = matchMedia('(hover: hover)').matches;

  setTimeout(() => $('veil').classList.add('gone'), 2200);

  // ---------- organ rail ----------
  const ORGANS = [
    { key: 'genome', i18n: 'organ.genome' },
    { key: 'ibd', i18n: 'organ.kinship' },
    { key: 'coalescent', i18n: 'organ.coalescent' },
    { key: 'uniparental', i18n: 'organ.uniparental', focus: 'coalescent' },
    { key: 'ancient', i18n: 'organ.ancient' },
  ];
  const organsEl = $('organs');
  organsEl.innerHTML = ORGANS.map((o) =>
    `<div class="o" data-key="${o.focus || o.key}" data-layer="${o.key}"><span class="tick"></span><span class="lbl" data-i18n="${o.i18n}">${AE.t(o.i18n)}</span></div>`
  ).join('');
  let focusLock = null;
  organsEl.querySelectorAll('.o').forEach((elx) => {
    const fkey = elx.getAttribute('data-key');
    elx.addEventListener('mouseenter', () => { if (!focusLock) world.setDim(fkey); });
    elx.addEventListener('mouseleave', () => { if (!focusLock) world.setDim(null); });
    elx.addEventListener('click', () => {
      if (focusLock === fkey) { focusLock = null; world.setDim(null); }
      else { focusLock = fkey; world.setDim(fkey); }
      organsEl.querySelectorAll('.o').forEach((o) => o.classList.toggle('active', focusLock && o.getAttribute('data-key') === focusLock));
    });
  });

  // ---------- lineage selector ----------
  $('lineage').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#lineage button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      engine.setLineage(b.getAttribute('data-l'));
    });
  });

  // ---------- dig scrubber ----------
  const digInput = $('digInput'), digFill = $('digFill'), digKnob = $('digKnob'), depthRead = $('depthRead');
  $('digMarks').innerHTML = [0, 0.25, 0.5, 0.75, 1].map((m) => `<span class="mk" style="left:${m * 100}%"></span>`).join('');
  digInput.addEventListener('input', () => engine.setDig(parseFloat(digInput.value) / 1000));
  let dragging = false;
  digInput.addEventListener('pointerdown', () => (dragging = true));
  addEventListener('pointerup', () => (dragging = false));

  const autoBtn = $('autoBtn'), autoIcon = $('autoIcon');
  const ICON_PAUSE = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  const ICON_PLAY = '<path d="M7 4l13 8-13 8z"/>';
  function syncAuto() { autoIcon.innerHTML = engine.auto ? ICON_PAUSE : ICON_PLAY; }
  autoBtn.addEventListener('click', () => { engine.setAuto(!engine.auto); syncAuto(); });
  $('resetBtn').addEventListener('click', () => {
    engine.dig = 0; engine.auto = false; engine._namedFired.clear(); syncAuto(); closeCard();
  });

  function depthLabel(d) {
    if (d < 0.04) return AE.t('depth.present');
    const gen = d * 16;
    if (d < 0.55) { const year = 2025 - Math.round(gen * 28); return AE.t('depth.gens', { gen: Math.round(gen), year }); }
    const kybp = AE.lerp(2, 30, (d - 0.55) / 0.45);
    return AE.t('depth.deep', { k: kybp.toFixed(0) });
  }

  // ---------- engine event stream ----------
  const logEl = $('log'), tickerEl = $('ticker'), MAXLOG = 7;
  function pushLog(text, color) {
    const row = document.createElement('div');
    row.className = 'row fresh';
    if (color) row.style.color = color;
    row.textContent = text;
    logEl.prepend(row);
    setTimeout(() => row.classList.remove('fresh'), 400);
    while (logEl.children.length > MAXLOG) logEl.removeChild(logEl.lastChild);
  }
  engine.on((ev) => {
    if (ev.type === 'log') { pushLog(ev.text); tickerEl.textContent = ev.text; }
    else if (ev.type === 'layer-awake') {
      const colors = { genome: '#6fe3e6', ibd: '#5fbfe6', coalescent: '#6f74d8', uniparental: '#e58fbf', ancient: '#e9b66a' };
      world.flash(colors[ev.layer] || '#e9b66a', 1.0);
    } else if (ev.type === 'named') {
      world.flash('#f0c884', 1.3);
      const t = `★ ${AE.t('log.registryHit')} · ${ev.ancestor.name} · ${ev.ancestor.place} ${ev.ancestor.born}`;
      pushLog(t, '#f0c884'); tickerEl.innerHTML = `<b>${t}</b>`;
      if (ancDrawer.classList.contains('show')) renderAnc();
    }
  });

  // ---------- floating labels ----------
  const labelLayer = $('ae-labels') || (() => { const d = document.createElement('div'); d.id = 'ae-labels'; document.body.appendChild(d); return d; })();
  let namedLabels = [];
  function setupNamedLabels() {
    labelLayer.querySelectorAll('.named-label').forEach((n) => n.remove());
    namedLabels = (world.coalescent ? world.coalescent.named : []).map((nm) => {
      const elx = document.createElement('div');
      elx.className = 'named-label';
      elx.style.cssText = 'position:absolute;transform:translate(-50%,-160%);pointer-events:auto;cursor:pointer;text-align:center;opacity:0;transition:opacity .4s;white-space:nowrap;';
      elx.innerHTML = `<div style="font-family:var(--serif);font-size:13px;color:#f3dcae;text-shadow:0 0 12px rgba(240,200,130,.6)">${escapeHtml(nm.data.name)}</div>
        <div style="font-family:var(--mono);font-size:9px;letter-spacing:.12em;color:#9a8a6a;margin-top:2px">${escapeHtml(nm.data.place)} · ${nm.data.born}</div>`;
      elx.addEventListener('click', () => openCard(nm.data));
      labelLayer.appendChild(elx);
      return { el: elx, nm };
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  const haploPool = Array.from({ length: 10 }, () => {
    const elx = document.createElement('div');
    elx.style.cssText = 'position:absolute;transform:translate(12px,-50%);pointer-events:none;opacity:0;transition:opacity .3s;white-space:nowrap;font-family:var(--mono);';
    labelLayer.appendChild(elx);
    return elx;
  });

  const proj = new THREE.Vector3();
  function toScreen(w) {
    proj.copy(w).project(world.camera);
    return { x: (proj.x * 0.5 + 0.5) * innerWidth, y: (-proj.y * 0.5 + 0.5) * innerHeight, visible: proj.z < 1 };
  }

  // ---------- hover / tap pick ----------
  const tip = $('tip');
  let pointer = { x: -999, y: -999 };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });

  function updateHover() {
    if (!canHover) return;
    let best = null, bestD = 26 * 26;
    const consider = (w, a, b) => {
      const s = toScreen(w); if (!s.visible) return;
      const dx = s.x - pointer.x, dy = s.y - pointer.y, d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = { x: s.x, y: s.y, a, b }; }
    };
    if (world.network && engine.layers.ibd > 0.4) world.network.nodes.forEach((nd) => consider(nd.world, nd.rel.name, `${AE.tDegree(nd.rel.degree)} · ${nd.rel.cM} cM`));
    if (world.ancient && engine.layers.ancient > 0.4) world.ancient.consts.forEach((c) => consider(c.center, AE.tLabel(c.pop.label), AE.t('tip.admix', { pct: Math.round(c.pop.frac * 100), kya: (c.pop.age / 1000).toFixed(0) })));
    if (best) {
      tip.style.left = best.x + 'px'; tip.style.top = best.y + 'px';
      tip.querySelector('.a').textContent = best.a; tip.querySelector('.b').textContent = best.b;
      tip.classList.add('show'); canvas.style.cursor = 'pointer';
    } else { tip.classList.remove('show'); canvas.style.cursor = 'default'; }
  }

  // tap a glowing named node to open its card (works on touch too)
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 8) return;
    if (!world.coalescent) return;
    let best = null, bestD = 44 * 44;
    world.coalescent.named.forEach((nm) => {
      if (!nm.visible) return;
      const s = toScreen(nm.world); if (!s.visible) return;
      const dx = s.x - e.clientX, dy = s.y - e.clientY, d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = nm.data; }
    });
    if (best) openCard(best);
  });

  // ---------- scrim ----------
  const scrim = $('scrim');
  function anyPanelOpen() { return card.classList.contains('show') || dataDrawer.classList.contains('show') || ancDrawer.classList.contains('show'); }
  function syncScrim() { scrim.classList.toggle('show', dataDrawer.classList.contains('show') || ancDrawer.classList.contains('show') || (!canHover && card.classList.contains('show'))); }
  scrim.addEventListener('click', () => { closeCard(); closeDrawers(); });

  // ---------- ancestor card ----------
  const card = $('card');
  let lastCardAnc = null;
  function openCard(a) {
    lastCardAnc = a;
    $('cName').textContent = a.name;
    $('cVital').textContent = `${a.place ? a.place + ' · ' : ''}${AE.getLang() === 'pl' ? 'ur.' : AE.getLang() === 'de' ? 'geb.' : 'b.'} ${a.born}`;
    $('cSrc').textContent = a.source;
    $('cLin').textContent = a.lineage === 'Y' ? AE.t('lin.yFull') : a.lineage === 'mt' ? AE.t('lin.mtFull') : AE.t('lin.autoFull');
    $('cGen').textContent = AE.t('card.gensBack', { gen: a.gen });
    $('cConfV').textContent = `${Math.round(a.certainty * 100)}%`;
    $('cConfBar').style.width = `${a.certainty * 100}%`;
    card.classList.add('show'); syncScrim();
  }
  function closeCard() { card.classList.remove('show'); syncScrim(); }
  $('cardClose').addEventListener('click', closeCard);

  // ---------- drawers ----------
  const dataDrawer = $('dataDrawer'), ancDrawer = $('ancDrawer'), dataBody = $('dataBody');
  let form = null;
  function closeDrawers() { dataDrawer.classList.remove('show'); ancDrawer.classList.remove('show'); syncScrim(); }
  function openData() {
    closeCard(); ancDrawer.classList.remove('show');
    form = AE.buildDataForm(dataBody, engine.exportData());
    dataDrawer.classList.add('show'); syncScrim();
  }
  function renderAnc() { AE.renderAncestors($('ancList'), engine, (a) => { openCard(a); }); }
  function openAnc() {
    closeCard(); dataDrawer.classList.remove('show');
    renderAnc(); $('ancSub').textContent = AE.t('anc.surfaced', { n: engine._namedFired.size, total: engine.named.length });
    ancDrawer.classList.add('show'); syncScrim();
  }
  $('dataBtn').addEventListener('click', () => (dataDrawer.classList.contains('show') ? closeDrawers() : openData()));
  $('ancBtn').addEventListener('click', () => (ancDrawer.classList.contains('show') ? closeDrawers() : openAnc()));
  $('dataDrawerClose').addEventListener('click', closeDrawers);
  $('ancDrawerClose').addEventListener('click', closeDrawers);

  $('applyBtn').addEventListener('click', () => {
    if (!form) return;
    const data = form.collect();
    if (!data.populations.length) { alert(AE.t('alert.needPop')); return; }
    engine.loadData(data);
    world.rebuildOrgans();
    setupNamedLabels();
    syncAuto();
    closeDrawers();
    flashRegrow();
  });
  $('exampleBtn').addEventListener('click', () => {
    engine.loadData(AE.Engine.defaultData());
    world.rebuildOrgans(); setupNamedLabels();
    form = AE.buildDataForm(dataBody, engine.exportData());
    flashRegrow();
  });
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(engine.exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'atavism-ancestry.json'; a.click(); URL.revokeObjectURL(url);
  });
  // ---------- import backend JSON (most z naszego silnika: atavism_export.py) ----------
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        engine.loadData(data);
        world.rebuildOrgans(); setupNamedLabels(); syncAuto();
        form = AE.buildDataForm(dataBody, engine.exportData());
        closeDrawers(); flashRegrow();
      } catch (err) { alert(AE.t('alert.badJson') + err.message); }
    };
    reader.readAsText(file); e.target.value = '';
  });
  function flashRegrow() { engine.auto = true; syncAuto(); world.flash('#6fe3e6', 1.4); }

  // ---------- ancestors count pill ----------
  const ancCount = $('ancCount');

  // ---------- main loop ----------
  setupNamedLabels();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    world.update(dt);

    const d = engine.digSmoothed;
    if (!dragging) digInput.value = String(Math.round(engine.dig * 1000));
    digFill.style.width = (d * 100) + '%'; digKnob.style.left = (d * 100) + '%';
    depthRead.textContent = depthLabel(d);
    ancCount.textContent = String(engine._namedFired.size);

    organsEl.querySelectorAll('.o').forEach((elx) => {
      elx.classList.toggle('lit', engine.layers[elx.getAttribute('data-layer')] > 0.5);
    });

    // named labels (desktop only — hidden via CSS on mobile)
    if (canHover) {
      namedLabels.forEach(({ el: elx, nm }) => {
        const s = toScreen(nm.world);
        if (nm.visible && s.visible) { elx.style.left = s.x + 'px'; elx.style.top = s.y + 'px'; elx.style.opacity = Math.min(1, (nm.reveal - 0.4) * 2) * 0.95; }
        else elx.style.opacity = '0';
      });
      if (world.coalescent) {
        const labels = world.coalescent.uniLabels || [];
        const act = engine.layers.uniparental, lin = engine.lineage;
        haploPool.forEach((elx, i) => {
          const L = labels[i];
          if (L && act > 0.4 && (lin === 'auto' || lin === L.key) && L.world) {
            const s = toScreen(L.world);
            if (s.visible) {
              elx.style.left = s.x + 'px'; elx.style.top = s.y + 'px';
              elx.innerHTML = `<span style="font-size:11px;color:${L.key === 'Y' ? '#9dc0ff' : '#f0b0d4'}">${L.text}</span><span style="font-size:9px;color:#6a7390;margin-left:6px">${L.sub}</span>`;
              elx.style.opacity = String(0.85 * act);
            } else elx.style.opacity = '0';
          } else elx.style.opacity = '0';
        });
      }
    }

    updateHover();
    world.render();
    requestAnimationFrame(frame);
  }
  syncAuto();
  requestAnimationFrame(frame);

  // ---------- language (PL / EN / DE) ----------
  const langsw = $('langsw');
  if (langsw) langsw.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => AE.setLang(b.getAttribute('data-lang'))));
  AE.onLang(() => {
    // statyczne etykiety (organy, formularz, pasek, karta-klucze) ogarnia applyStatic;
    // otwarte widoki z treścią dynamiczną odświeżamy ręcznie:
    if (card.classList.contains('show') && lastCardAnc) openCard(lastCardAnc);
    if (ancDrawer.classList.contains('show')) {
      renderAnc();
      $('ancSub').textContent = AE.t('anc.surfaced', { n: engine._namedFired.size, total: engine.named.length });
    }
  });
  AE.initLang();

  window.__AE = world;
})();
