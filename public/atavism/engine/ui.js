/* ============================================================
   ui.js — data-entry forms + discovered-ancestors list
   Builds the editable "Your data" drawer and reads it back into
   an engine-compatible dataset.
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function el(tag, cls, props) { const e = document.createElement(tag); if (cls) e.className = cls; if (props) Object.assign(e, props); return e; }

  const DEGREES = ['Parent / child', 'Sibling', '1st cousin', '2nd cousin', '3rd cousin', '4th cousin', '5th+ cousin'];
  const LINS = [['auto', 'Autosomal'], ['Y', 'Paternal (Y)'], ['mt', 'Maternal (mt)']];

  function field(type, value, ph, cls) {
    const e = el(type === 'select' ? 'select' : 'input', 'field' + (cls ? ' ' + cls : ''));
    if (type !== 'select') { e.type = type; e.value = value == null ? '' : value; if (ph) e.placeholder = ph; }
    if (type === 'number') { e.inputMode = 'decimal'; }
    return e;
  }
  function select(value, opts, cls) {
    const s = el('select', 'field' + (cls ? ' ' + cls : ''));
    opts.forEach(([v, label]) => { const o = el('option'); o.value = v; o.textContent = label; if (v === value) o.selected = true; s.appendChild(o); });
    return s;
  }
  function rmBtn(onClick) { const b = el('button', 'rm', { type: 'button', textContent: '×', title: 'Remove' }); b.addEventListener('click', onClick); return b; }

  function section(body, key, title, addLabel, onAdd) {
    const wrap = el('div', 'sect'); wrap.dataset.sec = key;
    const h = el('div', 'sect-h');
    h.appendChild(el('span', 'nm', { textContent: title }));
    if (addLabel) {
      const a = el('button', 'add', { type: 'button', textContent: addLabel });
      a.addEventListener('click', onAdd);
      h.appendChild(a);
    }
    wrap.appendChild(h);
    const rows = el('div', 'rows'); wrap.appendChild(rows);
    body.appendChild(wrap);
    return { wrap, rows };
  }

  // ---- row templates ----
  function popRow(rows, p) {
    const r = el('div', 'row-e');
    r.appendChild(field('color', p && p.color || '#6fe3c2', '', ''));
    r.appendChild(field('text', p && p.label || '', 'Population', 'f-name'));
    r.appendChild(field('number', p ? Math.round((p.frac || 0) * 100) : '', '%', 'f-pct'));
    r.appendChild(rmBtn(() => r.remove()));
    rows.appendChild(r);
  }
  function relRow(rows, r0) {
    const r = el('div', 'row-e');
    r.appendChild(field('text', r0 && r0.name || '', 'Match name', 'f-name'));
    r.appendChild(field('number', r0 && r0.cM || '', 'cM', 'f-pct'));
    r.appendChild(select(r0 && r0.degree || '3rd cousin', DEGREES.map((d) => [d, d]), 'f-sm'));
    r.appendChild(rmBtn(() => r.remove()));
    rows.appendChild(r);
  }
  function namedRow(rows, a) {
    const r = el('div', 'row-grid');
    const g1 = el('div', 'g2');
    g1.appendChild(field('text', a && a.name || '', 'Ancestor name', 'f-name'));
    g1.appendChild(field('number', a && a.born || '', 'b. year', 'f-pct'));
    r.appendChild(g1);
    r.appendChild(field('text', a && a.place || '', 'Birthplace', 'f-sm'));
    r.appendChild(field('text', a && a.source || '', 'Source (parish, civil register, GEDCOM…)', 'f-sm'));
    const g2 = el('div', 'g2');
    g2.appendChild(select(a && a.lineage || 'auto', LINS, 'f-sm'));
    g2.appendChild(field('number', a && a.gen || '', 'gen', 'f-pct'));
    g2.appendChild(field('number', a ? Math.round((a.certainty != null ? a.certainty : 0.7) * 100) : '', 'cert %', 'f-pct'));
    r.appendChild(g2);
    const rm = rmBtn(() => r.remove()); rm.style.alignSelf = 'flex-end'; r.appendChild(rm);
    rows.appendChild(r);
  }
  function ancientRow(rows, a) {
    const r = el('div', 'row-e');
    r.appendChild(field('color', a && a.color || '#e9b66a', '', ''));
    r.appendChild(field('text', a && a.label || '', 'Source population', 'f-name'));
    r.appendChild(field('number', a ? Math.round((a.frac || 0) * 100) : '', '%', 'f-pct'));
    r.appendChild(field('number', a && a.age || '', 'yrs', 'f-pct'));
    r.appendChild(rmBtn(() => r.remove()));
    rows.appendChild(r);
  }
  function haploRow(rows, h) {
    const r = el('div', 'row-e');
    r.appendChild(field('text', h && h.label || '', 'Haplogroup', 'f-name'));
    r.appendChild(field('number', h && h.ybp || '', 'ybp', 'f-pct'));
    r.appendChild(rmBtn(() => r.remove()));
    rows.appendChild(r);
  }

  // ---- build the whole form ----
  AE.buildDataForm = function (body, data) {
    body.innerHTML = '';

    const sp = section(body, 'profile', 'PROFILE');
    const pr = el('div', 'row-e'); pr.appendChild(field('text', data.profile || 'You', 'Your name / label', 'f-sm')); sp.rows.appendChild(pr);

    const pop = section(body, 'pop', 'LOCAL ANCESTRY', '+ add', () => popRow(pop.rows));
    (data.populations || []).forEach((p) => popRow(pop.rows, p));
    body.querySelector('[data-sec=pop]').appendChild(el('div', 'hint', { textContent: 'Percentages auto-normalize. Colour paints each genome segment.' }));

    const rel = section(body, 'rel', 'DNA MATCHES', '+ add', () => relRow(rel.rows));
    (data.relatives || []).forEach((r) => relRow(rel.rows, r));
    body.querySelector('[data-sec=rel]').appendChild(el('div', 'hint', { textContent: 'Shared DNA (cM) sets how strongly each kin-node is pulled toward you.' }));

    const named = section(body, 'named', 'NAMED ANCESTORS', '+ add', () => namedRow(named.rows));
    (data.named || []).forEach((a) => namedRow(named.rows, a));
    body.querySelector('[data-sec=named]').appendChild(el('div', 'hint', { textContent: 'Generation sets how deep each one crystallizes. Certainty 0–100.' }));

    const anc = section(body, 'ancient', 'DEEP ANCESTRY', '+ add', () => ancientRow(anc.rows));
    (data.ancient || []).forEach((a) => ancientRow(anc.rows, a));
    body.querySelector('[data-sec=ancient]').appendChild(el('div', 'hint', { textContent: 'Ancient source populations — distant constellations bound by admixture threads. Age in years.' }));

    const yh = section(body, 'yhap', 'PATERNAL LINE · Y-DNA', '+ add', () => haploRow(yh.rows));
    (data.yHaplo || []).forEach((h) => haploRow(yh.rows, h));
    const mh = section(body, 'mthap', 'MATERNAL LINE · mtDNA', '+ add', () => haploRow(mh.rows));
    (data.mtHaplo || []).forEach((h) => haploRow(mh.rows, h));

    function fields(r) { return [...r.querySelectorAll('.field')]; }
    function rowsOf(key) { return [...body.querySelectorAll(`[data-sec="${key}"] .rows > .row-e, [data-sec="${key}"] .rows > .row-grid`)]; }

    return {
      collect() {
        const profile = body.querySelector('[data-sec=profile] .field').value.trim() || 'You';
        const populations = rowsOf('pop').map((r) => { const f = fields(r); return { color: f[0].value, label: f[1].value.trim(), frac: (parseFloat(f[2].value) || 0) / 100 }; }).filter((p) => p.label && p.frac > 0);
        const relatives = rowsOf('rel').map((r) => { const f = fields(r); return { name: f[0].value.trim(), cM: parseFloat(f[1].value) || 0, degree: f[2].value }; }).filter((r) => r.name);
        const named = rowsOf('named').map((r) => { const f = fields(r); return { name: f[0].value.trim(), born: parseInt(f[1].value) || 1800, place: f[2].value.trim(), source: f[3].value.trim() || 'Registry', lineage: f[4].value, gen: parseInt(f[5].value) || 7, certainty: (parseFloat(f[6].value) || 70) / 100 }; }).filter((a) => a.name);
        const ancient = rowsOf('ancient').map((r) => { const f = fields(r); return { color: f[0].value, label: f[1].value.trim(), frac: (parseFloat(f[2].value) || 0) / 100, age: parseInt(f[3].value) || 6000 }; }).filter((a) => a.label && a.frac > 0);
        const yHaplo = rowsOf('yhap').map((r) => { const f = fields(r); return { label: f[0].value.trim(), ybp: parseInt(f[1].value) || 5000 }; }).filter((h) => h.label);
        const mtHaplo = rowsOf('mthap').map((r) => { const f = fields(r); return { label: f[0].value.trim(), ybp: parseInt(f[1].value) || 9000 }; }).filter((h) => h.label);
        return { profile, populations, relatives, named, ancient, yHaplo, mtHaplo };
      },
    };
  };

  // ---- discovered-ancestors list ----
  AE.renderAncestors = function (listEl, engine, onPick) {
    listEl.innerHTML = '';
    if (!engine.named.length) {
      listEl.appendChild(el('div', 'anc-empty', { textContent: 'No named ancestors yet. Add records in “Your data”, or keep digging.' }));
      return;
    }
    engine.named.forEach((a) => {
      const found = engine._namedFired.has(a.name);
      const item = el('div', 'anc-item' + (found ? '' : ' locked'));
      const dot = el('span', 'o');
      const mid = el('div');
      mid.appendChild(el('div', 'nm', { textContent: found ? a.name : 'Undiscovered' }));
      mid.appendChild(el('div', 'pl', { textContent: found ? `${a.place} · b. ${a.born}` : `dig to ~gen ${a.gen} to reveal` }));
      const gen = el('div', 'gen', { textContent: `gen ${a.gen}` });
      item.appendChild(dot); item.appendChild(mid); item.appendChild(gen);
      if (found) item.addEventListener('click', () => onPick(a));
      listEl.appendChild(item);
    });
  };
})();
