/* ============================================================
   i18n.js — trójjęzyczna warstwa symulatora (PL / EN / DE)
   Jedno źródło prawdy dla wszystkich napisów. Wczytywane PRZED
   resztą silnika, więc AE.t / AE.tLabel są dostępne wszędzie.

   - statyczny HTML: atrybuty data-i18n / data-i18n-ph / data-i18n-title
     są tłumaczone przez applyStatic() przy każdej zmianie języka,
     więc dynamicznie budowane pola (formularz) też podążają za językiem
     BEZ utraty wpisanych wartości (zmienia się tylko etykieta).
   - dynamiczny tekst (organy, głębia, log, karta): AE.t(key, params)
     odczytuje bieżący język w chwili wywołania.
   - wbudowane etykiety danych (populacje, stopnie pokrewieństwa) lokalizuje
     AE.tLabel / AE.tDegree; etykiety WPISANE przez użytkownika zostają jak są.

   Klucz języka w localStorage = 'atavism_lang' — wspólny z landingiem (index.html).
   ============================================================ */
(function () {
  const AE = (window.AE = window.AE || {});

  const DICT = {
    // ---- top bar / pills ----
    'ui.sub':        { pl: 'Żywy silnik przodków',  en: 'Living Ancestral Engine', de: 'Lebende Ahnen-Maschine' },
    'ui.ancestors':  { pl: 'Przodkowie',            en: 'Ancestors',               de: 'Ahnen' },
    'ui.yourData':   { pl: 'Twoje dane',            en: 'Your data',               de: 'Deine Daten' },
    'ui.streaming':  { pl: 'Silnik · strumień',     en: 'Engine · streaming',      de: 'Maschine · Stream' },
    'ui.about':      { pl: 'O projekcie',           en: 'About',                   de: 'Über das Projekt' },

    // ---- dig scrubber ----
    'dig.depth':     { pl: 'Głębokość',             en: 'Dig depth',               de: 'Grabtiefe' },
    'scale.you':     { pl: 'Ty',                    en: 'You',                     de: 'Du' },
    'scale.grand':   { pl: 'Dziadkowie',            en: 'Grandparents',            de: 'Großeltern' },
    'scale.1600':    { pl: 'XVII w.',               en: '1600s',                   de: '1600er' },
    'scale.antiquity':{ pl: 'Starożytność',         en: 'Antiquity',               de: 'Antike' },
    'scale.deep':    { pl: 'Głęboki czas',          en: 'Deep time',               de: 'Tiefenzeit' },

    // ---- lineage segment ----
    'lin.auto':      { pl: 'Autosomalne',           en: 'Autosomal',               de: 'Autosomal' },
    'lin.y':         { pl: 'Y-DNA',                 en: 'Y-DNA',                   de: 'Y-DNA' },
    'lin.mt':        { pl: 'mtDNA',                 en: 'mtDNA',                   de: 'mtDNA' },
    'lin.autoFull':  { pl: 'Autosomalne',           en: 'Autosomal',               de: 'Autosomal' },
    'lin.yFull':     { pl: 'Ojcowska (Y)',          en: 'Paternal (Y)',            de: 'Väterlich (Y)' },
    'lin.mtFull':    { pl: 'Matczyna (mt)',         en: 'Maternal (mt)',           de: 'Mütterlich (mt)' },

    // ---- buttons / controls ----
    'btn.pause':     { pl: 'Wstrzymaj / wznów kopanie', en: 'Pause / resume the dig', de: 'Graben anhalten / fortsetzen' },
    'btn.rewind':    { pl: 'Cofnij do teraźniejszości', en: 'Rewind to the present',  de: 'Zur Gegenwart zurück' },
    'btn.apply':     { pl: 'Zastosuj i odrośnij',   en: 'Apply & regrow',          de: 'Anwenden & neu wachsen' },
    'btn.example':   { pl: 'Przykład',              en: 'Example',                 de: 'Beispiel' },
    'btn.export':    { pl: 'Eksport',               en: 'Export',                  de: 'Export' },
    'btn.import':    { pl: 'Import',                en: 'Import',                  de: 'Import' },
    'btn.close':     { pl: 'Zamknij',               en: 'Close',                   de: 'Schließen' },

    // ---- ancestor card ----
    'card.crest':    { pl: 'Trafienie w rejestrze', en: 'Registry match',          de: 'Registertreffer' },
    'card.source':   { pl: 'Źródło',                en: 'Source',                  de: 'Quelle' },
    'card.lineage':  { pl: 'Linia',                 en: 'Lineage',                 de: 'Linie' },
    'card.generation':{ pl: 'Pokolenie',            en: 'Generation',              de: 'Generation' },
    'card.certainty':{ pl: 'Pewność dopasowania',   en: 'Match certainty',         de: 'Treffersicherheit' },
    'card.gensBack': { pl: '{gen} pokoleń wstecz',  en: '{gen} generations back',  de: '{gen} Generationen zurück' },

    // ---- drawers ----
    'anc.title':     { pl: 'Przodkowie z imienia',  en: 'Named ancestors',         de: 'Namentliche Ahnen' },
    'anc.sub':       { pl: 'Trafienia z rejestrów wyłaniają się w trakcie kopania', en: 'Registry hits surface as you dig', de: 'Registertreffer tauchen beim Graben auf' },
    'anc.surfaced':  { pl: '{n} z {total} wyłonionych', en: '{n} of {total} surfaced', de: '{n} von {total} aufgetaucht' },
    'data.title':    { pl: 'Twoje dane',            en: 'Your data',               de: 'Deine Daten' },
    'data.sub':      { pl: 'Nakarm silnik — odrasta wokół ciebie', en: 'Feed the engine — it regrows around you', de: 'Füttere die Maschine — sie wächst um dich' },

    // ---- intro veil ----
    'veil.awaken':   { pl: 'Budzę organizm…',       en: 'Awakening the organism…', de: 'Erwecke den Organismus…' },

    // ---- depth read-out ----
    'depth.present': { pl: 'teraz — ty',            en: 'present — you',           de: 'Gegenwart — du' },
    'depth.gens':    { pl: '{gen} pokoleń wstecz · ok. {year}', en: '{gen} generations back · c. {year}', de: '{gen} Generationen zurück · ca. {year}' },
    'depth.deep':    { pl: 'głęboki czas · ~{k} kybp', en: 'deep time · ~{k} kybp', de: 'Tiefenzeit · ~{k} kybp' },

    // ---- organ rail ----
    'organ.genome':      { pl: 'Genom',         en: 'Genome',       de: 'Genom' },
    'organ.kinship':     { pl: 'Pokrewieństwo', en: 'Kinship',      de: 'Verwandtschaft' },
    'organ.coalescent':  { pl: 'Koalescent',    en: 'Coalescent',   de: 'Koaleszenz' },
    'organ.uniparental': { pl: 'Uniparentalne', en: 'Uniparental',  de: 'Uniparental' },
    'organ.ancient':     { pl: 'Pradawne',      en: 'Ancient',      de: 'Urzeitlich' },

    // ---- data form: sections / hints / placeholders ----
    'sect.profile':  { pl: 'PROFIL',                en: 'PROFILE',                 de: 'PROFIL' },
    'sect.local':    { pl: 'POCHODZENIE LOKALNE',   en: 'LOCAL ANCESTRY',          de: 'LOKALE ABSTAMMUNG' },
    'sect.matches':  { pl: 'DOPASOWANIA DNA',       en: 'DNA MATCHES',             de: 'DNA-TREFFER' },
    'sect.named':    { pl: 'PRZODKOWIE Z IMIENIA',  en: 'NAMED ANCESTORS',         de: 'NAMENTLICHE AHNEN' },
    'sect.deep':     { pl: 'GŁĘBOKIE POCHODZENIE',  en: 'DEEP ANCESTRY',           de: 'TIEFE ABSTAMMUNG' },
    'sect.ypat':     { pl: 'LINIA OJCOWSKA · Y-DNA', en: 'PATERNAL LINE · Y-DNA',  de: 'VÄTERLICHE LINIE · Y-DNA' },
    'sect.mmat':     { pl: 'LINIA MATCZYNA · mtDNA', en: 'MATERNAL LINE · mtDNA',  de: 'MÜTTERLICHE LINIE · mtDNA' },
    'form.add':      { pl: '+ dodaj',               en: '+ add',                   de: '+ neu' },
    'hint.pop':      { pl: 'Procenty normalizują się same. Kolor maluje każdy segment genomu.', en: 'Percentages auto-normalize. Colour paints each genome segment.', de: 'Prozente normalisieren sich automatisch. Farbe färbt jedes Genom-Segment.' },
    'hint.rel':      { pl: 'Wspólne DNA (cM) ustala, jak mocno każdy krewny jest przyciągany do ciebie.', en: 'Shared DNA (cM) sets how strongly each kin-node is pulled toward you.', de: 'Geteilte DNA (cM) bestimmt, wie stark jeder Verwandte zu dir gezogen wird.' },
    'hint.named':    { pl: 'Pokolenie ustala, jak głęboko każdy krystalizuje. Pewność 0–100.', en: 'Generation sets how deep each one crystallizes. Certainty 0–100.', de: 'Generation bestimmt die Kristallisations-Tiefe. Sicherheit 0–100.' },
    'hint.ancient':  { pl: 'Pradawne populacje źródłowe — odległe konstelacje spięte nićmi domieszki. Wiek w latach.', en: 'Ancient source populations — distant constellations bound by admixture threads. Age in years.', de: 'Urzeitliche Quell-Populationen — ferne Konstellationen, verbunden durch Beimischungs-Fäden. Alter in Jahren.' },
    'ph.pop':        { pl: 'Populacja',             en: 'Population',              de: 'Population' },
    'ph.relName':    { pl: 'Nazwa dopasowania',     en: 'Match name',              de: 'Treffer-Name' },
    'ph.profile':    { pl: 'Twoje imię / etykieta', en: 'Your name / label',       de: 'Dein Name / Label' },
    'ph.ancName':    { pl: 'Imię przodka',          en: 'Ancestor name',           de: 'Name des Ahnen' },
    'ph.byear':      { pl: 'rok ur.',               en: 'b. year',                 de: 'Geb.-Jahr' },
    'ph.place':      { pl: 'Miejsce urodzenia',     en: 'Birthplace',              de: 'Geburtsort' },
    'ph.source':     { pl: 'Źródło (parafia, USC, GEDCOM…)', en: 'Source (parish, civil register, GEDCOM…)', de: 'Quelle (Pfarrei, Standesamt, GEDCOM…)' },
    'ph.gen':        { pl: 'pokol.',                en: 'gen',                     de: 'Gen' },
    'ph.cert':       { pl: 'pewność %',             en: 'cert %',                  de: 'Sicherh. %' },
    'ph.ancLabel':   { pl: 'Populacja źródłowa',    en: 'Source population',       de: 'Quell-Population' },
    'ph.yrs':        { pl: 'lata',                  en: 'yrs',                     de: 'Jahre' },
    'ph.haplo':      { pl: 'Haplogrupa',            en: 'Haplogroup',              de: 'Haplogruppe' },

    // ---- discovered-ancestors list ----
    'list.empty':    { pl: 'Brak przodków z imienia. Dodaj wpisy w „Twoje dane" albo kop dalej.', en: 'No named ancestors yet. Add records in “Your data”, or keep digging.', de: 'Noch keine namentlichen Ahnen. Füge Einträge unter „Deine Daten" hinzu oder grabe weiter.' },
    'list.undiscovered':{ pl: 'Nieodkryty',         en: 'Undiscovered',            de: 'Unentdeckt' },
    'list.revealAt': { pl: 'kop do ~pokol. {gen}, by odsłonić', en: 'dig to ~gen {gen} to reveal', de: 'grabe bis ~Gen {gen} zum Aufdecken' },
    'list.gen':      { pl: 'pokol. {gen}',          en: 'gen {gen}',               de: 'Gen {gen}' },
    'list.born':     { pl: '{place} · ur. {born}',  en: '{place} · b. {born}',     de: '{place} · geb. {born}' },

    // ---- alerts ----
    'alert.needPop': { pl: 'Dodaj co najmniej jedną populację pochodzenia lokalnego.', en: 'Add at least one local-ancestry population.', de: 'Füge mindestens eine lokale Abstammungs-Population hinzu.' },
    'alert.badJson': { pl: 'Nie udało się wczytać JSON: ', en: 'Could not load JSON: ', de: 'JSON konnte nicht geladen werden: ' },
    'misc.remove':   { pl: 'Usuń',                  en: 'Remove',                  de: 'Entfernen' },
    'misc.you':      { pl: 'Ty',                    en: 'You',                     de: 'Du' },

    // ---- tooltip / live log ----
    'tip.admix':     { pl: '{pct}% domieszki · ~{kya} kya', en: '{pct}% admixture · ~{kya} kya', de: '{pct}% Beimischung · ~{kya} kya' },
    'log.local':     { pl: 'pochodzenie lokalne',   en: 'local-ancestry',          de: 'lokale Abstammung' },
    'log.ibd':       { pl: 'dopasowanie IBD',       en: 'IBD match',               de: 'IBD-Treffer' },
    'log.coal':      { pl: 'koalescent · linie złączone · węzeł', en: 'coalescent · lineages merged · node', de: 'Koaleszenz · Linien vereint · Knoten' },
    'log.uni':       { pl: 'uniparentalne',         en: 'uniparental',             de: 'uniparental' },
    'log.admix':     { pl: 'domieszka',             en: 'admixture',               de: 'Beimischung' },
    'log.scan':      { pl: 'skan genomu · okno fazowania', en: 'scanning genome · phasing window', de: 'Genom-Scan · Phasing-Fenster' },
    'log.segments':  { pl: 'segmenty',              en: 'segments',                de: 'Segmente' },
    'log.registryHit':{ pl: 'trafienie w rejestrze', en: 'registry hit',           de: 'Registertreffer' },

    // ---- degrees (kanoniczna wartość pól = EN; tu tylko wyświetlanie) ----
    'deg.parent':    { pl: 'Rodzic / dziecko',      en: 'Parent / child',          de: 'Elternteil / Kind' },
    'deg.sibling':   { pl: 'Rodzeństwo',            en: 'Sibling',                 de: 'Geschwister' },
    'deg.c1':        { pl: 'Kuzyn(ka) 1°',          en: '1st cousin',              de: 'Cousin(e) 1. Grades' },
    'deg.c2':        { pl: 'Kuzyn(ka) 2°',          en: '2nd cousin',              de: 'Cousin(e) 2. Grades' },
    'deg.c3':        { pl: 'Kuzyn(ka) 3°',          en: '3rd cousin',              de: 'Cousin(e) 3. Grades' },
    'deg.c4':        { pl: 'Kuzyn(ka) 4°',          en: '4th cousin',              de: 'Cousin(e) 4. Grades' },
    'deg.c5':        { pl: 'Kuzyn(ka) 5°+',         en: '5th+ cousin',             de: 'Cousin(e) 5.+ Grades' },

    // ---- wbudowane populacje (domyślny przykład; etykiety użytkownika zostają) ----
    'pop.Baltic':           { pl: 'bałtycka',           en: 'Baltic',                 de: 'baltisch' },
    'pop.West Slavic':      { pl: 'zachodniosłowiańska', en: 'West Slavic',           de: 'westslawisch' },
    'pop.East European':    { pl: 'wschodnioeuropejska', en: 'East European',         de: 'osteuropäisch' },
    'pop.Finno-Volgaic':    { pl: 'fińsko-wołżańska',   en: 'Finno-Volgaic',          de: 'finno-wolgaisch' },
    'pop.Scandinavian':     { pl: 'skandynawska',       en: 'Scandinavian',           de: 'skandinavisch' },
    'pop.Central Germanic': { pl: 'środkowogermańska',  en: 'Central Germanic',       de: 'mittelgermanisch' },
    'pop.Steppe Pastoralist':       { pl: 'pasterze stepowi',     en: 'Steppe Pastoralist',     de: 'Steppen-Hirten' },
    'pop.Anatolian Neolithic':      { pl: 'neolit anatolijski',   en: 'Anatolian Neolithic',    de: 'anatolisches Neolithikum' },
    'pop.Western Hunter-Gatherer':  { pl: 'zachodni łowcy-zbieracze', en: 'Western Hunter-Gatherer', de: 'westliche Jäger-Sammler' },
    'pop.Eastern Hunter-Gatherer':  { pl: 'wschodni łowcy-zbieracze', en: 'Eastern Hunter-Gatherer', de: 'östliche Jäger-Sammler' },
  };

  // mapy odwrotne: kanoniczna etykieta/stopień (EN) -> klucz
  const DEG_KEY = {
    'Parent / child': 'deg.parent', 'Sibling': 'deg.sibling',
    '1st cousin': 'deg.c1', '2nd cousin': 'deg.c2', '3rd cousin': 'deg.c3',
    '4th cousin': 'deg.c4', '5th+ cousin': 'deg.c5',
  };

  let lang = 'en';
  const listeners = [];

  function t(key, params) {
    const row = DICT[key];
    let s = row ? (row[lang] || row.en || key) : key;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
    return s;
  }

  // tłumaczenie wbudowanej etykiety danych; nieznana (wpisana przez usera) -> bez zmian
  function tLabel(label) {
    const row = DICT['pop.' + label];
    return row ? (row[lang] || row.en || label) : label;
  }
  // tłumaczenie stopnia pokrewieństwa (kanoniczna wartość pola zostaje EN)
  function tDegree(degree) {
    const k = DEG_KEY[degree];
    return k ? t(k) : degree;
  }

  function applyStatic(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  }

  function setLang(l) {
    if (l !== 'pl' && l !== 'en' && l !== 'de') l = 'en';
    lang = l;
    AE.lang = l;
    try { document.documentElement.lang = l; } catch (e) {}
    try { localStorage.setItem('atavism_lang', l); } catch (e) {}
    applyStatic(document);
    // odśwież przyciski przełącznika
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-lang') === l));
    // re-render dynamicznych części
    for (const fn of listeners) { try { fn(l); } catch (e) {} }
  }

  function onLang(fn) { listeners.push(fn); }

  function initLang() {
    let saved = null;
    try { saved = localStorage.getItem('atavism_lang'); } catch (e) {}
    if (!saved) {
      const nav = (navigator.language || 'en').toLowerCase();
      saved = nav.indexOf('pl') === 0 ? 'pl' : nav.indexOf('de') === 0 ? 'de' : 'en';
    }
    setLang(saved);
  }

  AE.t = t;
  AE.tLabel = tLabel;
  AE.tDegree = tDegree;
  AE.setLang = setLang;
  AE.onLang = onLang;
  AE.applyStatic = applyStatic;
  AE.initLang = initLang;
  AE.getLang = () => lang;
  Object.defineProperty(AE, 'lang', { get: () => lang, set: (v) => { lang = v; }, configurable: true });
})();
