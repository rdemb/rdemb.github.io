/* ============================================================
   archives.js — droga BEZ DNA: „powiedz co wiesz → przeszukaj archiwa".
   Formularz (nazwisko + region + lata) -> usługa atavism-archives (Geneteka, na żywo)
   -> realne akta na ekranie -> organizm rośnie wokół prawdziwych nazwanych przodków
   -> „kop głębiej" wspina się po imionach rodziców. Trójjęzyczny przez AE.t.

   Adres usługi z /atavism-archives.json (self-healing tunel, jak checker/market).
   Działa na opublikowanej stronie; z pliku lokalnego fetch padnie (uczciwy komunikat).
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});
  const t = (k, p) => (AE.t ? AE.t(k, p) : k);

  // 16 województw (nazwy zgodne z archives.py PROVINCES; usługa mapuje na kody)
  const PROVINCES = ['dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie',
    'małopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie',
    'śląskie', 'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'];
  const TYPES = [['birth', 'arch.tBirth'], ['marriage', 'arch.tMarriage'], ['death', 'arch.tDeath']];

  let _base = null;
  async function getBase() {
    if (_base) return _base;
    const r = await fetch('/atavism-archives.json', { cache: 'no-store' });
    const j = await r.json();
    _base = j.base;
    return _base;
  }

  function el(tag, cls, props) { const e = document.createElement(tag); if (cls) e.className = cls; if (props) Object.assign(e, props); return e; }
  function field(type, ph, cls, value) {
    const e = el('input', 'field' + (cls ? ' ' + cls : '')); e.type = type;
    if (value != null) e.value = value;
    if (ph) { e.placeholder = t(ph); e.setAttribute('data-i18n-ph', ph); }
    if (type === 'number') e.inputMode = 'numeric';
    return e;
  }

  // realny rekord -> nazwany przodek Atavism (ta sama logika co atavism_export.named_from_records)
  function recordToNamed(rec) {
    const REF = 2025;
    const year = parseInt(rec.year) || 1800;
    const gen = Math.max(3, Math.round((REF - year) / 30));
    let cert = 0.5 + (rec.father ? 0.22 : 0) + (rec.mother ? 0.16 : 0);
    return {
      name: ((rec.name || '') + ' ' + (rec.surname || '')).trim() || '—',
      born: year, place: rec.parish || rec.place || '',
      source: 'Geneteka' + (rec.parish ? ' · ' + rec.parish : ''),
      lineage: 'auto', gen: gen, certainty: Math.min(0.95, +cert.toFixed(2)),
    };
  }
  // dataset BEZ DNA: nazwani przodkowie realni; pochodzenie neutralne; linie Y/mt uśpione (uczciwie)
  function buildDataset(records, surname) {
    return {
      profile: ((surname || '') + ' ' + t('arch.profileSuffix')).trim(),
      populations: [{ label: t('arch.noDna'), color: '#5b6473', frac: 1 }],
      relatives: [], ancient: [], yHaplo: [], mtHaplo: [],
      named: records.map(recordToNamed),
    };
  }

  AE.buildArchivePanel = function (body, opts) {
    opts = opts || {};
    body.innerHTML = '';
    let lastRecords = [], lastSurname = '';

    // ---- formularz ----
    const form = el('div', 'sect');
    const head = el('div', 'sect-h'); head.appendChild(el('span', 'nm', { textContent: t('arch.sub') }));
    head.querySelector('.nm').setAttribute('data-i18n', 'arch.sub'); form.appendChild(head);

    const fSurname = field('text', 'arch.surname', 'f-sm');
    const fProvince = el('select', 'field f-sm');
    fProvince.appendChild(el('option', null, { value: '', textContent: '— ' + t('arch.province') + ' —' }));
    PROVINCES.forEach((p) => fProvince.appendChild(el('option', null, { value: p, textContent: p })));
    const fType = el('select', 'field f-sm');
    TYPES.forEach(([v, k]) => { const o = el('option', null, { value: v, textContent: t(k) }); o.setAttribute('data-i18n', k); fType.appendChild(o); });
    const fFrom = field('number', 'arch.yearFrom', 'f-pct');
    const fTo = field('number', 'arch.yearTo', 'f-pct');
    const fName = field('text', 'arch.firstname', 'f-sm');

    const rowYears = el('div', null); rowYears.style.cssText = 'display:flex;gap:7px';
    rowYears.appendChild(fFrom); rowYears.appendChild(fTo);

    const stack = el('div'); stack.style.cssText = 'display:flex;flex-direction:column;gap:9px;margin-top:6px';
    [fSurname, fProvince, fName, fType, rowYears].forEach((x) => stack.appendChild(x));
    form.appendChild(stack);

    const goBtn = el('button', 'btn primary', { type: 'button', textContent: t('arch.searchBtn') });
    goBtn.setAttribute('data-i18n', 'arch.searchBtn'); goBtn.style.cssText = 'margin-top:12px;width:100%';
    form.appendChild(goBtn);
    body.appendChild(form);

    const note = el('div', 'hint', { textContent: t('arch.note') }); note.setAttribute('data-i18n', 'arch.note');
    body.appendChild(note);

    // ---- wyniki ----
    const status = el('div', 'hint'); status.style.cssText = 'margin-top:14px;min-height:18px';
    body.appendChild(status);
    const list = el('div', 'anc-list'); list.style.marginTop = '6px'; body.appendChild(list);
    const loadWrap = el('div'); loadWrap.style.marginTop = '12px'; body.appendChild(loadWrap);

    function setStatus(key, params, raw) { status.textContent = raw != null ? raw : t(key, params); }

    function digDeeper(surname, firstName, beforeYear) {
      fSurname.value = surname || '';
      fName.value = firstName || '';
      fTo.value = beforeYear || '';
      fFrom.value = beforeYear ? (beforeYear - 50) : '';
      run();
    }

    function renderRecords(recs) {
      list.innerHTML = ''; loadWrap.innerHTML = '';
      recs.forEach((rec) => {
        const item = el('div', 'anc-item'); item.style.cursor = 'default';
        const mid = el('div'); mid.style.flex = '1';
        mid.appendChild(el('div', 'nm', { textContent: `${rec.name} ${rec.surname}`.trim() }));
        const sub = `${rec.parish || rec.place || ''}`;
        const par = (rec.father || rec.mother) ? ` · ${t('arch.parents')}: ${rec.father || '?'} & ${rec.mother || '?'} ${rec.mother_maiden || ''}`.trimEnd() : '';
        mid.appendChild(el('div', 'pl', { textContent: sub + par }));
        // przyciski „kop głębiej" (po rodzicach) + skan
        const chips = el('div'); chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px';
        if (rec.surname && rec.father) {
          const b = el('button', 'sect-h', { type: 'button' });
          b.className = 'add'; b.textContent = '⬆ ' + t('arch.parents') + ': ' + rec.father + ' ' + rec.surname;
          b.addEventListener('click', () => digDeeper(rec.surname, rec.father, rec.year));
          chips.appendChild(b);
        }
        if (rec.mother_maiden) {
          const b = el('button', 'add', { type: 'button', textContent: '⬆ ' + (rec.mother || '') + ' ' + rec.mother_maiden });
          b.addEventListener('click', () => digDeeper(rec.mother_maiden, rec.mother, rec.year));
          chips.appendChild(b);
        }
        if (rec.source_url) {
          const a = el('a', 'add', { href: rec.source_url, target: '_blank', textContent: '↗ ' + t('arch.scan') });
          a.setAttribute('rel', 'noopener'); a.style.textDecoration = 'none'; chips.appendChild(a);
        }
        mid.appendChild(chips);
        const yr = el('div', 'gen', { textContent: rec.year || '' });
        item.appendChild(el('span', 'o')); item.appendChild(mid); item.appendChild(yr);
        list.appendChild(item);
      });
      if (recs.length) {
        const load = el('button', 'btn primary', { type: 'button', textContent: t('arch.load') });
        load.setAttribute('data-i18n', 'arch.load'); load.style.width = '100%';
        load.addEventListener('click', () => {
          const ds = buildDataset(recs, lastSurname);
          if (opts.onLoad) opts.onLoad(ds);
        });
        loadWrap.appendChild(load);
      }
    }

    async function run() {
      const surname = fSurname.value.trim();
      const province = fProvince.value;
      if (!surname || !province) { setStatus('arch.needPlace'); return; }
      lastSurname = surname;
      list.innerHTML = ''; loadWrap.innerHTML = '';
      setStatus('arch.searching');
      goBtn.disabled = true;
      try {
        const base = await getBase();
        const qs = new URLSearchParams({ surname, province, type: fType.value });
        if (fName.value.trim()) qs.set('name', fName.value.trim());
        if (fFrom.value) qs.set('from', fFrom.value);
        if (fTo.value) qs.set('to', fTo.value);
        const r = await fetch(base + '/search?' + qs.toString());
        const d = await r.json();
        if (!d.ok) { setStatus(null, null, d.error || t('arch.error')); return; }
        lastRecords = d.records || [];
        if (!lastRecords.length) { setStatus('arch.none'); return; }
        setStatus('arch.found', { total: d.total, shown: d.shown });
        renderRecords(lastRecords);
      } catch (e) {
        // brak /atavism-archives.json (plik lokalny) lub sieć
        setStatus(null, null, t('arch.offline'));
      } finally {
        goBtn.disabled = false;
      }
    }

    goBtn.addEventListener('click', run);
    [fSurname, fName, fFrom, fTo].forEach((f) => f.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); }));
  };
})();
