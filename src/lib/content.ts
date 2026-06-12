import { getCollection } from 'astro:content';

export type Lang = 'pl' | 'en' | 'de';

export async function postsByLang(lang: Lang) {
  const all = await getCollection('blog');
  return all
    .filter((p) => p.data.lang === lang)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export async function projectsByLang(lang: Lang) {
  const all = await getCollection('projects');
  return all.filter((p) => p.data.lang === lang);
}

export const blogSw = { pl: '/blog/', en: '/en/blog/', de: '/de/blog/' };
export const postSw = (key: string) => ({ pl: `/blog/${key}/`, en: `/en/blog/${key}/`, de: `/de/blog/${key}/` });
// Języki, w których wpis o danym key naprawdę istnieje (nie każdy wpis ma 3 wersje).
export async function postLangs(key: string): Promise<Set<Lang>> {
  const all = await getCollection('blog');
  return new Set(all.filter((p) => p.data.key === key).map((p) => p.data.lang as Lang));
}
// Przełącznik języka wpisu: realne tłumaczenie, a gdy go nie ma — lista bloga (zamiast 404).
export const postSwSafe = (key: string, langs: Set<Lang>) => ({
  pl: langs.has('pl') ? `/blog/${key}/` : blogSw.pl,
  en: langs.has('en') ? `/en/blog/${key}/` : blogSw.en,
  de: langs.has('de') ? `/de/blog/${key}/` : blogSw.de,
});
// hreflang wpisu: WYŁĄCZNIE wersje, które istnieją.
export const postHreflangs = (key: string, langs: Set<Lang>): Partial<Record<Lang, string>> => {
  const sw = postSw(key);
  return Object.fromEntries([...langs].map((l) => [l, sw[l]]));
};
export const labSw = (key: string) => ({ pl: `/projekty/${key}/`, en: `/en/projekty/${key}/`, de: `/de/projekty/${key}/` });

export async function reportsByLang(lang: Lang) {
  const all = await getCollection('reports');
  return all
    .filter((p) => p.data.lang === lang)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}
export const capitalSw = { pl: '/capital/', en: '/en/capital/', de: '/de/capital/' };
export const reportSw = (key: string) => ({ pl: `/capital/${key}/`, en: `/en/capital/${key}/`, de: `/de/capital/${key}/` });

export const kindLabel: Record<Lang, Record<string, string>> = {
  pl: { project: 'projekt', reflection: 'refleksja', trading: 'trading', investing: 'inwestowanie' },
  en: { project: 'project', reflection: 'reflection', trading: 'trading', investing: 'investing' },
  de: { project: 'Projekt', reflection: 'Reflexion', trading: 'Trading', investing: 'Investieren' },
};

export const blogText: Record<Lang, { title: string; lead: string; back: string; all: string }> = {
  pl: { title: 'Notatki', lead: "Krótkie zapiski o danych, AI i uczciwym budowaniu. Bez clickbaitu, za to z baseline'em i ograniczeniami.", back: '← strona główna', all: 'wszystkie wpisy' },
  en: { title: 'Notes', lead: 'Short notes on data, AI and honest building. No clickbait, but with a baseline and the limitations.', back: '← home', all: 'all notes' },
  de: { title: 'Notizen', lead: 'Kurze Notizen über Daten, KI und ehrliches Bauen. Kein Clickbait, dafür mit Baseline und Grenzen.', back: '← Startseite', all: 'alle Notizen' },
};
