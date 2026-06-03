// Wspolne etykiety UI (nav + stopka) w 3 jezykach + helper scalajacy ze stringami strony.
export const ui = {
  pl: {
    'nav.home': 'start', 'nav.about': 'o mnie', 'nav.work': 'oferta', 'nav.xray': 'prześwietlenie', 'nav.pracownia': 'pracownia', 'nav.projects': 'projekty', 'nav.zywy': 'order flow', 'nav.gambit': 'GAMBIT', 'nav.blog': 'blog', 'nav.contact': 'kontakt',
    'foot.tag': 'Solo studio. Narzędzia AI, strony i analiza danych. Najpierw testuję na sobie.',
    'foot.h1': 'Strona', 'foot.h2': 'Kontakt', 'foot.made': 'Wszystko robię osobiście, z dbałością.',
  },
  en: {
    'nav.home': 'home', 'nav.about': 'about', 'nav.work': 'services', 'nav.xray': 'x-ray', 'nav.pracownia': 'workshop', 'nav.projects': 'projects', 'nav.zywy': 'order flow', 'nav.gambit': 'GAMBIT', 'nav.blog': 'blog', 'nav.contact': 'contact',
    'foot.tag': 'Solo studio. AI tools, websites and data analysis. I test on myself first.',
    'foot.h1': 'Site', 'foot.h2': 'Contact', 'foot.made': 'Everything done personally, with care.',
  },
  de: {
    'nav.home': 'start', 'nav.about': 'über mich', 'nav.work': 'Leistungen', 'nav.xray': 'Röntgen', 'nav.pracownia': 'Werkstatt', 'nav.projects': 'Projekte', 'nav.zywy': 'order flow', 'nav.gambit': 'GAMBIT', 'nav.blog': 'Blog', 'nav.contact': 'Kontakt',
    'foot.tag': 'Solo-Studio. KI-Tools, Websites und Datenanalyse. Ich teste zuerst an mir selbst.',
    'foot.h1': 'Seite', 'foot.h2': 'Kontakt', 'foot.made': 'Alles persönlich gemacht, mit Sorgfalt.',
  },
};

type Dict = Record<string, Record<string, string>>;
export function withUi(page: Dict): Dict {
  return {
    pl: { ...ui.pl, ...(page.pl || {}) },
    en: { ...ui.en, ...(page.en || {}) },
    de: { ...ui.de, ...(page.de || {}) },
  };
}
